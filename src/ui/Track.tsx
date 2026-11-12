import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HeatCore, Player } from '../engine/types';
import { FINISH, TRACKS } from '../engine/tracks';
import { LAYOUTS } from './trackLayout';
import { SPACE_STYLE, THEMES } from './art';
import { INK, Mascot } from './Mascot';
import type { View } from './useGame';

/** How far the board leans back in 3D view, in degrees. */
const TILT = 40;

const Cloud = ({ y, s = 1, dur = 60, delay = 0 }: { y: number; s?: number; dur?: number; delay?: number }) => (
  <g className="drift" style={{ animationDuration: `${dur}s`, animationDelay: `${-delay}s` }}>
    <g transform={`translate(0,${y}) scale(${s})`} fill="#fff" opacity="0.85">
      <ellipse cx="0" cy="0" rx="46" ry="20" /><ellipse cx="-28" cy="8" rx="30" ry="15" /><ellipse cx="30" cy="8" rx="34" ry="16" />
    </g>
  </g>
);
const Sun = ({ x, y, c = '#ffe27a' }: { x: number; y: number; c?: string }) => (
  <g transform={`translate(${x},${y})`}>
    <g className="spin-slow" style={{ animationDuration: '40s' }}>
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x="-5" y="-78" width="10" height="26" rx="5" fill={c} transform={`rotate(${i * 30})`} />)}
    </g>
    <circle r="44" fill={c} stroke={INK} strokeWidth="4" />
  </g>
);
const Ghost = ({ x, y, d = 0 }: { x: number; y: number; d?: number }) => (
  <g transform={`translate(${x},${y})`} opacity="0.55">
    <g className="float" style={{ animationDelay: `${-d}s`, animationDuration: '3.4s' }}>
      <path d="M-22,24 V-4 a22,22 0 0 1 44,0 V24 l-11,-9 l-11,9 l-11,-9Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="-8" cy="-4" r="4" fill={INK} /><circle cx="8" cy="-4" r="4" fill={INK} />
    </g>
  </g>
);

