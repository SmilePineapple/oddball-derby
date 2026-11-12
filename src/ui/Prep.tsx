import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { maxBid, trapSpaces } from '../engine/game';
import { FINISH, TRACKS } from '../engine/tracks';
import type { GameState, Player } from '../engine/types';
import { SPACE_STYLE, THEMES } from './art';
import { INK } from './Mascot';
import { LAYOUTS } from './trackLayout';
import { TrackThumb } from './Track';
import type { GameApi } from './useGame';

/** Shared frame for the secret pre-heat steps: computer waits, then a handover, then the step itself. */
function Secret({ game, player, what, children }: { game: GameState; player: Player; what: string; children: ReactNode }) {
  const [ready, setReady] = useState<number | null>(null);
  const trackId = game.tracks[game.heatNumber - 1];
  const solo = game.players.filter((p) => !p.bot).length === 1;
  const header = (
    <div className="flex items-center gap-3 mb-4">
      <TrackThumb id={trackId} width={110} />
      <div className="text-left">
        <div className="chip" style={{ background: 'var(--yellow)' }}>Heat {game.heatNumber} of 4</div>
        <div className="display text-2xl leading-tight">{TRACKS[trackId].name}</div>
      </div>
    </div>
  );
  if (player.bot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {header}
        <div className="display text-4xl mt-6"><span className="inked-sm" style={{ color: player.colour }}>{player.name}</span> is deciding…</div>
      </div>
    );
  }
  if (!solo && ready !== player.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {header}
        <motion.div key={player.id} initial={{ scale: 0.3, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: -2, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="my-6">
          <div className="display text-3xl">Pass the device to</div>
          <div className="display inked text-7xl sm:text-9xl" style={{ color: player.colour }}>{player.name}</div>
        </motion.div>
        <div className="card flat px-4 py-2 font-black mb-7 max-w-md" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>🙈 Everyone else look away! {player.name} secretly {what}.</div>
        <button className="btn big pulse" onClick={() => setReady(player.id)}>I'm {player.name}</button>
      </div>
    );
  }
  return <div className="min-h-screen p-4 sm:p-6 pt-16 sm:pt-16 max-w-4xl mx-auto">{header}{children}</div>;
}

export function Bids({ api, game }: { api: GameApi; game: GameState }) {
  const b = game.bids!;
  const player = game.players[b.order[b.turn]];
  const top = maxBid(player);
  return (
    <Secret key={player.id} game={game} player={player} what="bids for the start">
      <h1 className="display text-4xl sm:text-5xl mb-1"><span className="inked-sm" style={{ color: player.colour }}>{player.name}</span>, bid to go first</h1>
      <p className="font-bold opacity-75 mb-5">
        The highest bidder pays their bid and starts the heat. Everyone else keeps their stars. You have <b>{player.stars}</b> star{player.stars === 1 ? '' : 's'}.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: top + 1 }, (_, n) => (
          <motion.button key={n} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: n * 0.07 }} className="card pick p-5 text-center" disabled={api.busy} onClick={() => api.act({ type: 'bid', amount: n })}>
            <div className="display text-5xl" style={{ color: n ? 'var(--yellow)' : undefined, WebkitTextStroke: n ? '2px var(--ink)' : undefined }}>{n ? '★'.repeat(n) : '—'}</div>
            <div className="display text-xl mt-1">{n ? `Bid ${n}` : 'No bid'}</div>
          </motion.button>
        ))}
      </div>
    </Secret>
  );
}

export function Traps({ api, game }: { api: GameApi; game: GameState }) {
  const t = game.traps!;
  const player = game.players[t.order[t.turn]];
  const [kind, setKind] = useState<'boost' | 'mud'>('boost');
  const [space, setSpace] = useState<number | null>(null);
  const trackId = game.tracks[game.heatNumber - 1];
  const L = LAYOUTS[trackId];
  const T = TRACKS[trackId];
  const theme = THEMES[trackId] ?? THEMES.plain;
  const free = trapSpaces(game);
  const mine = game.lineup?.picks[player.id] ?? [];

  return (
    <Secret key={player.id} game={game} player={player} what="places a tile">
      <h1 className="display text-4xl sm:text-5xl mb-1"><span className="inked-sm" style={{ color: player.colour }}>{player.name}</span>, place a tile</h1>
      <p className="font-bold opacity-75 mb-3">
        Choose a boost (forward 2) or mud (back 2), then tap an empty space. Tiles are revealed when the race starts.
        {mine.length > 0 && ' Think about where your own racer wants to land.'}
      </p>
      <div className="flex gap-3 mb-3">
        {(['boost', 'mud'] as const).map((k) => (
          <button key={k} className={`btn ${kind === k ? (k === 'boost' ? 'green' : 'red') : 'ghost'}`} onClick={() => setKind(k)}>
            {SPACE_STYLE[k].icon} {SPACE_STYLE[k].label}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 1000 640" className="w-full block" style={{ borderRadius: 24, border: '4px solid var(--ink)', background: `linear-gradient(${theme.sky[0]}, ${theme.sky[1]})`, boxShadow: '6px 6px 0 var(--ink)' }}>
        <path d={L.path} fill="none" stroke={INK} strokeWidth="78" strokeLinecap="round" strokeLinejoin="round" />
        <path d={L.path} fill="none" stroke={theme.ribbon} strokeWidth="60" strokeLinecap="round" strokeLinejoin="round" />
        {L.pts.map(([x, y], i) => {
          const def = T.spaces[i];
          const st = def ? SPACE_STYLE[def.type] : null;
          const ok = free.includes(i);
          const sel = space === i;
          return (
            <g key={i} onClick={ok ? () => setSpace(i) : undefined} style={{ cursor: ok ? 'pointer' : 'default' }} opacity={ok || sel ? 1 : 0.55}>
              <circle cx={x} cy={y} r={i === FINISH ? 38 : sel ? 32 : 26} fill={sel ? SPACE_STYLE[kind].fill : st ? st.fill : i === 0 ? '#ff8fb5' : theme.tile} stroke={INK} strokeWidth={sel ? 6 : 3.5} />
              <text x={x} y={y + 2} fontSize={sel || st ? 26 : 20} fontFamily="'Lilita One', sans-serif" textAnchor="middle" dominantBaseline="central" fill={INK} style={{ pointerEvents: 'none' }}>
                {sel ? SPACE_STYLE[kind].icon : st ? st.icon : i === 0 ? 'GO' : i === FINISH ? '🏁' : i}
              </text>
            </g>
          );
        })}
      </svg>
      <button className={`btn big green w-full mt-5 ${space !== null ? 'pulse' : ''}`} disabled={space === null || api.busy} onClick={() => space !== null && api.act({ type: 'placeTrap', space, kind })}>
        {space === null ? 'Tap a space' : `Place ${SPACE_STYLE[kind].label.toLowerCase()} on space ${space}`}
      </button>
    </Secret>
  );
}
