import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MODES, type GameConfig } from '../engine/game';
import { RACER_LIST } from '../engine/racers';
import { TRACKS, TRACK_IDS } from '../engine/tracks';
import type { Mode, Rules } from '../engine/types';
import { DEFAULT_RULES } from '../engine/heat';
import { PLAYER_COLOURS } from './art';
import { Modal, PlayerTag, Presence, Stars } from './bits';
import { Mascot } from './Mascot';
import { TrackThumb } from './Track';
import type { GameApi } from './useGame';

const MODE_INFO: Record<Mode, { title: string; sub: string; n: string }> = {
  standard: { title: 'Standard', sub: '4 racers each, 1 per heat', n: '3–6' },
  duel: { title: 'Duel', sub: '8 racers each, 2 per heat', n: '2' },
  trioDoubles: { title: 'Trio Doubles', sub: '8 racers each, 2 per heat', n: '3' },
};

const MOVE_INFO: { v: Rules['move']; t: string; s: string }[] = [
  { v: 'dice', t: 'Dice', s: 'Roll every turn. The classic game.' },
  { v: 'choice', t: 'Dice or cards', s: 'Each turn, roll or play a card. Each card 1–6 can be used once per heat.' },
  { v: 'cards', t: 'Cards only', s: 'No dice. Play cards 1–6; they come back once all six are used.' },
];
const RULE_INFO: { k: Exclude<keyof Rules, 'move'>; t: string; s: string }[] = [
  { k: 'duels', t: 'Space duels', s: 'Land on a rival and it is a reaction duel. The loser moves back 1.' },
  { k: 'boosts', t: 'Boost tokens', s: 'Three per player for the whole game. Spend one for +2.' },
  { k: 'sprint', t: 'Timing sprint', s: 'Once per heat, stop the needle for up to +3.' },
  { k: 'traps', t: 'Secret tiles', s: 'Before each heat, everyone hides one boost or mud tile on the track.' },
  { k: 'bidding', t: 'Bid to start', s: 'Secretly bid stars to go first in each heat.' },
  { k: 'forks', t: 'Shortcuts', s: 'Two tracks get a risky shortcut: Loop-de-Lagoon and Haunted Hairpins.' },
];
const BOT_NAMES = ['Bolt', 'Gizmo', 'Widget', 'Sprocket', 'Beep', 'Clank'];
const LETTER_COLOURS = ['#ff5d4a', '#ffc83d', '#17b8a6', '#4aa8ff', '#ff8fb5', '#8b5cf6', '#5ad66f'];

