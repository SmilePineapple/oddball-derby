import type { Action, GameEvent, GameState, HeatSummary, Mode, Player, RacerId } from './types';
import { RACER_LIST } from './racers';
import { CARD_LIST } from './cards';
import { TRACK_IDS } from './tracks';
import { nextRand, shuffle } from './rng';
import { advanceHeat, createHeat } from './heat';

export const HEATS = 4;
export const MODES: Record<Mode, { min: number; max: number; team: number; perHeat: number }> = {
  standard: { min: 3, max: 6, team: 4, perHeat: 1 },
  duel: { min: 2, max: 2, team: 8, perHeat: 2 },
  trioDoubles: { min: 3, max: 3, team: 8, perHeat: 2 },
};

export interface GameConfig {
  mode: Mode;
  players: { name: string; colour: string; bot?: boolean }[];
  beginnerDeal: boolean;
  seed: number;
  /** Tracks to draw the four heats from. Defaults to all of them. */
  tracks?: string[];
}

export function createGame(cfg: GameConfig): GameState {
  const m = MODES[cfg.mode];
  const n = cfg.players.length;
  if (n < m.min || n > m.max) throw new Error(`${cfg.mode} needs ${m.min}–${m.max} players.`);
  const rng = { rng: cfg.seed | 0 };
  const players: Player[] = cfg.players.map((p, id) => ({ id, name: p.name, colour: p.colour, bot: !!p.bot, stars: 0, wins: 0, seconds: 0, team: [], used: [] }));
  const roster = shuffle(rng, RACER_LIST.map((r) => r.id));
  const pool = roster.slice(0, Math.min(roster.length, n * m.team + 2));
  const deck = shuffle(rng, CARD_LIST.map((c) => c.id));
  const startPlayer = Math.floor(nextRand(rng) * n);
  const trackPool = cfg.tracks?.filter((t) => TRACK_IDS.includes(t)) ?? [];
  let tracks: string[] = [];
  while (tracks.length < HEATS) tracks.push(...shuffle(rng, trackPool.length ? trackPool : TRACK_IDS));
  tracks = tracks.slice(0, HEATS);

  const g: GameState = {
    version: 2,
    mode: cfg.mode,
    players,
    phase: 'draft',
    draft: null,
    lineup: null,
    heatNumber: 1,
    tracks,
    heat: null,
    startPlayer,
    deck,
    rng: rng.rng,
    history: [],
    log: [],
  };

  if (cfg.beginnerDeal) {
    players.forEach((p, i) => (p.team = pool.slice(i * m.team, (i + 1) * m.team)));
    beginLineup(g);
  } else {
    const order: number[] = [];
    for (let round = 0; round < m.team; round++) {
      const seats = players.map((p) => p.id);
      order.push(...(round % 2 === 0 ? seats : seats.reverse()));
    }
    g.draft = { pool, order, pick: 0 };
  }
  return g;
}

function seatsFrom(g: GameState, start: number): number[] {
  const n = g.players.length;
  return g.players.map((_, i) => (start + i) % n);
}

function beginLineup(g: GameState): void {
  g.phase = 'lineup';
  g.draft = null;
  g.lineup = { picks: {}, order: seatsFrom(g, g.startPlayer), turn: 0 };
}

function draftPick(g: GameState, racerId: RacerId): void {
  const d = g.draft;
  if (g.phase !== 'draft' || !d) throw new Error('Not drafting.');
  const i = d.pool.indexOf(racerId);
  if (i < 0) throw new Error('That racer is not available.');
  d.pool.splice(i, 1);
  g.players[d.order[d.pick]].team.push(racerId);
  d.pick++;
  if (d.pick >= d.order.length) beginLineup(g);
}

