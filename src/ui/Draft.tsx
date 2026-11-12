import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MODES } from '../engine/game';
import { RACERS } from '../engine/racers';
import { TRACKS } from '../engine/tracks';
import type { GameState } from '../engine/types';
import { PlayerTag, Portrait, RacerCard } from './bits';
import { Mascot } from './Mascot';
import { TrackThumb } from './Track';
import type { GameApi } from './useGame';

export function Draft({ api, game }: { api: GameApi; game: GameState }) {
  const d = game.draft!;
  const [sel, setSel] = useState<string | null>(null);
  const player = game.players[d.order[d.pick]];
  const chosen = sel && d.pool.includes(sel) ? sel : null;
  const teamSize = MODES[game.mode].team;

  return (
    <div className="min-h-screen p-4 sm:p-6 pt-16 sm:pt-16 pb-36 max-w-7xl mx-auto">
      <div className="mb-5">
        <div className="chip mb-2" style={{ background: 'var(--yellow)' }}>Draft · pick {d.pick + 1} of {d.order.length}</div>
        <AnimatePresence initial={false}>
          <motion.h1 key={player.id + '-' + d.pick} initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.18 }} className="display text-4xl sm:text-6xl">
            <span className="inked-sm" style={{ color: player.colour }}>{player.name}</span>{player.bot ? ' is picking…' : ', pick a racer!'}
          </motion.h1>
        </AnimatePresence>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          <AnimatePresence>
            {d.pool.map((id) => (
              <motion.div layout key={id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0, rotate: 12, y: -60 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
                <RacerCard id={id} selected={chosen === id} onClick={player.bot ? undefined : () => setSel(id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <div className="space-y-4 lg:sticky lg:top-16 self-start">
          {game.players.map((p) => (
            <div key={p.id} className="card flat p-3" style={{ background: p.id === player.id ? '#fff1b8' : undefined, transform: p.id === player.id ? 'rotate(-1deg) scale(1.03)' : undefined, transition: 'transform .2s' }}>
              <div className="flex items-center justify-between mb-2"><PlayerTag p={p} /><span className="font-black opacity-50">{p.team.length}/{teamSize}</span></div>
              <div className="flex flex-wrap gap-2">
                {p.team.map((id) => (
                  <motion.div key={id} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} title={`${RACERS[id].name}: ${RACERS[id].rulesText}`}>
                    <Portrait id={id} size={44} />
                  </motion.div>
                ))}
                {Array.from({ length: teamSize - p.team.length }, (_, i) => <div key={i} style={{ width: 44, height: 44, borderRadius: 12, border: '3px dashed rgba(42,31,61,.3)' }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {chosen && !player.bot && (
          <motion.div key={chosen} initial={{ y: 140 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="fixed bottom-0 inset-x-0 p-4 z-40 pointer-events-none">
            <div className="card max-w-2xl mx-auto p-3 flex items-center gap-4 pointer-events-auto" style={{ background: '#fff1b8', boxShadow: '7px 7px 0 var(--ink)' }}>
              <Mascot key={chosen} id={chosen} size={84} className="bob" />
              <div className="flex-1 min-w-0">
                <div className="display text-2xl leading-tight">{RACERS[chosen].name}</div>
                <div className="text-sm font-bold leading-snug">{RACERS[chosen].rulesText}</div>
              </div>
              <button className="btn big green" disabled={api.busy} onClick={() => { api.act({ type: 'draftPick', racerId: chosen }); setSel(null); }}>Draft!</button>
            </div>
          </motion.div>
      )}
    </div>
  );
}

export function Lineup({ api, game }: { api: GameApi; game: GameState }) {
  const l = game.lineup!;
  const player = game.players[l.order[l.turn]];
  const need = MODES[game.mode].perHeat;
  const [ready, setReady] = useState<number | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const trackId = game.tracks[game.heatNumber - 1];
  const track = TRACKS[trackId];
  // With one human there is nobody to hide the choice from.
  const solo = game.players.filter((p) => !p.bot).length === 1;
  const isReady = solo || ready === player.id;

  const toggle = (id: string) => {
    if (picks.includes(id)) setPicks(picks.filter((x) => x !== id));
    else if (need === 1) setPicks([id]);
    else if (picks.length < need) setPicks([...picks, id]);
  };
  const confirm = () => {
    api.act({ type: 'lineupPick', racerIds: picks });
    setPicks([]);
    setReady(null);
  };

  const header = (
    <div className="flex items-center gap-3 mb-4">
      <TrackThumb id={trackId} width={110} />
      <div>
        <div className="chip" style={{ background: 'var(--yellow)' }}>Heat {game.heatNumber} of 4</div>
        <div className="display text-2xl leading-tight">{track.name}</div>
        <div className="text-sm font-bold opacity-70">{track.blurb}</div>
      </div>
    </div>
  );

  if (player.bot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {header}
        <div className="display text-4xl mt-6"><span className="inked-sm" style={{ color: player.colour }}>{player.name}</span> is choosing…</div>
      </div>
    );
  }
  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {header}
        <motion.div key={player.id} initial={{ scale: 0.3, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: -2, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="my-6">
          <div className="display text-3xl">Pass the device to</div>
          <div className="display inked text-7xl sm:text-9xl" style={{ color: player.colour }}>{player.name}</div>
        </motion.div>
        <div className="card flat px-4 py-2 font-black mb-7 max-w-md" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
          🙈 Everyone else look away! {player.name} secretly picks {need === 1 ? 'a racer' : `${need} racers`}.
        </div>
        <button className="btn big pulse" onClick={() => { setPicks([]); setReady(player.id); }}>I'm {player.name} — show my team</button>
        <div className="flex gap-2 mt-8">
          {l.order.map((id, i) => (
            <div key={id} style={{ width: 18, height: 18, borderRadius: 9, border: '3px solid var(--ink)', background: i < l.turn ? game.players[id].colour : 'transparent' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pt-16 sm:pt-16 max-w-4xl mx-auto">
      {header}
      <h1 className="display text-4xl sm:text-5xl mb-1"><span className="inked-sm" style={{ color: player.colour }}>{player.name}</span>, who races?</h1>
      <p className="font-bold opacity-75 mb-4">Pick {need === 1 ? 'one racer' : `${need} racers`}. Each racer runs in only one heat.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {player.team.map((id, i) => {
          const used = player.used.includes(id);
          return (
            <motion.div key={id} className="relative" initial={{ y: 40, opacity: 0, rotate: i % 2 ? 3 : -3 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: i * 0.07, type: 'spring', stiffness: 240, damping: 20 }}>
              <RacerCard id={id} dim={used} selected={picks.includes(id)} onClick={() => toggle(id)} />
              {used && <div className="chip absolute top-2 right-3" style={{ background: 'var(--ink)', color: '#fff' }}>Already raced</div>}
            </motion.div>
          );
        })}
      </div>
      <button className={`btn big green w-full ${picks.length === need ? 'pulse' : ''}`} disabled={picks.length !== need || api.busy} onClick={confirm}>Lock in</button>
    </div>
  );
}