/** Flat background art for each track. Sits behind the ribbon. */
function Scenery({ id }: { id: string }) {
  switch (id) {
    case 'corkscrew':
      return (
        <>
          <Sun x={905} y={95} />
          <Cloud y={70} dur={80} /><Cloud y={560} s={0.8} dur={110} delay={40} />
          <path d="M-10,640 V540 h90 v-40 h80 v70 h60 v70Z M1010,640 V520 h-70 v-50 h-90 v80 h-70 v90Z" fill="#b8431c" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </>
      );
    case 'lagoon':
      return (
        <>
          {[[560, 210], [440, 410]].map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="255" ry="50" fill="#35c3e8" stroke={INK} strokeWidth="4" />
              <path className="dash-flow" d={`M${x - 190},${y - 8} h380 M${x - 150},${y + 14} h300`} stroke="#fff" strokeWidth="5" strokeDasharray="22 30" strokeLinecap="round" opacity="0.7" style={{ animationDuration: '3s' }} />
            </g>
          ))}
          <Cloud y={36} s={0.7} dur={90} />
        </>
      );
    case 'ridge':
      return (
        <>
          <Sun x={90} y={90} />
          <Cloud y={60} dur={70} /><Cloud y={150} s={0.7} dur={100} delay={50} /><Cloud y={40} s={0.9} dur={120} delay={90} />
          <ellipse cx="230" cy="690" rx="420" ry="190" fill="#63c76a" stroke={INK} strokeWidth="4" />
          <ellipse cx="780" cy="710" rx="460" ry="210" fill="#48b257" stroke={INK} strokeWidth="4" />
        </>
      );
    case 'bigtop':
      return (
        <>
          <g transform="translate(500,320)">
            <g className="spin-slow" style={{ animationDuration: '50s' }}>
              {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d="M0,0 L-34.7,-129.4 A134,134 0 0 1 34.7,-129.4Z" fill={i % 2 ? '#fff' : '#ff5d4a'} stroke={INK} strokeWidth="3" transform={`rotate(${i * 30})`} />
              ))}
            </g>
            <circle r="26" fill="#ffc83d" stroke={INK} strokeWidth="4" />
          </g>
          {Array.from({ length: 13 }, (_, i) => (
            <path key={i} d={`M${40 + i * 72},4 l26,0 l-13,30Z`} fill={['#ffc83d', '#4aa8ff', '#5ad66f'][i % 3]} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          ))}
        </>
      );
    case 'hairpins':
      return (
        <>
          {Array.from({ length: 26 }, (_, i) => <circle key={i} className="twinkle" style={{ animationDelay: `${-(i % 7) * 0.3}s` }} cx={(i * 137) % 1000} cy={(i * 89) % 640} r={i % 3 ? 2.5 : 4} fill="#fff" opacity="0.8" />)}
          <circle cx="215" cy="230" r="46" fill="#fff3c4" stroke={INK} strokeWidth="4" /><circle cx="200" cy="218" r="9" fill="#e8d79a" /><circle cx="232" cy="246" r="6" fill="#e8d79a" />
          <Ghost x={405} y={420} /><Ghost x={595} y={240} d={1.2} /><Ghost x={785} y={430} d={2} />
        </>
      );
    case 'volcano':
      return (
        <>
          <Cloud y={60} s={0.9} dur={90} /><Cloud y={110} s={0.6} dur={70} delay={30} />
          <path d="M-20,660 L330,60 Q440,20 560,60 L1020,660Z" fill="#6b3d3a" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M330,60 Q440,20 560,60 L590,110 Q520,90 480,130 Q430,90 390,140 Q350,100 305,105Z" fill="#ff7a2f" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          {[380, 440, 500].map((x, i) => <circle key={i} className="float" style={{ animationDelay: `${-i * 0.7}s` }} cx={x} cy={34 - i * 6} r={10 - i * 2} fill="#ffc83d" stroke={INK} strokeWidth="3" />)}
        </>
      );
    default:
      return null;
  }
}

// ---------- stand-up props ----------
const P = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const PROP_ART: Record<string, ReactNode> = {
  cactus: <><path d="M24,88 V26 a8,8 0 0 1 16,0 V88Z" fill="#3fae5a" {...P} /><path d="M14,40 V52 a4,4 0 0 0 4,4 H24 M50,32 V44 a4,4 0 0 1 -4,4 H40" fill="none" {...P} stroke="#3fae5a" strokeWidth={9} /></>,
  palm: <><path d="M28,88 Q26,56 32,34 h6 Q34,58 36,88Z" fill="#a8763e" {...P} /><path d="M34,34 Q10,22 2,38 Q18,30 34,36 Q20,8 6,10 Q26,10 34,32 Q40,4 58,10 Q42,14 36,34 Q54,24 60,42 Q48,32 34,36Z" fill="#3fc65a" {...P} /></>,
  pine: <><rect x="26" y="70" width="8" height="18" fill="#a8763e" {...P} /><path d="M30,6 L48,36 H40 L54,58 H44 L58,76 H2 L16,58 H6 L20,36 H12Z" fill="#2f9e58" {...P} /></>,
  flag: <><rect x="27" y="10" width="5" height="78" rx="2" fill="#fff" {...P} /><path className="sway" d="M32,12 L58,22 L32,34Z" fill="#ffc83d" {...P} /></>,
  tomb: <><path d="M12,88 V40 a18,18 0 0 1 36,0 V88Z" fill="#b9b4c9" {...P} /><path d="M30,36 V62 M22,46 H38" {...P} fill="none" /><path d="M6,88 H54" {...P} /></>,
  rock: <><path d="M6,88 L14,58 L30,48 L48,60 L56,88Z" fill="#7a6a72" {...P} /><path className="twinkle" d="M30,30 l3,7 l7,3 l-7,3 l-3,7 l-3,-7 l-7,-3 l7,-3Z" fill="#ff7a2f" {...P} strokeWidth={2} /></>,
};
const PROPS: Record<string, [string, number, number][]> = {
  corkscrew: [['cactus', 60, 150], ['cactus', 945, 470], ['cactus', 150, 610]],
  lagoon: [['palm', 70, 240], ['palm', 935, 450], ['palm', 520, 235], ['palm', 400, 435]],
  ridge: [['pine', 150, 615], ['pine', 500, 620], ['pine', 850, 615]],
  bigtop: [['flag', 70, 615], ['flag', 930, 615], ['flag', 500, 345]],
  hairpins: [['tomb', 215, 410], ['tomb', 405, 270], ['tomb', 785, 280]],
  volcano: [['rock', 955, 330], ['rock', 70, 400], ['pine', 60, 625], ['pine', 950, 625]],
  plain: [],
};

