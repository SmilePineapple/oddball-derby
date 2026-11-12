import { FINISH, TRACKS } from '../engine/tracks';

type P = [number, number];

export interface Layout {
  /** Centre of each space, 0..FINISH, in a 1000×640 viewBox. */
  pts: P[];
  /** Smooth path for the track ribbon. */
  path: string;
}

const line = (a: P, b: P): P[] => {
  const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as P);
};
/** Arc in screen coordinates (y down). Angles in units of π. */
const arc = (cx: number, cy: number, r: number, a0: number, a1: number): P[] => {
  const n = Math.max(8, Math.ceil((Math.abs(a1 - a0) * Math.PI * r) / 3));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (a0 + ((a1 - a0) * i) / n) * Math.PI;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as P;
  });
};
const curve = (fn: (t: number) => P, n = 2000): P[] => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

/** Place the spaces at equal distances along a dense polyline. */
function build(...parts: P[][]): Layout {
  const fine = parts.flat();
  const cum = [0];
  for (let i = 1; i < fine.length; i++) cum.push(cum[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]));
  const total = cum[cum.length - 1];
  const pts: P[] = [];
  let j = 0;
  for (let k = 0; k <= FINISH; k++) {
    const target = (total * k) / FINISH;
    while (j < fine.length - 1 && cum[j] < target) j++;
    pts.push(fine[j]);
  }
  const path = 'M' + fine.filter((_, i) => i % 4 === 0 || i === fine.length - 1).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  return { pts, path };
}

export const LAYOUTS: Record<string, Layout> = {
  // A spiral winding inward to a central finish.
  corkscrew: build(
    curve((t) => {
      const a = -Math.PI * 0.8 + t * Math.PI * 3.7;
      const r = 1 - 0.8 * t;
      return [500 + 440 * r * Math.cos(a), 320 + 275 * r * Math.sin(a)];
    }),
  ),
  // An S-bend around two lagoons.
  lagoon: build(
    line([150, 110], [850, 110]),
    arc(850, 210, 100, -0.5, 0.5),
    line([850, 310], [150, 310]),
    arc(150, 410, 100, -0.5, -1.5),
    line([150, 510], [850, 510]),
  ),
  // Rolling hills, left to right.
  ridge: build(curve((t) => [60 + 880 * t, 320 - 225 * Math.sin(t * Math.PI * 5)])),
  // One lap of a circus ring.
  bigtop: build(
    line([335, 130], [750, 130]),
    arc(750, 320, 190, -0.5, 0.5),
    line([750, 510], [250, 510]),
    arc(250, 320, 190, 0.5, 1.5),
  ),
  // Five vertical straights joined by hairpins.
  hairpins: build(
    line([120, 135], [120, 505]),
    arc(215, 505, 95, 1, 0),
    line([310, 505], [310, 135]),
    arc(405, 135, 95, 1, 2),
    line([500, 135], [500, 505]),
    arc(595, 505, 95, 1, 0),
    line([690, 505], [690, 135]),
    arc(785, 135, 95, 1, 2),
    line([880, 135], [880, 505]),
  ),
  // Switchbacks up a mountain.
  volcano: build(
    line([110, 560], [890, 560]),
    arc(890, 495, 65, 0.5, -0.5),
    line([890, 430], [200, 430]),
    arc(200, 365, 65, 0.5, 1.5),
    line([200, 300], [760, 300]),
    arc(760, 235, 65, 0.5, -0.5),
    line([760, 170], [440, 170]),
  ),
  plain: build(line([60, 320], [940, 320])),
};

/** Positions of shortcut spaces, spread evenly between the two ends of the shortcut. */
export const FORK_PTS: Record<string, Record<number, P>> = {};
for (const [id, t] of Object.entries(TRACKS)) {
  if (!t.fork || !LAYOUTS[id]) continue;
  const a = LAYOUTS[id].pts[t.fork.from];
  const b = LAYOUTS[id].pts[t.fork.to];
  const n = t.fork.nodes.length;
  FORK_PTS[id] = {};
  t.fork.nodes.forEach((node, i) => {
    const k = (i + 1) / (n + 1);
    FORK_PTS[id][node] = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  });
}

/** Board position of any space, including shortcut spaces. */
export function ptOf(trackId: string, space: number): P {
  return FORK_PTS[trackId]?.[space] ?? LAYOUTS[trackId].pts[Math.min(FINISH, Math.max(0, Math.round(space)))];
}
