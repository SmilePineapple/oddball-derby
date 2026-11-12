import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mascot } from './Mascot';
import { sfx } from './sfx';

export interface Dueller {
  name: string;
  colour: string;
  bot: boolean;
  racerId: string;
}

/**
 * Reaction duel for two players on one screen. Wait for GO, then be first to
 * hit your side. Going early loses. Calls onDone with the winning side.
 */
export function Duel({ a, b, onDone }: { a: Dueller; b: Dueller; onDone: (winner: 0 | 1) => void }) {
  const [phase, setPhase] = useState<'ready' | 'go' | 'done'>('ready');
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [early, setEarly] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const sides = [a, b];

  const press = (side: 0 | 1) => {
    if (phaseRef.current === 'done') return;
    const falseStart = phaseRef.current === 'ready';
    const w = falseStart ? ((1 - side) as 0 | 1) : side;
    phaseRef.current = 'done';
    setEarly(falseStart);
    setWinner(w);
    setPhase('done');
    sfx.finish();
    setTimeout(() => onDone(w), 1700);
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = 1600 + Math.random() * 2600;
    timers.push(setTimeout(() => {
      if (phaseRef.current !== 'ready') return;
      phaseRef.current = 'go';
      setPhase('go');
      sfx.card();
    }, wait));
    // A computer opponent reacts like a fairly quick person.
    sides.forEach((s, i) => {
      if (s.bot) timers.push(setTimeout(() => press(i as 0 | 1), wait + 300 + Math.random() * 330));
    });
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === 'KeyA' && !a.bot) press(0);
      if (ev.code === 'KeyL' && !b.bot) press(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div className="fixed inset-0 z-50 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {sides.map((s, i) => (
        <button
          key={i}
          disabled={s.bot || phase === 'done'}
          onPointerDown={() => !s.bot && press(i as 0 | 1)}
          className="flex-1 flex flex-col items-center justify-center gap-3 select-none"
          style={{ background: s.colour, border: 'none', borderRight: i === 0 ? '6px solid var(--ink)' : undefined, cursor: s.bot ? 'default' : 'pointer', filter: winner !== null && winner !== i ? 'grayscale(0.8) brightness(0.7)' : undefined, touchAction: 'none' }}
        >
          <motion.div animate={winner === i ? { y: [0, -30, 0], rotate: [0, -8, 8, 0] } : phase === 'ready' ? { rotate: [-3, 3, -3] } : {}} transition={{ duration: 0.6, repeat: Infinity }}>
            <Mascot id={s.racerId} size={150} />
          </motion.div>
          <div className="display inked text-4xl sm:text-6xl">{s.name}</div>
          <div className="card flat px-4 py-1 display text-xl">
            {s.bot ? 'Computer' : phase === 'done' ? (winner === i ? 'Winner!' : early ? 'Too early!' : 'Too slow!') : `TAP HERE · key ${i === 0 ? 'A' : 'L'}`}
          </div>
        </button>
      ))}
      <div className="absolute inset-x-0 top-[8%] flex justify-center pointer-events-none">
        <motion.div
          key={phase}
          initial={{ scale: 0.3, rotate: -10 }}
          animate={{ scale: 1, rotate: phase === 'go' ? [0, -4, 4, 0] : -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12 }}
          className="card display text-center px-8 py-3"
          style={{ fontSize: 'min(13vw, 110px)', lineHeight: 1, background: phase === 'go' ? 'var(--green)' : phase === 'done' ? 'var(--yellow)' : '#fff', boxShadow: '8px 8px 0 var(--ink)' }}
        >
          {phase === 'ready' ? 'Wait for it…' : phase === 'go' ? 'GO!' : `${sides[winner!].name} wins!`}
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
        <div className="card flat px-4 py-1 font-black text-center">Duel! First to tap after GO wins. Tap early and you lose. The loser moves back 1.</div>
      </div>
    </motion.div>
  );
}

const zone = (p: number): 0 | 1 | 2 | 3 => {
  const d = Math.abs(p - 0.5);
  return d < 0.05 ? 3 : d < 0.14 ? 2 : d < 0.27 ? 1 : 0;
};

/** Timing meter: stop the needle as close to the middle as you can. */
export function Meter({ onDone, colour }: { onDone: (bonus: 0 | 1 | 2 | 3) => void; colour: string }) {
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<0 | 1 | 2 | 3 | null>(null);
  const posRef = useRef(0);
  const stopped = useRef(false);

  const stop = () => {
    if (stopped.current) return;
    stopped.current = true;
    const r = zone(posRef.current);
    setResult(r);
    (r ? sfx.finish : sfx.daze)();
    setTimeout(() => onDone(r), 1300);
  };

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      if (stopped.current) return;
      const phase = ((t - t0) / 950) % 2;
      posRef.current = phase < 1 ? phase : 2 - phase;
      setPos(posRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === 'Space' || ev.code === 'Enter') {
        ev.preventDefault();
        ev.stopPropagation();
        stop();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const band = (from: number, to: number, bg: string) => (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${from * 100}%`, width: `${(to - from) * 100}%`, background: bg }} />
  );
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(42,31,61,.8)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="card p-5 w-full max-w-xl text-center" initial={{ scale: 0.7 }} animate={{ scale: 1 }} style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
        <div className="display text-4xl mb-1">Sprint!</div>
        <div className="font-bold opacity-75 mb-4">Stop the needle in the middle. Green is +3, yellow +2, orange +1. Miss and you get nothing.</div>
        <div className="relative mx-auto" style={{ height: 64, border: '4px solid var(--ink)', borderRadius: 18, overflow: 'hidden', background: '#e9e2d0' }}>
          {band(0.23, 0.77, '#ff9a3d')}
          {band(0.36, 0.64, '#ffc83d')}
          {band(0.45, 0.55, '#5ad66f')}
          <div style={{ position: 'absolute', top: -4, bottom: -4, left: `calc(${pos * 100}% - 5px)`, width: 10, background: colour, border: '3px solid var(--ink)', borderRadius: 6 }} />
        </div>
        {result === null ? (
          <button className="btn big red w-full mt-5 pulse" onPointerDown={stop}>STOP!</button>
        ) : (
          <motion.div initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 10 }} className="display text-6xl mt-4" style={{ color: result ? 'var(--teal)' : 'var(--red)' }}>
            {result ? `+${result}!` : 'Missed!'}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