function lineupPick(g: GameState, racerIds: RacerId[]): GameEvent[] {
  const l = g.lineup;
  if (g.phase !== 'lineup' || !l) throw new Error('Not choosing line-ups.');
  const m = MODES[g.mode];
  const p = g.players[l.order[l.turn]];
  if (racerIds.length !== m.perHeat || new Set(racerIds).size !== racerIds.length) throw new Error(`Pick ${m.perHeat} racer(s).`);
  for (const r of racerIds) if (!p.team.includes(r) || p.used.includes(r)) throw new Error('That racer is not available.');
  l.picks[p.id] = [...racerIds];
  l.turn++;
  if (l.turn < l.order.length) return [];

  // Everyone has picked: reveal and start the heat.
  const racers: { racerId: RacerId; ownerId: number }[] = [];
  for (let slot = 0; slot < m.perHeat; slot++) {
    for (const seat of l.order) racers.push({ racerId: l.picks[seat][slot], ownerId: seat });
  }
  for (const pl of g.players) pl.used.push(...l.picks[pl.id]);
  const rng = { rng: g.rng };
  const seed = Math.floor(nextRand(rng) * 2 ** 31);
  g.rng = rng.rng;
  g.heat = createHeat({
    racers,
    trackId: g.tracks[g.heatNumber - 1],
    heatNumber: g.heatNumber,
    seed,
    deck: g.deck,
    names: Object.fromEntries(g.players.map((x) => [x.id, x.name])),
  });
  g.lineup = null;
  g.phase = 'heat';
  const events = advanceHeat(g.heat);
  afterHeatStep(g);
  return events;
}

function afterHeatStep(g: GameState): void {
  const core = g.heat!.core;
  if (!core.over) return;
  const performance: Record<number, number> = {};
  for (const p of g.players) performance[p.id] = -1;
  for (const e of core.entrants) {
    const place = core.placings.indexOf(e.id);
    const score = place >= 0 ? 100 - place : e.status === 'out' ? -1 : e.space;
    performance[e.ownerId] = Math.max(performance[e.ownerId], score);
  }
  for (const p of g.players) p.stars += core.starsEarned[p.id] ?? 0;
  const placings = core.placings.map((id) => ({ racerId: core.entrants[id].racerId, ownerId: core.entrants[id].ownerId }));
  if (placings[0]) g.players[placings[0].ownerId].wins++;
  if (placings[1]) g.players[placings[1].ownerId].seconds++;
  const summary: HeatSummary = {
    heatNumber: g.heatNumber,
    trackId: core.trackId,
    placings,
    starsEarned: { ...core.starsEarned },
    performance,
  };
  g.history.push(summary);
  g.deck = [...core.deck];
  g.phase = 'heatResults';
}

function nextHeat(g: GameState): void {
  if (g.phase !== 'heatResults') throw new Error('The heat is not finished.');
  g.heat = null;
  if (g.heatNumber >= HEATS) {
    g.phase = 'final';
    return;
  }
  const last = g.history[g.history.length - 1];
  const fewest = Math.min(...g.players.map((p) => p.stars));
  const tied = g.players.filter((p) => p.stars === fewest);
  tied.sort((a, b) => last.performance[a.id] - last.performance[b.id] || a.id - b.id);
  g.startPlayer = tied[0].id;
  g.heatNumber++;
  beginLineup(g);
}

/** Final standings, best first. `winners` holds everyone tied on all tie-breaks. */
export function standings(g: GameState): { ranked: Player[]; winners: Player[] } {
  const cmp = (a: Player, b: Player) => b.stars - a.stars || b.wins - a.wins || b.seconds - a.seconds;
  const ranked = [...g.players].sort((a, b) => cmp(a, b) || a.id - b.id);
  return { ranked, winners: ranked.filter((p) => cmp(p, ranked[0]) === 0) };
}

/** The player who must act next, or null if nobody (results screens). */
export function currentPlayer(g: GameState): number | null {
  if (g.phase === 'draft' && g.draft) return g.draft.order[g.draft.pick];
  if (g.phase === 'lineup' && g.lineup) return g.lineup.order[g.lineup.turn];
  if (g.phase === 'heat' && g.heat?.choice) return g.heat.choice.playerId;
  return null;
}

/** The single entry point for the UI. Never mutates its input. */
export function dispatch(state: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  const g = structuredClone(state);
  let events: GameEvent[] = [];
  switch (action.type) {
    case 'draftPick':
      draftPick(g, action.racerId);
      break;
    case 'lineupPick':
      events = lineupPick(g, action.racerIds);
      break;
    case 'answer':
      if (g.phase !== 'heat' || !g.heat) throw new Error('No heat in progress.');
      events = advanceHeat(g.heat, action.option);
      afterHeatStep(g);
      break;
    case 'nextHeat':
      nextHeat(g);
      break;
  }
  for (const e of events) if (e.text) g.log.push(e.text);
  if (g.log.length > 400) g.log = g.log.slice(-400);
  return { state: g, events };
}