function Logo() {
  const word = (text: string, offset: number, size: string) => (
    <div className={`display ${size} flex justify-center`}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          className="inked inline-block"
          style={{ color: LETTER_COLOURS[(i + offset) % LETTER_COLOURS.length] }}
          initial={{ y: -200, rotate: -40, opacity: 0 }}
          animate={{ y: [0, -10, 0], rotate: [i % 2 ? 4 : -4, i % 2 ? -3 : 3, i % 2 ? 4 : -4], opacity: 1 }}
          transition={{
            y: { duration: 2.2, repeat: Infinity, delay: 0.9 + i * 0.12, ease: 'easeInOut' },
            rotate: { duration: 2.2, repeat: Infinity, delay: 0.9 + i * 0.12, ease: 'easeInOut' },
            opacity: { delay: (i + offset) * 0.06 },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
  return (
    <div className="relative select-none">
      {word('ODDBALL', 0, 'text-7xl sm:text-9xl')}
      <div className="-mt-2 sm:-mt-4">{word('DERBY', 3, 'text-7xl sm:text-9xl')}</div>
    </div>
  );
}

/** The whole roster marching along the bottom of the screen. */
function Parade() {
  const ids = RACER_LIST.map((r) => r.id);
  return (
    <div className="absolute bottom-0 inset-x-0 overflow-hidden pointer-events-none" style={{ height: 110 }}>
      <div className="absolute bottom-0 inset-x-0 h-7 stripes" style={{ borderTop: '4px solid var(--ink)' }} />
      <div className="marquee absolute bottom-5 flex gap-6" style={{ width: 'max-content' }}>
        {[...ids, ...ids].map((id, i) => <Mascot key={i} id={id} size={78} className="bob" />)}
      </div>
    </div>
  );
}

export function Menu({ api, onPlay, onSetup, onRules }: { api: GameApi; onPlay: () => void; onSetup: () => void; onRules: () => void }) {
  const [panel, setPanel] = useState<'history' | 'settings' | null>(null);
  const canResume = api.game && api.game.phase !== 'final';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-32 overflow-hidden relative">
      <Logo />
      <motion.div initial={{ scale: 0, rotate: 8 }} animate={{ scale: 1, rotate: -2 }} transition={{ delay: 0.7, type: 'spring' }} className="card flat px-4 py-1 mt-5 mb-7 font-black text-lg" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
        A ridiculous race where everybody cheats a little
      </motion.div>
      <motion.div className="flex flex-col gap-3 w-full max-w-xs" initial="a" animate="b" variants={{ b: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } } }}>
        {[
          canResume && <button className="btn big green w-full pulse" onClick={onPlay}>Resume game</button>,
          <button className={`btn big w-full ${canResume ? '' : 'pulse'}`} onClick={onSetup}>New game</button>,
          <div className="flex gap-2">
            <button className="btn ghost flex-1" onClick={onRules}>Rules</button>
            <button className="btn ghost flex-1" onClick={() => setPanel('history')}>Past games</button>
          </div>,
          <button className="btn ghost small self-center" onClick={() => setPanel('settings')}>Settings</button>,
        ].filter(Boolean).map((el, i) => (
          <motion.div key={i} className="flex flex-col" variants={{ a: { y: 40, opacity: 0 }, b: { y: 0, opacity: 1 } }}>{el}</motion.div>
        ))}
      </motion.div>
      <Parade />

      <Presence show={panel === 'settings'}>
        <Modal onClose={() => setPanel(null)}>
          <h2 className="display text-4xl mb-4">Settings</h2>
          <SettingsRows api={api} />
          <button className="btn mt-5 w-full" onClick={() => setPanel(null)}>Done</button>
        </Modal>
      </Presence>
      <Presence show={panel === 'history'}>
        <Modal onClose={() => setPanel(null)}>
          <h2 className="display text-4xl mb-4">Past games</h2>
          {api.history.length === 0 && <p className="font-bold opacity-70">No finished games yet.</p>}
          <div className="space-y-3">
            {api.history.map((h, i) => (
              <div key={i} className="card flat p-3">
                <div className="text-xs font-bold opacity-60">{new Date(h.date).toLocaleString()} · {MODE_INFO[h.mode as Mode]?.title ?? h.mode}</div>
                <div className="display text-xl mb-1">Winner: {h.winners.join(' & ')}</div>
                <div className="flex flex-wrap gap-2">
                  {h.players.map((p) => <PlayerTag key={p.name} p={p} small><Stars n={p.stars} /></PlayerTag>)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <button className="btn flex-1" onClick={() => setPanel(null)}>Done</button>
            {api.history.length > 0 && <button className="btn ghost" onClick={api.clearHistory}>Clear</button>}
          </div>
        </Modal>
      </Presence>
    </div>
  );
}

export function SettingsRows({ api }: { api: GameApi }) {
  const s = api.settings;
  const row = (label: string, help: string, on: boolean, toggle: () => void) => (
    <button className="card flat pick p-3 w-full flex items-center justify-between text-left" onClick={toggle}>
      <span><span className="display text-xl">{label}</span><br /><span className="text-sm font-bold opacity-70">{help}</span></span>
      <span className="relative shrink-0" style={{ width: 64, height: 34, borderRadius: 20, border: '3px solid var(--ink)', background: on ? 'var(--green)' : '#d7d2c4' }}>
        <motion.span layout className="absolute top-[2px]" style={{ left: on ? 32 : 2, width: 24, height: 24, borderRadius: 14, background: '#fff', border: '3px solid var(--ink)' }} />
      </span>
    </button>
  );
  return (
    <div className="space-y-3">
      {row('Animations', 'Turn off to resolve turns instantly.', s.anim, () => api.setSettings({ ...s, anim: !s.anim }))}
      {row('Sound', 'Dice, moves and fanfares.', s.sound, () => api.setSettings({ ...s, sound: !s.sound }))}
    </div>
  );
}

const Step = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <motion.section initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: n * 0.08 }} className="mb-7">
    <h2 className="display text-2xl mb-3 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white" style={{ background: 'var(--red)', border: '3px solid var(--ink)' }}>{n}</span>
      {title}
    </h2>
    {children}
  </motion.section>
);

export function Setup({ api, onBack, onStart }: { api: GameApi; onBack: () => void; onStart: () => void }) {
  const [mode, setMode] = useState<Mode>('standard');
  const [count, setCount] = useState(4);
  const [names, setNames] = useState<string[]>(['', '', '', '', '', '']);
  const [colours, setColours] = useState<string[]>(PLAYER_COLOURS.slice(0, 6));
  const [deal, setDeal] = useState(false);
  const [bots, setBots] = useState<boolean[]>([false, false, false, false, false, false]);
  const [tracks, setTracks] = useState<string[]>(TRACK_IDS);
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const m = MODES[mode];
  const n = Math.min(m.max, Math.max(m.min, count));

  const pickColour = (i: number, c: string) => {
    const next = [...colours];
    const j = next.indexOf(c);
    if (j >= 0) next[j] = next[i];
    next[i] = c;
    setColours(next);
  };
  const toggleTrack = (id: string) => {
    const next = tracks.includes(id) ? tracks.filter((t) => t !== id) : [...tracks, id];
    if (next.length) setTracks(next);
  };
  const start = () => {
    const cfg: GameConfig = {
      mode,
      players: Array.from({ length: n }, (_, i) => ({ name: names[i].trim() || (bots[i] ? BOT_NAMES[i] : `Player ${i + 1}`), colour: colours[i], bot: bots[i] })),
      beginnerDeal: deal,
      seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) | 0,
      tracks,
      rules,
    };
    api.newGame(cfg);
    onStart();
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="display inked text-5xl sm:text-6xl" style={{ color: 'var(--yellow)' }}>New game</h1>
        <button className="btn ghost small" onClick={onBack}>← Back</button>
      </div>

      <Step n={1} title="Game mode">
        <div className="grid sm:grid-cols-3 gap-4">
          {(Object.keys(MODE_INFO) as Mode[]).map((k) => (
            <button key={k} onClick={() => setMode(k)} className={`card pick p-4 text-left ${mode === k ? 'on' : ''}`}>
              <div className="display text-2xl">{MODE_INFO[k].title}</div>
              <div className="chip my-1" style={{ background: 'var(--yellow)' }}>{MODE_INFO[k].n} players</div>
              <div className="text-sm font-bold opacity-75">{MODE_INFO[k].sub}</div>
            </button>
          ))}
        </div>
      </Step>

      <Step n={2} title="Who's playing?">
        {m.min !== m.max && (
          <div className="flex gap-2 mb-4">
            {Array.from({ length: m.max - m.min + 1 }, (_, i) => m.min + i).map((k) => (
              <button key={k} className={`btn ${k === n ? 'red' : 'ghost'}`} onClick={() => setCount(k)}>{k}</button>
            ))}
          </div>
        )}
        <p className="font-bold opacity-75 mb-3">Tap <b>Human</b> to hand a seat to the computer. Play solo against as many as you like.</p>
        <div className="space-y-3">
          {Array.from({ length: n }, (_, i) => (
            <motion.div layout key={i} className="card flat p-3 flex flex-wrap items-center gap-3" style={{ borderLeft: `14px solid ${colours[i]}` }}>
              <input
                value={names[i]}
                onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={bots[i] ? BOT_NAMES[i] : `Player ${i + 1}`}
                maxLength={14}
                className="field flex-1 min-w-[140px]"
              />
              <button className={`btn small ${bots[i] ? 'teal' : 'ghost'}`} style={{ minWidth: 104 }} onClick={() => setBots(bots.map((b, j) => (j === i ? !b : b)))}>
                {bots[i] ? 'Computer' : 'Human'}
              </button>
              <div className="flex gap-1.5">
                {PLAYER_COLOURS.map((c) => (
                  <button
                    key={c}
                    aria-label={`Colour ${c}`}
                    onClick={() => pickColour(i, c)}
                    className="rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{ width: 30, height: 30, background: c, border: '3px solid var(--ink)', transform: colours[i] === c ? 'scale(1.25)' : undefined, opacity: colours[i] === c ? 1 : 0.45 }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </Step>

      <Step n={3} title="Teams">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { v: false, t: 'Snake draft', s: 'Take turns choosing racers from a shared pool.' },
            { v: true, t: 'Quick deal', s: 'Teams are dealt at random. Best for a first game.' },
          ].map((o) => (
            <button key={o.t} onClick={() => setDeal(o.v)} className={`card pick p-4 text-left ${deal === o.v ? 'on' : ''}`}>
              <div className="display text-2xl">{o.t}</div>
              <div className="text-sm font-bold opacity-75">{o.s}</div>
            </button>
          ))}
        </div>
      </Step>

      <Step n={4} title="Tracks">
        <p className="font-bold opacity-75 -mt-2 mb-3">Four heats are drawn from the tracks you leave switched on.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TRACK_IDS.map((id) => {
            const on = tracks.includes(id);
            return (
              <button key={id} onClick={() => toggleTrack(id)} className={`card pick p-2 text-left ${on ? 'on' : ''}`} style={{ opacity: on ? 1 : 0.5 }}>
                <TrackThumb id={id} width="100%" />
                <div className="display text-lg leading-tight mt-2">{TRACKS[id].name}</div>
                <div className="text-xs font-bold opacity-70 leading-snug">{TRACKS[id].blurb}</div>
              </button>
            );
          })}
        </div>
      </Step>

      <Step n={5} title="House rules">
        <p className="font-bold opacity-75 -mt-2 mb-3">Optional extras that add decisions and skill. Leave them off for the classic game.</p>
        <div className="display text-lg mb-2">How do racers move?</div>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {MOVE_INFO.map((o) => (
            <button key={o.v} onClick={() => setRules({ ...rules, move: o.v })} className={`card pick p-3 text-left ${rules.move === o.v ? 'on' : ''}`}>
              <div className="display text-xl">{o.t}</div>
              <div className="text-sm font-bold opacity-75 leading-snug">{o.s}</div>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {RULE_INFO.map((o) => (
            <button key={o.k} onClick={() => setRules({ ...rules, [o.k]: !rules[o.k] })} className={`card pick p-3 text-left flex items-center gap-3 ${rules[o.k] ? 'on' : ''}`}>
              <div className="flex-1">
                <div className="display text-xl">{o.t}</div>
                <div className="text-sm font-bold opacity-75 leading-snug">{o.s}</div>
              </div>
              <span className="chip" style={{ background: rules[o.k] ? 'var(--green)' : '#e2dccb', fontSize: 13 }}>{rules[o.k] ? 'ON' : 'OFF'}</span>
            </button>
          ))}
        </div>
      </Step>

      <button className="btn big green w-full pulse mb-8" onClick={start}>Start!</button>
    </div>
  );
}
