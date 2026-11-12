import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RACERS } from '../engine/racers';
import type { Player } from '../engine/types';
import { tint } from './art';
import { Mascot } from './Mascot';

export function Portrait({ id, size = 64, ring, lively }: { id: string; size?: number; ring?: string; lively?: boolean }) {
  const b = Math.max(2, Math.round(size * 0.045));
  return (
    <div
      className="shrink-0 flex items-end justify-center select-none"
      style={{
        width: size, height: size, borderRadius: size * 0.26, background: tint(id),
        border: `${b}px solid var(--ink)`, boxShadow: ring ? `0 0 0 ${b + 1}px ${ring}, 0 0 0 ${b * 2 + 1}px var(--ink)` : undefined,
        overflow: 'hidden',
      }}
    >
      <Mascot id={id} size={size * 0.86} className={lively ? 'bob' : undefined} />
    </div>
  );
}

export function PlayerTag({ p, children, small }: { p: Pick<Player, 'name' | 'colour'> & { bot?: boolean }; children?: ReactNode; small?: boolean }) {
  return (
    <span className="tag" style={{ background: p.colour, fontSize: small ? 12 : undefined, padding: small ? '0 8px' : undefined }}>
      {p.name}
      {p.bot && <span style={{ fontSize: 9, background: 'var(--ink)', borderRadius: 6, padding: '0 4px', textShadow: 'none' }}>CPU</span>}
      {children}
    </span>
  );
}

const LIMIT: Record<string, string> = { none: '', oncePerTurn: 'Once per turn', oncePerHeat: 'Once per heat' };

export function RacerCard({
  id, selected, dim, onClick, compact, ring,
}: { id: string; selected?: boolean; dim?: boolean; onClick?: () => void; compact?: boolean; ring?: string }) {
  const r = RACERS[id];
  const live = !!onClick && !dim;
  return (
    <button
      type="button"
      onClick={live ? onClick : undefined}
      className={`card text-left p-3 flex gap-3 items-start w-full ${live ? 'pick' : ''} ${selected ? 'on' : ''}`}
      style={{ opacity: dim ? 0.4 : 1, cursor: live ? 'pointer' : 'default', filter: dim ? 'grayscale(0.8)' : undefined }}
    >
      <div className={live ? 'wiggle' : undefined}><Portrait id={id} size={compact ? 52 : 76} ring={ring} /></div>
      <div className="min-w-0">
        <div className="display text-xl leading-tight">{r.name}</div>
        {!compact && <div className="text-xs italic opacity-60 mb-1">{r.blurb}</div>}
        <div className="text-sm font-bold leading-snug">{r.rulesText}</div>
        {!compact && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="chip">{r.trigger}</span>
            <span className="chip" style={{ background: r.optional ? '#d8f5d2' : '#fff' }}>{r.optional ? 'Your choice' : 'Automatic'}</span>
            {LIMIT[r.limit] && <span className="chip" style={{ background: '#ffe1dc' }}>{LIMIT[r.limit]}</span>}
          </div>
        )}
      </div>
    </button>
  );
}

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(42,31,61,.72)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`card scroll p-5 w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        style={{ boxShadow: '8px 8px 0 var(--ink)' }}
        initial={{ scale: 0.7, y: 40, rotate: -3 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
/** Cube rotation (x, y) that brings each face to the front. */
const FACE_ROT: Record<number, [number, number]> = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
const FACE_POS: Record<number, string> = {
  1: 'rotateY(0deg)', 6: 'rotateY(180deg)', 2: 'rotateY(90deg)', 5: 'rotateY(-90deg)', 3: 'rotateX(90deg)', 4: 'rotateX(-90deg)',
};

/** A real 3D die that tumbles and lands on its value. */
export function Die({ value, rolling, size = 76, colour = '#fff' }: { value: number; rolling?: boolean; size?: number; colour?: string }) {
  const [rx, ry] = FACE_ROT[value] ?? [0, 0];
  const h = size / 2;
  return (
    <div style={{ width: size, height: size, perspective: size * 5 }}>
      <motion.div
        style={{ width: size, height: size, position: 'relative', transformStyle: 'preserve-3d' }}
        animate={
          rolling
            ? { rotateX: [0, 360, 720], rotateY: [0, 540, 1080], y: [0, -size * 0.45, 0, -size * 0.2, 0] }
            : { rotateX: rx + 360, rotateY: ry + 360, y: 0 }
        }
        transition={rolling ? { duration: 0.65, ease: 'linear', repeat: Infinity } : { type: 'spring', stiffness: 170, damping: 13 }}
      >
        {[1, 2, 3, 4, 5, 6].map((f) => (
          <div
            key={f}
            className="grid grid-cols-3 grid-rows-3"
            style={{
              position: 'absolute', inset: 0, padding: size * 0.15, gap: size * 0.03, borderRadius: size * 0.2,
              background: colour, border: '3px solid var(--ink)', backfaceVisibility: 'hidden',
              transform: `${FACE_POS[f]} translateZ(${h}px)`, boxShadow: 'inset -4px -5px 0 rgba(42,31,61,.12)',
            }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="rounded-full" style={{ background: PIPS[f].includes(i) ? (f === 1 ? 'var(--red)' : 'var(--ink)') : 'transparent' }} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/** A star count that pops when it changes. */
export function Stars({ n, big }: { n: number; big?: boolean }) {
  return (
    <motion.span
      key={n}
      initial={{ scale: 1.9, rotate: -14 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 12 }}
      className="display inline-block whitespace-nowrap"
      style={{ color: 'var(--yellow)', WebkitTextStroke: '1px var(--ink)', fontSize: big ? '1.6em' : undefined, textShadow: '1.5px 1.5px 0 var(--ink)' }}
    >
      ★ {n}
    </motion.span>
  );
}

export function Presence({ show, children }: { show: boolean; children: ReactNode }) {
  return <AnimatePresence>{show && children}</AnimatePresence>;
}

const BITS = ['#ff5d4a', '#ffc83d', '#17b8a6', '#4aa8ff', '#ff8fb5', '#8b5cf6'];

/** A one-off burst of confetti from the centre of its container. */
export function Burst({ n = 34 }: { n?: number }) {
  const [parts] = useState(() =>
    Array.from({ length: n }, (_, i) => ({ a: (Math.PI * 2 * i) / n + Math.random(), d: 140 + Math.random() * 260, r: Math.random() * 720 - 360, c: BITS[i % BITS.length], s: 8 + Math.random() * 10 })),
  );
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
      {parts.map((p, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', width: p.s, height: p.s * 0.6, background: p.c, border: '2px solid var(--ink)', borderRadius: 3 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(p.a) * p.d, y: Math.sin(p.a) * p.d + 160, opacity: 0, rotate: p.r }}
          transition={{ duration: 1.5, ease: [0.1, 0.7, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

/** Falling confetti that loops forever. */
export function Rain({ n = 44 }: { n?: number }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: n }, (_, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: `${(i * 31) % 100}%`, top: -30, width: 12, height: 8, background: BITS[i % BITS.length], border: '2px solid var(--ink)', borderRadius: 3 }}
          animate={{ y: ['0vh', '112vh'], rotate: [0, 540 * (i % 2 ? 1 : -1)], x: [0, (i % 3 - 1) * 60] }}
          transition={{ duration: 3 + (i % 7) * 0.5, delay: (i % 11) * 0.3, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

/** Runs a callback once after mount, for staged intros. */
export function useAfter(ms: number, fn: () => void, on: boolean) {
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
}
