import { motion } from 'framer-motion';
import { standings } from '../engine/game';
import { RACERS } from '../engine/racers';
import { TRACKS } from '../engine/tracks';
import type { GameState } from '../engine/types';
import { PlayerTag, Portrait, Rain, Stars } from './bits';
import { Mascot } from './Mascot';
import type { GameApi } from './useGame';

/** A podium block with the racer standing on top. */
function Podium({ racerId, colour, name, place, delay }: { racerId: string; colour: string; name: string; place: 1 | 2; delay: number }) {
  const h = place === 1 ? 170 : 115;
  return (
    <div className="flex flex-col items-center" style={{ width: 170 }}>
      <motion.div initial={{ y: -260, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: delay + 0.45, type: 'spring', stiffness: 220, damping: 11 }} className="flex flex-col items-center -mb-2 relative z-10">
        <div className="display text-lg leading-tight text-center">{RACERS[racerId].name}</div>
        <Mascot id={racerId} size={place === 1 ? 120 : 96} className="bob" />
      </motion.div>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: h }}
        transition={{ delay, type: 'spring', stiffness: 120, damping: 14 }}
        className="w-full flex flex-col items-center justify-start pt-2 overflow-hidden"
        style={{ background: place === 1 ? 'var(--yellow)' : '#d7dbe6', border: '4px solid var(--ink)', borderRadius: '18px 18px 0 0', boxShadow: '5px 0 0 var(--ink)' }}
      >
        <div className="display text-5xl">{place}</div>
        <span className="tag" style={{ background: colour, fontSize: 13 }}>{name}</span>
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1] }} transition={{ delay: delay + 0.9 }} className="display text-2xl mt-1">+{place === 1 ? 4 : 2} ★</motion.div>
      </motion.div>
    </div>
  );
}

export function HeatResults({ api, game }: { api: GameApi; game: GameState }) {
  const h = game.history[game.history.length - 1];
  const ranked = [...game.players].sort((a, b) => b.stars - a.stars);
  const last = game.heatNumber >= 4;
  const [first, second] = h.placings;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 max-w-2xl mx-auto">
      <div className="chip" style={{ background: 'var(--yellow)' }}>Heat {h.heatNumber} of 4 · {TRACKS[h.trackId].name}</div>
      <motion.h1 initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="display inked text-6xl sm:text-7xl mb-4" style={{ color: 'var(--red)' }}>
        Results
      </motion.h1>

      <div className="flex items-end justify-center gap-3 mb-0" style={{ minHeight: 300 }}>
        {second && <Podium racerId={second.racerId} colour={game.players[second.ownerId].colour} name={game.players[second.ownerId].name} place={2} delay={0.2} />}
        {first && <Podium racerId={first.racerId} colour={game.players[first.ownerId].colour} name={game.players[first.ownerId].name} place={1} delay={0.7} />}
        {!first && <div className="card p-4 display text-2xl">Nobody finished!</div>}
      </div>
      <div className="w-full h-3 stripes mb-6" style={{ border: '3px solid var(--ink)', borderRadius: 8 }} />

      <div className="card w-full p-4 mb-6">
        <div className="display text-2xl mb-2">Standings</div>
        {ranked.map((p, i) => (
          <motion.div key={p.id} layout initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.4 + i * 0.12 }} className="flex items-center justify-between py-1.5 text-lg" style={{ borderTop: i ? '2px dashed rgba(42,31,61,.2)' : undefined }}>
            <span className="flex items-center gap-2"><span className="display w-6 text-center opacity-50">{i + 1}</span><PlayerTag p={p} /></span>
            <span className="flex items-center gap-3">
              {(h.starsEarned[p.id] ?? 0) > 0 && <span className="chip" style={{ background: 'var(--green)' }}>+{h.starsEarned[p.id]}</span>}
              <Stars n={p.stars} big />
            </span>
          </motion.div>
        ))}
      </div>

      <button className="btn big green w-full pulse" onClick={() => api.act({ type: 'nextHeat' })}>{last ? 'Final results!' : `On to heat ${game.heatNumber + 1}`}</button>
    </div>
  );
}

export function Final({ game, onDone }: { game: GameState; onDone: () => void }) {
  const { ranked, winners } = standings(game);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 max-w-2xl mx-auto relative">
      <Rain />
      <div className="chip relative" style={{ background: 'var(--ink)', color: '#fff' }}>Grand Prix complete</div>
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 9, delay: 0.2 }} className="relative my-2">
        <svg viewBox="0 0 120 120" width="130" height="130" className="bob">
          <path d="M30,14 H90 V46 a30,30 0 0 1 -60,0Z" fill="#ffc83d" stroke="#2a1f3d" strokeWidth="5" strokeLinejoin="round" />
          <path d="M30,22 H12 a16,16 0 0 0 20,26 M90,22 H108 a16,16 0 0 1 -20,26" fill="none" stroke="#2a1f3d" strokeWidth="5" strokeLinecap="round" />
          <path d="M52,76 h16 v16 h14 v14 H38 v-14 h14Z" fill="#ffc83d" stroke="#2a1f3d" strokeWidth="5" strokeLinejoin="round" />
          <path d="M60,26 l4,10 l10,1 l-8,7 l3,10 l-9,-6 l-9,6 l3,-10 l-8,-7 l10,-1Z" fill="#fff" stroke="#2a1f3d" strokeWidth="3" strokeLinejoin="round" className="twinkle" />
        </svg>
      </motion.div>
      <motion.h1 initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 8, delay: 0.5 }} className="display text-5xl sm:text-7xl text-center mb-6 relative">
        {winners.map((w, i) => (<span key={w.id}>{i > 0 && ' & '}<span className="inked" style={{ color: w.colour }}>{w.name}</span></span>))}
        <br />{winners.length > 1 ? 'share the win!' : 'wins!'}
      </motion.h1>

      <div className="w-full space-y-3 mb-7 relative">
        {ranked.map((p, i) => (
          <motion.div key={p.id} initial={{ y: 50, opacity: 0, rotate: i % 2 ? 2 : -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.9 + i * 0.2, type: 'spring' }} className="card p-3 flex items-center gap-3" style={{ borderLeft: `14px solid ${p.colour}`, background: i === 0 ? '#fff1b8' : undefined }}>
            <div className="display text-4xl w-9 text-center">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <PlayerTag p={p} />
              <div className="text-xs font-bold opacity-70 mt-1">{p.wins} win{p.wins === 1 ? '' : 's'} · {p.seconds} second place{p.seconds === 1 ? '' : 's'}</div>
            </div>
            <div className="hidden sm:flex gap-1">{p.team.slice(0, 8).map((id) => <Portrait key={id} id={id} size={32} />)}</div>
            <div className="text-xl"><Stars n={p.stars} big /></div>
          </motion.div>
        ))}
      </div>
      <button className="btn big relative" onClick={onDone}>Back to menu</button>
    </div>
  );
}
