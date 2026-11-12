import type { ReactNode } from 'react';

/** Hand-drawn SVG characters, one per racer, in a 100×100 box. */
export const INK = '#2a1f3d';
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const L = { ...S, fill: 'none', strokeWidth: 3.5 };

const ROUND = 'M50,16 C75,16 88,36 88,58 C88,80 74,92 50,92 C26,92 12,80 12,58 C12,36 25,16 50,16Z';
const TALL = 'M50,10 C67,10 75,26 75,46 L78,84 Q78,92 68,92 L32,92 Q22,92 22,84 L25,46 C25,26 33,10 50,10Z';
const WIDE = 'M50,30 C80,30 94,46 94,64 C94,84 78,92 50,92 C22,92 6,84 6,64 C6,46 20,30 50,30Z';

const Body = ({ d, fill }: { d: string; fill: string }) => <path d={d} fill={fill} {...S} />;
const Shine = () => <path d="M26,40 Q30,26 42,22" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.55" />;

function Eye({ x, y, r = 7, p = 3.2, dx = 1, dy = 1 }: { x: number; y: number; r?: number; p?: number; dx?: number; dy?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx={x + dx} cy={y + dy} r={p} fill={INK} />
      <circle cx={x + dx - 1} cy={y + dy - 1.2} r={p * 0.35} fill="#fff" />
    </g>
  );
}
const Eyes = ({ y = 46, gap = 13, r = 7, dy = 1 }: { y?: number; gap?: number; r?: number; dy?: number }) => (
  <g className="blink">
    <Eye x={50 - gap} y={y} r={r} dy={dy} />
    <Eye x={50 + gap} y={y} r={r} dy={dy} />
  </g>
);
const Smile = ({ y = 62, w = 9 }: { y?: number; w?: number }) => <path d={`M${50 - w},${y} Q50,${y + w} ${50 + w},${y}`} {...L} />;
const Cheeks = ({ y = 60, x = 24 }: { y?: number; x?: number }) => (
  <g fill="#ff8fb5" opacity="0.6"><circle cx={50 - x} cy={y} r="5" /><circle cx={50 + x} cy={y} r="5" /></g>
);