/** Something that stands upright on the board at a board position. */
function Stand({ x, y, w, tilt, children, z = 0 }: { x: number; y: number; w: number; tilt: number; children: ReactNode; z?: number }) {
  return (
    <div style={{ position: 'absolute', left: `${x / 10}%`, top: `${y / 6.4}%`, width: `${w}%`, height: 0, marginLeft: `${-w / 2}%`, transformStyle: 'preserve-3d', pointerEvents: 'none', zIndex: z }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', transformOrigin: '50% 100%', transform: `rotateX(${-tilt}deg)` }}>{children}</div>
    </div>
  );
}

export function Track({
  core, view, players, tilt = false, previewFor = null,
}: { core: HeatCore; view: View; players: Player[]; tilt?: boolean; previewFor?: number | null }) {
  const L = LAYOUTS[core.trackId];
  const T = TRACKS[core.trackId];
  const theme = THEMES[core.trackId] ?? THEMES.plain;
  const deg = tilt ? TILT : 0;

  // Fan out racers that share a space.
  const groups: Record<number, number[]> = {};
  for (const e of core.entrants) {
    if (view.gone[e.id] === 'out') continue;
    (groups[view.spaces[e.id]] ??= []).push(e.id);
  }
  const pos = (id: number): [number, number] => {
    const s = view.spaces[id];
    const g = groups[s] ?? [id];
    const [x, y] = L.pts[Math.min(FINISH, Math.max(0, s))];
    const i = g.indexOf(id);
    const k = g.length;
    const spread = k > 4 ? 15 : 21;
    return [x + (i - (k - 1) / 2) * spread, y + 10 + (k > 1 ? (i % 2 ? 7 : -7) : 0)];
  };
  const tokens = core.entrants.filter((e) => view.gone[e.id] !== 'out').map((e) => ({ e, p: pos(e.id) })).sort((a, b) => a.p[1] - b.p[1]);
  const callout = view.callout;
  const calloutPos = callout && view.gone[callout.id] !== 'out' ? pos(callout.id) : null;

  // The camera leans toward whoever is moving.
  const focus = view.activeId !== null && view.gone[view.activeId] !== 'out' ? pos(view.activeId) : [500, 320];
  const cam = tilt ? [((500 - focus[0]) / 1000) * 12, ((320 - focus[1]) / 640) * 10 - 9] : [0, 0];
  const previewSpace = previewFor !== null ? view.spaces[previewFor] : null;

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ containerType: 'size' }}>
      <div style={{ width: 'min(100cqw, calc(100cqh * 1000 / 640))', aspectRatio: '1000 / 640', position: 'relative', perspective: '1500px', perspectiveOrigin: '50% 25%' }}>
        <motion.div
          style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transformOrigin: '50% 75%' }}
          initial={false}
          animate={{ rotateX: deg, scale: 1, x: `${cam[0]}%`, y: `${cam[1]}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 16 }}
        >
          <svg viewBox="0 0 1000 640" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(8px 12px 0 rgba(42,31,61,.9))' }}>
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.sky[0]} /><stop offset="100%" stopColor={theme.sky[1]} />
              </linearGradient>
              <clipPath id="board"><rect x="0" y="0" width="1000" height="640" rx="34" /></clipPath>
            </defs>

            <g clipPath="url(#board)">
              <rect width="1000" height="640" fill="url(#sky)" />
              <Scenery id={core.trackId} />

              {/* ribbon */}
              <path d={L.path} fill="none" stroke={INK} strokeWidth="80" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" transform="translate(5,8)" />
              <path d={L.path} fill="none" stroke={INK} strokeWidth="78" strokeLinecap="round" strokeLinejoin="round" />
              <path d={L.path} fill="none" stroke={theme.edge} strokeWidth="70" strokeLinecap="round" strokeLinejoin="round" />
              <path d={L.path} fill="none" stroke={theme.ribbon} strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
              <path d={L.path} fill="none" stroke={INK} strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" opacity="0.3" />

              {/* spring links */}
              {Object.entries(T.spaces).map(([k, def]) => {
                if (def.type !== 'spring') return null;
                const [x1, y1] = L.pts[+k];
                const [x2, y2] = L.pts[def.to];
                const mx = (x1 + x2) / 2 + (y2 - y1) * 0.22;
                const my = (y1 + y2) / 2 - (x2 - x1) * 0.22;
                const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
                return (
                  <g key={k}>
                    <path d={d} fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" opacity="0.55" />
                    <path className="dash-flow" d={d} fill="none" stroke="#7ee9fa" strokeWidth="5" strokeDasharray="12 14" strokeLinecap="round" />
                    <circle cx={x2} cy={y2} r="31" fill="none" stroke="#7ee9fa" strokeWidth="4" strokeDasharray="6 8" />
                  </g>
                );
              })}

              {/* spaces */}
              {L.pts.map(([x, y], i) => {
                const def = T.spaces[i];
                const st = def ? SPACE_STYLE[def.type] : null;
                const used = (def?.type === 'event' && core.spaceState.eventUsed[i]) || (def?.type === 'star' && core.spaceState.starTaken[i]);
                if (i === FINISH) {
                  return (
                    <g key={i}>
                      <circle cx={x + 3} cy={y + 5} r="40" fill={INK} opacity="0.35" />
                      <circle cx={x} cy={y} r="40" fill="#fff" stroke={INK} strokeWidth="5" />
                      <circle cx={x} cy={y} r="31" fill="none" stroke="#ffc83d" strokeWidth="9" strokeDasharray="12 9" className="spin-slow" style={{ animationDuration: '14s' }} />
                    </g>
                  );
                }
                return (
                  <g key={i} opacity={used ? 0.5 : 1}>
                    <title>{st ? `${st.label}: ${st.help}` : i === 0 ? 'Start' : `Space ${i}`}</title>
                    <circle cx={x + 2} cy={y + 4} r="26" fill={INK} opacity="0.35" />
                    <circle cx={x} cy={y} r="26" fill={st ? st.fill : i === 0 ? '#ff8fb5' : theme.tile} stroke={INK} strokeWidth="3.5" />
                    {st && !used && def?.type !== 'mud' && def?.type !== 'web' && (
                      <circle cx={x} cy={y} r="26" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" className="twinkle" style={{ animationDelay: `${-(i % 5) * 0.4}s`, animationDuration: '2.4s' }} />
                    )}
                    {st ? (
                      <text x={x} y={y + 1} fontSize="28" fontFamily="'Lilita One', sans-serif" textAnchor="middle" dominantBaseline="central" fill={INK}>{st.icon}</text>
                    ) : (
                      <text x={x} y={y + 2} fontSize={i === 0 ? 20 : 21} fontFamily="'Lilita One', sans-serif" textAnchor="middle" dominantBaseline="central" fill={INK} opacity={i === 0 ? 1 : 0.5}>
                        {i === 0 ? 'GO' : i}
                      </text>
                    )}
                    {core.spaceState.marbles[i] !== undefined && (
                      <g transform={`translate(${x + 20},${y + 18})`}>
                        <circle r="7" fill="#4aa8ff" stroke={INK} strokeWidth="2.5" /><circle cx="-11" cy="4" r="6" fill="#ff5d4a" stroke={INK} strokeWidth="2.5" /><circle cx="-4" cy="9" r="5" fill="#ffc83d" stroke={INK} strokeWidth="2.5" />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* where each roll would land, before abilities and bonuses */}
              {previewSpace !== null && [1, 2, 3, 4, 5, 6].map((n) => {
                if (previewSpace + n > FINISH) return null;
                const s = previewSpace + n;
                const [x, y] = L.pts[s];
                return (
                  <g key={n} className="pop" style={{ animationDelay: `${n * 0.05}s`, transformBox: 'fill-box', transformOrigin: 'center' }}>
                    <circle cx={x} cy={y} r={s === FINISH ? 46 : 32} fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="9 7" />
                    <circle cx={x + 24} cy={y - 24} r="13" fill="#fff" stroke={INK} strokeWidth="3" />
                    <text x={x + 24} y={y - 23} fontSize="16" fontFamily="'Lilita One', sans-serif" textAnchor="middle" dominantBaseline="central" fill={INK}>{n}</text>
                  </g>
                );
              })}
            </g>
            <rect x="2" y="2" width="996" height="636" rx="34" fill="none" stroke={INK} strokeWidth="5" />

            {/* coloured bases lie flat on the board */}
            {tokens.map(({ e, p: [x, y] }) => (
              <motion.g key={e.id} initial={false} animate={{ x, y }} transition={{ type: 'spring', stiffness: 520, damping: 30 }}>
                {view.activeId === e.id && (
                  <motion.ellipse cy="2" rx="27" ry="11" fill="none" stroke="#fff" strokeWidth="4" animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
                )}
                <ellipse cy="3" rx="22" ry="8.5" fill={players[e.ownerId].colour} stroke={INK} strokeWidth="3" />
              </motion.g>
            ))}
          </svg>

          {/* scenery that stands up */}
          {(PROPS[core.trackId] ?? []).map(([kind, x, y], i) => (
            <Stand key={i} x={x} y={y} w={6.5} tilt={deg}>
              <svg viewBox="0 0 60 90" width="100%" style={{ display: 'block', overflow: 'visible' }}>{PROP_ART[kind]}</svg>
            </Stand>
          ))}

          {/* finish arch */}
          <Stand x={L.pts[FINISH][0]} y={L.pts[FINISH][1] - 6} w={13} tilt={deg}>
            <svg viewBox="0 0 130 96" width="100%" style={{ display: 'block', overflow: 'visible' }}>
              <defs>
                <pattern id="check" width="12" height="12" patternUnits="userSpaceOnUse">
                  <rect width="12" height="12" fill="#fff" /><rect width="6" height="6" fill={INK} /><rect x="6" y="6" width="6" height="6" fill={INK} />
                </pattern>
              </defs>
              <rect x="6" y="6" width="9" height="90" rx="4" fill="#ff5d4a" stroke={INK} strokeWidth="3" /><rect x="115" y="6" width="9" height="90" rx="4" fill="#ff5d4a" stroke={INK} strokeWidth="3" />
              <rect x="4" y="2" width="122" height="30" rx="8" fill="url(#check)" stroke={INK} strokeWidth="3.5" />
              <rect x="30" y="8" width="70" height="18" rx="9" fill="#ffc83d" stroke={INK} strokeWidth="3" />
              <text x="65" y="18" fontSize="13" fontFamily="'Lilita One', sans-serif" textAnchor="middle" dominantBaseline="central" fill={INK}>FINISH</text>
            </svg>
          </Stand>

          {/* racers stand on their bases */}
          {tokens.map(({ e, p: [x, y] }) => {
            const active = view.activeId === e.id;
            const flash = view.flash === e.id;
            const done = view.gone[e.id] === 'finished';
            const kind = view.kind[e.id] ?? 'hop';
            return (
              <motion.div
                key={e.id}
                initial={false}
                animate={{ left: `${x / 10}%`, top: `${y / 6.4}%` }}
                transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                style={{ position: 'absolute', width: '6%', height: 0, marginLeft: '-3%', transformStyle: 'preserve-3d', pointerEvents: 'none' }}
              >
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', transformOrigin: '50% 100%', transform: `rotateX(${-deg}deg)` }}>
                  <motion.div initial={false} animate={{ scale: flash ? 1.5 : active ? 1.22 : 1, opacity: done ? 0.9 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }} style={{ transformOrigin: '50% 100%', position: 'relative' }}>
                    <div key={`${view.spaces[e.id]}-${kind}`} className={kind}>
                      <div className={active ? 'bob' : 'breathe'} style={{ animationDelay: `${-e.id * 0.37}s` }}>
                        <Mascot id={e.racerId} size="100%" />
                      </div>
                    </div>
                    {e.dazed && !done && (
                      <div className="dizzy display" style={{ position: 'absolute', top: '-22%', left: 0, right: 0, textAlign: 'center', color: '#ffc83d', fontSize: 'clamp(10px, 1.6cqw, 22px)', WebkitTextStroke: '1px var(--ink)', letterSpacing: 2 }}>★★★</div>
                    )}
                    {done && (
                      <div className="display" style={{ position: 'absolute', top: '-8%', right: '-18%', width: '46%', aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: core.placings[0] === e.id ? '#ffc83d' : '#d7dbe6', border: '2.5px solid var(--ink)', fontSize: 'clamp(8px, 1.4cqw, 18px)' }}>
                        {core.placings[0] === e.id ? 1 : 2}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}

          {/* speech bubble for abilities and space effects */}
          {callout && calloutPos && (
            <Stand key={callout.n} x={Math.min(880, Math.max(120, calloutPos[0]))} y={calloutPos[1]} w={26} tilt={deg} z={5}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '36%' }}>
                <div className="pop display" style={{ background: callout.tone === 'bad' ? '#ffd7d0' : callout.tone === 'good' ? '#d8f5d2' : '#fff', border: '3px solid var(--ink)', borderRadius: 14, padding: '3px 12px', fontSize: 'clamp(11px, 1.9cqw, 22px)', lineHeight: 1.15, textAlign: 'center', boxShadow: '3px 3px 0 var(--ink)', color: 'var(--ink)' }}>
                  {callout.text}
                </div>
              </div>
            </Stand>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** A tiny preview of a track's shape. */
export function TrackThumb({ id, width = 120 }: { id: string; width?: number | string }) {
  const L = LAYOUTS[id];
  const theme = THEMES[id] ?? THEMES.plain;
  return (
    <svg viewBox="0 0 1000 640" width={width} style={{ maxWidth: '100%', height: 'auto', boxSizing: 'border-box', borderRadius: 12, border: '3px solid var(--ink)', display: 'block', background: `linear-gradient(${theme.sky[0]}, ${theme.sky[1]})` }}>
      <path d={L.path} fill="none" stroke={INK} strokeWidth="96" strokeLinecap="round" strokeLinejoin="round" />
      <path d={L.path} fill="none" stroke={theme.ribbon} strokeWidth="62" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={L.pts[0][0]} cy={L.pts[0][1]} r="34" fill="#ff8fb5" stroke={INK} strokeWidth="12" />
      <circle cx={L.pts[FINISH][0]} cy={L.pts[FINISH][1]} r="40" fill="#ffc83d" stroke={INK} strokeWidth="12" />
    </svg>
  );
}
