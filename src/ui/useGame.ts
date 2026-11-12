import { useCallback, useEffect, useRef, useState } from 'react';
import { createGame, dispatch, standings, type GameConfig } from '../engine/game';
import { botAction } from '../engine/ai';
import type { Action, GameEvent, GameState, HeatCore } from '../engine/types';
import { FINISH } from '../engine/tracks';
import { setSound, sfx } from './sfx';

const SAVE = 'oddball.save';
const HISTORY = 'oddball.history';
const SETTINGS = 'oddball.settings';

export interface Settings {
  anim: boolean;
  sound: boolean;
  /** Show the board as a tilted 3D table. Defaults to on. */
  tilt?: boolean;
}
export interface HistoryEntry {
  date: string;
  mode: string;
  players: { name: string; colour: string; stars: number }[];
  winners: string[];
}
/** What the board is showing right now. Lags behind the engine while events play back. */
export interface View {
  spaces: Record<number, number>;
  gone: Record<number, 'finished' | 'out'>;
  dice: number[] | null;
  rolling: boolean;
  activeId: number | null;
  flash: number | null;
  cardReveal: string | null;
  banner: string | null;
  /** How each racer last arrived on its space, to pick the right animation. */
  kind: Record<number, 'hop' | 'warp'>;
  /** Speech bubble above a racer. */
  callout: { id: number; text: string; tone: 'good' | 'bad' | 'plain'; n: number } | null;
}

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function viewFromCore(core: HeatCore, dice: number[] | null = null): View {
  const v: View = { spaces: {}, gone: {}, dice, rolling: false, activeId: core.over ? null : core.order[core.active], flash: null, cardReveal: null, banner: null, kind: {}, callout: null };
  for (const e of core.entrants) {
    v.spaces[e.id] = e.status === 'finished' ? FINISH : e.space;
    if (e.status !== 'racing') v.gone[e.id] = e.status;
  }
  return v;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** @param playing false while the game screens are not showing, so computer players wait. */
export function useGame(playing = true) {
  const [game, setGame] = useState<GameState | null>(() => {
    const g = load<GameState | null>(SAVE, null);
    return g && g.version === 3 ? g : null;
  });
  const [view, setView] = useState<View | null>(() => (game?.heat ? viewFromCore(game.heat.core) : null));
  const [log, setLog] = useState<string[]>(() => game?.log ?? []);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(() => load(SETTINGS, { anim: true, sound: true }));
  const [history, setHistory] = useState<HistoryEntry[]>(() => load(HISTORY, []));

  const gameRef = useRef(game);
  const busyRef = useRef(false);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    setSound(settings.sound);
    document.documentElement.classList.toggle('no-anim', !settings.anim);
  }, [settings]);

  const setSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    store(SETTINGS, s);
  }, []);

  const patch = (p: Partial<View>) => setView((v) => (v ? { ...v, ...p } : v));
  const setSpace = (id: number, space: number, kind: 'hop' | 'warp' = 'hop') =>
    setView((v) => (v ? { ...v, spaces: { ...v.spaces, [id]: space }, kind: { ...v.kind, [id]: kind } } : v));
  const calloutN = useRef(0);
  const say = (id: number, text: string, tone: 'good' | 'bad' | 'plain' = 'plain') => patch({ callout: { id, text, tone, n: ++calloutN.current } });

  /** Show engine events one at a time. The engine has already decided everything. */
  const play = async (events: GameEvent[]) => {
    const anim = settingsRef.current.anim;
    const w = (ms: number) => (anim ? sleep(ms) : Promise.resolve());
    for (const ev of events) {
      if (ev.text) setLog((l) => [...l, ev.text].slice(-400));
      const id = ev.id as number;
      switch (ev.t) {
        case 'turnStart':
          patch({ activeId: id, dice: null, banner: null, callout: null });
          await w(250);
          break;
        case 'roll':
          if (ev.card) {
            // A move card is shown, not rolled.
            sfx.ability();
            patch({ dice: ev.dice as number[], rolling: false });
            await w(350);
            break;
          }
          sfx.roll();
          patch({ dice: ev.dice as number[], rolling: true });
          await w(650);
          patch({ rolling: false });
          await w(350);
          break;
        case 'dice':
          patch({ dice: ev.dice as number[] });
          break;
        case 'mainMove':
        case 'bonusMove': {
          // The engine lists every space visited, so shortcuts animate correctly.
          const steps = (ev.path as number[] | undefined) ?? [];
          const forward = (ev.to as number) >= (ev.from as number);
          const n = steps.length;
          const ms = n > 8 ? 70 : 130;
          for (const s of steps) {
            setSpace(id, s);
            if (anim) (forward ? sfx.step : sfx.back)();
            await w(ms);
          }
          await w(n ? 180 : 350);
          break;
        }
        case 'teleport':
          sfx.warp();
          setSpace(id, ev.to as number, 'warp');
          await w(650);
          break;
        case 'swap':
          sfx.warp();
          setSpace(ev.a as number, ev.aTo as number, 'warp');
          setSpace(ev.b as number, ev.bTo as number, 'warp');
          await w(750);
          break;
        case 'ability':
          sfx.ability();
          patch({ flash: id });
          say(id, ev.text.slice(ev.text.indexOf(': ') + 2), 'good');
          await w(950);
          patch({ flash: null });
          break;
        case 'space':
          say(id, ({ boost: 'Boost!', mud: 'Splat!', spring: 'Boing!', web: 'Stuck!' } as Record<string, string>)[ev.kind as string] ?? '!', ev.kind === 'boost' || ev.kind === 'spring' ? 'good' : 'bad');
          await w(500);
          break;
        case 'star':
          sfx.finish();
          say(id, '★ Bonus star!', 'good');
          await w(900);
          break;
        case 'blocked':
          say(id, 'Nope!');
          await w(600);
          break;
        case 'skip':
          say(id, 'Zzz… dazed', 'bad');
          await w(800);
          break;
        case 'dazed':
        case 'crash':
        case 'marbles':
          sfx.daze();
          patch({ flash: id });
          say(id, ev.t === 'crash' ? 'Crash!' : ev.t === 'marbles' ? 'Marbles!' : 'Dazed!', 'bad');
          await w(750);
          patch({ flash: null });
          break;
        case 'card':
          sfx.card();
          patch({ cardReveal: ev.cardId as string });
          await w(2600);
          patch({ cardReveal: null });
          break;
        case 'finished':
          sfx.finish();
          setView((v) => (v ? { ...v, spaces: { ...v.spaces, [id]: FINISH }, gone: { ...v.gone, [id]: 'finished' }, banner: ev.text } : v));
          await w(1400);
          patch({ banner: null });
          break;
        case 'knockedOut':
          sfx.out();
          setView((v) => (v ? { ...v, gone: { ...v.gone, [id]: 'out' }, banner: ev.text } : v));
          await w(1200);
          patch({ banner: null });
          break;
        case 'boost':
          sfx.ability();
          say(id, '⚡ Boost +2!', 'good');
          await w(700);
          break;
        case 'sprint':
          say(id, `Sprint +${ev.bonus}!`, 'good');
          await w(700);
          break;
        case 'fork':
          say(id, 'Shortcut!', 'good');
          await w(600);
          break;
        case 'duel':
          sfx.ability();
          say(id, 'Wins the duel!', 'good');
          await w(900);
          break;
        case 'heatOver':
          await w(600);
          break;
        default:
          if (ev.text) await w(450);
      }
    }
  };

  const act = useCallback(async (action: Action) => {
    const prev = gameRef.current;
    if (busyRef.current || !prev) return;
    let res: ReturnType<typeof dispatch>;
    try {
      res = dispatch(prev, action);
    } catch (e) {
      console.error(e);
      return;
    }
    const next = res.state;
    gameRef.current = next;
    busyRef.current = true;
    setBusy(true);
    setGame(next);
    store(SAVE, next);
    let dice: number[] | null | undefined;
    if (next.heat && prev.phase !== 'heat') {
      const start = viewFromCore(next.heat.base);
      for (const k of Object.keys(start.spaces)) start.spaces[+k] = 0;
      setView(start);
      setIntro(true);
    }
    if (res.events.length) {
      await play(res.events);
      // The dice to leave on show: the last roll of the turn now in progress.
      for (const e of res.events) {
        if (e.t === 'turnStart') dice = null;
        else if (e.t === 'dice') dice = e.dice as number[];
      }
    }
    if (next.heat) {
      const core = next.heat.core;
      setView((v) => viewFromCore(core, dice === undefined ? v?.dice ?? null : dice));
    }
    if (action.type === 'nextHeat' && next.phase === 'final') {
      const entry: HistoryEntry = {
        date: new Date().toISOString(),
        mode: next.mode,
        players: next.players.map((p) => ({ name: p.name, colour: p.colour, stars: p.stars })),
        winners: standings(next).winners.map((p) => p.name),
      };
      setHistory((h) => {
        const all = [entry, ...h].slice(0, 50);
        store(HISTORY, all);
        return all;
      });
    }
    busyRef.current = false;
    setBusy(false);
  }, []);

  // Computer players take their own turns after a short pause.
  useEffect(() => {
    if (!playing || !game || busy || intro) return;
    const action = botAction(game);
    if (!action) return;
    const t = setTimeout(() => act(action), settings.anim ? 800 : 60);
    return () => clearTimeout(t);
  }, [playing, game, busy, intro, settings.anim, act]);

  const newGame = useCallback((cfg: GameConfig) => {
    const g = createGame(cfg);
    gameRef.current = g;
    setGame(g);
    setView(null);
    setLog([]);
    store(SAVE, g);
  }, []);

  const endGame = useCallback(() => {
    gameRef.current = null;
    setGame(null);
    setView(null);
    setLog([]);
    store(SAVE, null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    store(HISTORY, null);
  }, []);

  return { game, view, log, busy, intro, dismissIntro: () => setIntro(false), act, newGame, endGame, settings, setSettings, history, clearHistory };
}

export type GameApi = ReturnType<typeof useGame>;