const DRAW: Record<string, () => ReactNode> = {
  granny: () => (
    <>
      <path className="flicker" d="M10,80 L16,99 L24,80Z" fill="#ff8a3d" {...S} strokeWidth={3} />
      <rect x="6" y="48" width="18" height="32" rx="7" fill="#9aa3b2" {...S} />
      <Body d={ROUND} fill="#f6a6c9" />
      <circle cx="50" cy="13" r="10" fill="#eef0f4" {...S} />
      <path d="M20,42 C24,20 76,20 80,42 C64,30 36,30 20,42Z" fill="#eef0f4" {...S} />
      <g className="blink">
        <circle cx="37" cy="54" r="10" fill="#fff" {...S} strokeWidth={3} /><circle cx="63" cy="54" r="10" fill="#fff" {...S} strokeWidth={3} />
        <circle cx="38" cy="55" r="3.2" fill={INK} /><circle cx="64" cy="55" r="3.2" fill={INK} />
      </g>
      <path d="M47,54 H53" {...L} strokeWidth={3} />
      <Smile y={70} w={7} />
    </>
  ),
  giant: () => (
    <>
      <Body d={WIDE} fill="#8fb8f0" />
      <path d="M26,40 C32,12 64,6 80,24 L68,36Z" fill="#5b6ee1" {...S} />
      <circle cx="82" cy="23" r="6" fill="#fff" {...S} strokeWidth={3} />
      <path d="M28,60 q8,7 16,0 M56,60 q8,7 16,0" {...L} />
      <ellipse cx="50" cy="76" rx="5" ry="6" fill={INK} />
      <text className="float" x="88" y="50" fontSize="18" fontWeight="900" fill={INK}>z</text>
      <Cheeks y={70} x={30} />
    </>
  ),
  mole: () => (
    <>
      <path d="M32,26 v-8 a18,18 0 0 1 36,0 v8 h-10 v-8 a8,8 0 0 0 -16,0 v8Z" fill="#ff5d4a" {...S} />
      <path d="M32,20 h10 M58,20 h10" stroke="#fff" strokeWidth="5" />
      <Body d={ROUND} fill="#a9825f" />
      <ellipse cx="50" cy="74" rx="20" ry="14" fill="#d9b99b" />
      <circle cx="37" cy="46" r="3.5" fill={INK} /><circle cx="63" cy="46" r="3.5" fill={INK} />
      <ellipse cx="50" cy="56" rx="8" ry="6" fill="#ff8fb5" {...S} strokeWidth={3} />
      <rect x="45" y="62" width="10" height="8" rx="2" fill="#fff" {...S} strokeWidth={2.5} />
    </>
  ),
  kite: () => (
    <>
      <path className="sway" d="M50,90 q-10,4 0,8 q10,4 0,8" {...L} />
      <path d="M50,6 L86,44 L50,92 L14,44Z" fill="#6cc5ff" {...S} />
      <path d="M50,6 V92 M14,44 H86" stroke={INK} strokeWidth="2" opacity="0.25" />
      <path d="M50,6 L86,44 L50,44Z" fill="#fff" opacity="0.25" />
      <Eyes y={40} gap={11} r={6} />
      <Smile y={54} w={7} />
    </>
  ),
  troll: () => (
    <>
      <path d="M26,28 L16,6 L38,20Z M74,28 L84,6 L62,20Z" fill="#fff3d9" {...S} />
      <Body d="M50,18 C70,14 90,34 86,60 C90,82 70,92 50,92 C30,92 10,82 14,60 C10,34 30,14 50,18Z" fill="#7bcf7a" />
      <Eyes y={47} gap={14} r={6} />
      <path d="M27,36 L44,41 M73,36 L56,41" {...L} strokeWidth={4} />
      <ellipse cx="50" cy="58" rx="7" ry="5" fill="#5fae5e" {...S} strokeWidth={2.5} />
      <path d="M32,72 H68" {...L} />
      <path d="M37,72 l4,-9 l4,9Z M55,72 l4,-9 l4,9Z" fill="#fff" {...S} strokeWidth={2.5} />
    </>
  ),
  duck: () => (
    <>
      <path d="M48,18 q-6,-14 6,-12 q-4,6 0,12Z" fill="#ffd84a" {...S} />
      <Body d={ROUND} fill="#ffd84a" />
      <Shine />
      <Eyes y={44} gap={14} r={6.5} />
      <ellipse cx="50" cy="62" rx="17" ry="9" fill="#ff9a3d" {...S} />
      <path d="M35,62 H65" {...L} strokeWidth={2.5} />
      <Cheeks y={58} x={30} />
    </>
  ),
  redo: () => (
    <>
      <path d="M24,34 L18,14 L32,22 L36,6 L46,20 L54,4 L60,20 L72,8 L70,24 L82,18 L76,36Z" fill="#c8b6ff" {...S} />
      <Body d={TALL} fill="#fafafa" />
      <path d="M50,64 V92 M50,64 L38,54 M50,64 L62,54" {...L} strokeWidth={2.5} />
      <circle cx="56" cy="74" r="2.2" fill={INK} /><circle cx="56" cy="84" r="2.2" fill={INK} />
      <g className="blink">
        <circle cx="38" cy="40" r="10" fill="#b9f3ff" {...S} strokeWidth={3.5} /><circle cx="62" cy="40" r="10" fill="#b9f3ff" {...S} strokeWidth={3.5} />
        <circle cx="39" cy="41" r="3" fill={INK} /><circle cx="63" cy="41" r="3" fill={INK} />
      </g>
      <path d="M22,40 h6 M72,40 h6" {...L} />
    </>
  ),
  sam: () => (
    <>
      <path d="M34,22 Q34,4 22,2 M66,22 Q66,4 78,2" {...L} stroke="#8a5a2b" strokeWidth={6} />
      <Body d={ROUND} fill="#ff7a6b" />
      <path d="M13,44 Q50,30 87,44 L87,53 Q50,39 13,53Z" fill="#fff" {...S} strokeWidth={3} />
      <path d="M86,46 l12,-8 l-3,13Z" fill="#fff" {...S} strokeWidth={3} />
      <Eyes y={60} gap={13} r={6} />
      <path d="M42,76 Q52,82 62,73" {...L} />
    </>
  ),
  shadow: () => (
    <>
      <Body d="M50,12 C74,12 84,34 84,58 L84,92 L72,82 L61,92 L50,82 L39,92 L28,82 L16,92 L16,58 C16,34 26,12 50,12Z" fill="#4b4f6b" />
      <g className="blink"><ellipse cx="38" cy="46" rx="7" ry="9" fill="#f5f3ff" /><ellipse cx="62" cy="46" rx="7" ry="9" fill="#f5f3ff" /></g>
      <path d="M26,34 Q30,22 40,18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
    </>
  ),
  wizard: () => (
    <>
      <Body d={ROUND} fill="#9b7bff" />
      <path d="M26,62 Q50,108 74,62 Q50,72 26,62Z" fill="#fff" {...S} />
      <Eyes y={52} gap={12} r={6} />
      <path d="M24,36 L52,2 L76,36Z" fill="#5b3fd6" {...S} />
      <ellipse cx="50" cy="36" rx="36" ry="7" fill="#5b3fd6" {...S} />
      <path className="twinkle" d="M50,14 l2.5,6 l6,2.5 l-6,2.5 l-2.5,6 l-2.5,-6 l-6,-2.5 l6,-2.5Z" fill="#ffc83d" />
    </>
  ),
  snowball: () => (
    <>
      <Body d={ROUND} fill="#fff" />
      <rect x="34" y="2" width="32" height="18" rx="2" fill={INK} /><rect x="24" y="18" width="52" height="7" rx="3" fill={INK} />
      <rect x="34" y="13" width="32" height="4" fill="#ff5d4a" />
      <circle cx="37" cy="46" r="4.5" fill={INK} /><circle cx="63" cy="46" r="4.5" fill={INK} />
      <path d="M50,54 L74,61 L50,65Z" fill="#ff9a3d" {...S} strokeWidth={3} />
      <g fill={INK}><circle cx="36" cy="74" r="2.3" /><circle cx="43" cy="78" r="2.3" /><circle cx="50" cy="80" r="2.3" /><circle cx="57" cy="78" r="2.3" /><circle cx="64" cy="74" r="2.3" /></g>
    </>
  ),
  ant: () => (
    <>
      <path d="M38,24 Q30,6 20,10 M62,24 Q70,6 80,10" {...L} />
      <circle cx="20" cy="10" r="3.5" fill={INK} /><circle cx="80" cy="10" r="3.5" fill={INK} />
      <ellipse cx="50" cy="82" rx="20" ry="13" fill="#a8452c" {...S} />
      <circle cx="50" cy="46" r="27" fill="#c0563a" {...S} />
      <Eyes y={44} gap={12} r={9} />
      <Smile y={60} w={7} />
    </>
  ),
  frog: () => (
    <>
      <circle cx="30" cy="32" r="15" fill="#5fd068" {...S} /><circle cx="70" cy="32" r="15" fill="#5fd068" {...S} />
      <Body d={WIDE} fill="#5fd068" />
      <g className="blink"><Eye x={30} y={31} r={8.5} /><Eye x={70} y={31} r={8.5} /></g>
      <path d="M22,66 Q50,86 78,66" {...L} />
      <Cheeks y={62} x={34} />
    </>
  ),
  merchant: () => (
    <>
      <Body d={ROUND} fill="#f2b04c" />
      <path d="M28,28 C28,4 72,4 72,28Z" fill={INK} /><rect x="18" y="24" width="64" height="7" rx="3.5" fill={INK} />
      <Eyes y={47} gap={12} r={6} />
      <path d="M50,61 C40,55 30,63 25,56 C30,70 44,68 50,63 C56,68 70,70 75,56 C70,63 60,55 50,61Z" fill={INK} />
      <circle cx="81" cy="82" r="11" fill="#4aa8ff" {...S} strokeWidth={3} /><circle cx="78" cy="78" r="3" fill="#fff" />
    </>
  ),
  mum: () => (
    <>
      <circle cx="29" cy="28" r="15" fill="#ffd84a" {...S} /><circle cx="71" cy="28" r="15" fill="#ffd84a" {...S} /><circle cx="50" cy="19" r="17" fill="#ffd84a" {...S} />
      <Body d={ROUND} fill="#f08fd0" />
      <Eyes y={50} gap={12} r={6} />
      <path d="M30,42 l-4,-4 M70,42 l4,-4" {...L} strokeWidth={2.5} />
      <path d="M41,67 Q50,60 59,67 Q50,76 41,67Z" fill="#e11d48" {...S} strokeWidth={2.5} />
      <g fill="#fff" stroke={INK} strokeWidth="1.8"><circle cx="32" cy="82" r="3.4" /><circle cx="41" cy="86" r="3.4" /><circle cx="50" cy="88" r="3.4" /><circle cx="59" cy="86" r="3.4" /><circle cx="68" cy="82" r="3.4" /></g>
    </>
  ),
  rubber: () => (
    <>
      <Body d={TALL} fill="#ff9a3d" />
      <Shine />
      <Eyes y={36} gap={10} r={6} />
      <Smile y={50} w={7} />
      <path d="M29,66 Q50,73 71,66 M28,77 Q50,84 72,77" {...L} strokeWidth={2.5} opacity={0.45} />
    </>
  ),
  fortune: () => (
    <>
      <Body d={ROUND} fill="#7c83f5" />
      <path d="M13,46 C15,16 85,16 87,46 C70,31 30,31 13,46Z" fill="#ffc83d" {...S} />
      <circle cx="34" cy="30" r="2.5" fill="#ff5d4a" /><circle cx="50" cy="25" r="2.5" fill="#ff5d4a" /><circle cx="66" cy="30" r="2.5" fill="#ff5d4a" />
      <circle cx="88" cy="60" r="6" fill="none" stroke="#ffc83d" strokeWidth="3.5" />
      <Eyes y={51} gap={12} r={6} dy={2} />
      <circle cx="50" cy="79" r="15" fill="#b9f3ff" {...S} />
      <path className="twinkle" d="M45,72 l1.5,4 l4,1.5 l-4,1.5 l-1.5,4 l-1.5,-4 l-4,-1.5 l4,-1.5Z" fill="#fff" />
    </>
  ),
  tortoise: () => (
    <>
      <rect x="14" y="70" width="16" height="16" rx="6" fill="#9be28f" {...S} /><rect x="52" y="70" width="16" height="16" rx="6" fill="#9be28f" {...S} />
      <circle cx="81" cy="54" r="14" fill="#9be28f" {...S} />
      <path d="M6,74 C6,32 76,32 76,74Z" fill="#2fae7a" {...S} />
      <path d="M29,50 L41,43 L53,50 L53,62 L41,69 L29,62Z" fill="#57c995" {...S} strokeWidth={2.5} />
      <path d="M29,50 L16,46 M53,50 L66,46 M41,43 V36 M29,62 L18,68 M53,62 L64,68" {...L} strokeWidth={2.5} />
      <g className="blink"><Eye x={85} y={51} r={4.5} p={2.2} /></g>
      <path d="M78,61 q5,4 10,0" {...L} strokeWidth={2.5} />
    </>
  ),
  chicken: () => (
    <>
      <circle cx="39" cy="17" r="8" fill="#ff5d4a" {...S} /><circle cx="61" cy="17" r="8" fill="#ff5d4a" {...S} /><circle cx="50" cy="12" r="9" fill="#ff5d4a" {...S} />
      <Body d={ROUND} fill="#fff" />
      <g className="blink"><Eye x={36} y={45} r={10} p={2.2} dx={-2} dy={-1} /><Eye x={64} y={48} r={6.5} p={3.4} dx={2} dy={2} /></g>
      <ellipse cx="50" cy="78" rx="5" ry="7" fill="#ff5d4a" {...S} strokeWidth={2.5} />
      <path d="M40,59 L60,59 L50,73Z" fill="#ffc83d" {...S} strokeWidth={3} />
    </>
  ),
  hitch: () => (
    <>
      <rect x="2" y="48" width="18" height="32" rx="7" fill="#ff5d4a" {...S} />
      <Body d={ROUND} fill="#e8b98a" />
      <path d="M22,36 C24,10 76,10 78,36Z" fill="#17b8a6" {...S} />
      <path d="M72,30 L96,35 L74,40Z" fill="#17b8a6" {...S} />
      <Eyes y={52} gap={12} r={6} />
      <Smile y={66} w={10} />
      <g className="thumb"><rect x="79" y="50" width="9" height="18" rx="4.5" fill="#e8b98a" {...S} strokeWidth={3} /><rect x="74" y="64" width="20" height="17" rx="7" fill="#e8b98a" {...S} strokeWidth={3} /></g>
    </>
  ),
  referee: () => (
    <>
      <Body d={ROUND} fill="#fff" />
      <g fill={INK}>
        <path d="M20,62 h9 v24 q-7,-6 -9,-16Z" /><path d="M37,64 h9 v28 h-9Z" /><path d="M54,64 h9 v28 h-9Z" /><path d="M71,62 h9 q-1,12 -9,24Z" />
      </g>
      <path d={ROUND} fill="none" {...S} />
      <path d="M26,30 C28,8 72,8 74,30Z" fill={INK} /><rect x="24" y="26" width="62" height="6" rx="3" fill={INK} />
      <Eyes y={45} gap={12} r={6} />
      <rect x="42" y="56" width="18" height="10" rx="5" fill="#ffc83d" {...S} strokeWidth={3} /><circle cx="64" cy="61" r="3" fill="#ffc83d" {...S} strokeWidth={2.5} />
    </>
  ),
  dervish: () => (
    <>
      <rect x="45" y="6" width="10" height="22" rx="4" fill={INK} />
      <path d="M12,36 L88,36 L50,97Z" fill="#3cc9d6" {...S} />
      <path d="M24,56 H76 M34,72 H66" stroke="#fff" strokeWidth="4" opacity="0.5" strokeLinecap="round" />
      <ellipse cx="50" cy="36" rx="38" ry="10" fill="#7de3ea" {...S} />
      <g className="spin-slow"><path d="M33,54 a5,5 0 1 1 5,5 a2.5,2.5 0 1 1 -2.5,-2.5" {...L} strokeWidth={3} /></g>
      <g className="spin-slow"><path d="M57,54 a5,5 0 1 1 5,5 a2.5,2.5 0 1 1 -2.5,-2.5" {...L} strokeWidth={3} /></g>
      <path d="M41,72 q4.5,-5 9,0 q4.5,5 9,0" {...L} strokeWidth={3} />
    </>
  ),
  photo: () => (
    <>
      <Body d={ROUND} fill="#c9a3ff" />
      <path d="M14,50 C8,12 72,4 88,42 C68,26 40,28 14,50Z" fill="#ffd84a" {...S} />
      <path d="M22,48 H78 V56 Q70,66 58,58 L50,52 L42,58 Q30,66 22,56Z" fill={INK} />
      <path d="M28,52 l8,0 M60,52 l8,0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M40,73 Q50,82 60,73" {...L} stroke="#e11d48" strokeWidth={4} />
      <path className="twinkle" d="M85,8 l3,9 l9,3 l-9,3 l-3,9 l-3,-9 l-9,-3 l9,-3Z" fill="#fff" {...S} strokeWidth={2} />
    </>
  ),
  understudy: () => (
    <>
      <Body d={ROUND} fill="#ff9fb0" />
      <path d="M50,26 C33,26 22,38 22,52 C22,68 36,80 50,80Z" fill="#fff" {...S} strokeWidth={3} />
      <path d="M30,48 q7,-7 14,0 q-7,5 -14,0Z" fill={INK} />
      <path d="M30,62 q8,9 16,0" {...L} strokeWidth={3} />
      <g className="blink"><Eye x={65} y={49} r={6.5} /></g>
      <path d="M54,67 q7,3 13,-3" {...L} strokeWidth={3} />
    </>
  ),
  cannon: () => (
    <>
      <path d="M50,16 Q56,2 68,6" {...L} stroke="#8a5a2b" strokeWidth={4} />
      <path className="twinkle" d="M70,0 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 l5,-2Z" fill="#ffc83d" {...S} strokeWidth={1.5} />
      <Body d={ROUND} fill="#4a5470" />
      <path d="M26,40 Q30,26 42,22" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <path d="M18,40 Q50,22 82,40 L78,30 Q50,12 22,30Z" fill="#ff5d4a" {...S} strokeWidth={3} />
      <Eyes y={52} gap={13} r={7} />
      <path d="M36,68 Q50,82 64,68Z" fill="#fff" {...S} strokeWidth={3} />
    </>
  ),
  penny: () => (
    <>
      <path d="M22,30 L16,10 L38,22Z M78,30 L84,10 L62,22Z" fill="#ff8fb5" {...S} />
      <Body d={ROUND} fill="#ffb3cf" />
      <rect x="40" y="19" width="20" height="5" rx="2.5" fill={INK} />
      <Eyes y={46} gap={15} r={6} />
      <ellipse cx="50" cy="64" rx="15" ry="11" fill="#ff8fb5" {...S} strokeWidth={3} />
      <ellipse cx="44" cy="64" rx="2.6" ry="4" fill={INK} /><ellipse cx="56" cy="64" rx="2.6" ry="4" fill={INK} />
      <g className="float"><circle cx="84" cy="16" r="8" fill="#ffc83d" {...S} strokeWidth={2.5} /></g>
    </>
  ),
  goat: () => (
    <>
      <path d="M32,24 Q20,4 8,14 Q20,12 26,30Z M68,24 Q80,4 92,14 Q80,12 74,30Z" fill="#c9b38a" {...S} />
      <path d="M16,42 L2,38 L14,52Z M84,42 L98,38 L86,52Z" fill="#f4efe4" {...S} />
      <Body d={ROUND} fill="#f4efe4" />
      <Eyes y={46} gap={14} r={6.5} />
      <path d="M26,35 L44,40 M74,35 L56,40" {...L} strokeWidth={4} />
      <ellipse cx="50" cy="62" rx="9" ry="6" fill="#ffc9d6" {...S} strokeWidth={3} />
      <path d="M44,88 Q50,104 56,88Z" fill="#f4efe4" {...S} strokeWidth={3} />
    </>
  ),
  hurdler: () => (
    <>
      <Body d={TALL} fill="#35c6b5" />
      <path d="M26,26 Q50,18 74,26 L75,34 Q50,26 25,34Z" fill="#fff" {...S} strokeWidth={3} />
      <path d="M26,30 Q50,22 74,30" fill="none" stroke="#ff5d4a" strokeWidth="3" />
      <Eyes y={44} gap={10} r={6} />
      <path d="M40,56 Q50,64 60,56Z" fill="#fff" {...S} strokeWidth={3} />
      <rect x="38" y="68" width="24" height="18" rx="4" fill="#fff" {...S} strokeWidth={3} />
      <text x="50" y="82" fontSize="15" fontWeight="900" textAnchor="middle" fill={INK}>1</text>
    </>
  ),
  slug: () => (
    <>
      <path d="M36,36 Q32,18 28,12 M64,36 Q68,18 72,12" {...L} strokeWidth={5} stroke="#9bcf4a" />
      <path d="M36,36 Q32,18 28,12 M64,36 Q68,18 72,12" {...L} strokeWidth={2} opacity={0.3} />
      <Body d={WIDE} fill="#b7e35a" />
      <g className="blink"><Eye x={28} y={11} r={8} /><Eye x={72} y={11} r={8} /></g>
      <path d="M36,62 H64" {...L} />
      <path d="M36,54 L46,57 M64,54 L54,57" {...L} strokeWidth={3} />
      <ellipse cx="22" cy="80" rx="8" ry="3" fill="#fff" opacity="0.5" /><ellipse cx="74" cy="82" rx="10" ry="3" fill="#fff" opacity="0.5" />
    </>
  ),
  parrot: () => (
    <>
      <path d="M44,18 Q40,2 50,6 Q52,0 60,6 Q66,4 60,18Z" fill="#ffc83d" {...S} />
      <Body d={ROUND} fill="#ff5d4a" />
      <path d="M14,58 Q10,80 30,86 Q22,70 26,56Z" fill="#4aa8ff" {...S} strokeWidth={3} />
      <path d="M86,58 Q90,80 70,86 Q78,70 74,56Z" fill="#5ad66f" {...S} strokeWidth={3} />
      <ellipse cx="36" cy="46" rx="11" ry="12" fill="#fff" /><ellipse cx="64" cy="46" rx="11" ry="12" fill="#fff" />
      <Eyes y={46} gap={14} r={6} />
      <path d="M40,58 H60 Q62,74 50,80 Q46,70 40,58Z" fill="#ffc83d" {...S} strokeWidth={3} />
    </>
  ),
  bear: () => (
    <>
      <circle cx="24" cy="24" r="12" fill="#b7793f" {...S} /><circle cx="76" cy="24" r="12" fill="#b7793f" {...S} />
      <circle cx="24" cy="24" r="5" fill="#e6b98a" /><circle cx="76" cy="24" r="5" fill="#e6b98a" />
      <Body d={ROUND} fill="#b7793f" />
      <path d="M30,22 Q50,10 70,22 Q72,34 64,32 Q62,44 56,34 Q50,30 44,36 Q40,46 36,32 Q28,34 30,22Z" fill="#ffc83d" {...S} strokeWidth={3} />
      <Eyes y={52} gap={14} r={6} />
      <ellipse cx="50" cy="70" rx="15" ry="11" fill="#e6b98a" {...S} strokeWidth={3} />
      <ellipse cx="50" cy="65" rx="5" ry="3.5" fill={INK} />
      <path d="M44,73 Q50,79 56,73" {...L} strokeWidth={2.5} />
    </>
  ),
  daredevil: () => (
    <>
      <path className="sway" d="M22,50 Q4,70 10,96 Q24,84 30,90 Q26,70 34,56Z" fill="#ffc83d" {...S} />
      <Body d={ROUND} fill="#ff5d4a" />
      <path d="M14,52 C12,24 30,14 50,14 C70,14 88,24 86,52 Q50,40 14,52Z" fill="#fff" {...S} />
      <path d="M50,14 V44" stroke="#ff5d4a" strokeWidth="6" />
      <path className="twinkle" d="M50,20 l2.5,6 l6,2.5 l-6,2.5 l-2.5,6 l-2.5,-6 l-6,-2.5 l6,-2.5Z" fill="#ffc83d" {...S} strokeWidth={1.5} />
      <g className="blink">
        <rect x="24" y="50" width="52" height="16" rx="8" fill="#b9f3ff" {...S} strokeWidth={3} />
        <circle cx="39" cy="58" r="3.2" fill={INK} /><circle cx="61" cy="58" r="3.2" fill={INK} />
      </g>
      <path d="M38,76 Q50,86 62,74" {...L} />
    </>
  ),
};

/** The character's shapes, for embedding inside another SVG. */
export function MascotShapes({ id }: { id: string }) {
  const draw = DRAW[id];
  return <>{draw ? draw() : <><Body d={ROUND} fill="#ddd" /><Eyes /><Smile /></>}</>;
}

export function Mascot({ id, size = 64, className }: { id: string; size?: number | string; className?: string }) {
  return (
    <svg viewBox="-2 -2 104 106" width={size} height={typeof size === 'number' ? size : undefined} className={className} style={{ overflow: 'visible', display: 'block' }}>
      <MascotShapes id={id} />
    </svg>
  );
}
