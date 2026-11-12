export const FINISH = 30;

export type SpaceDef =
  | { type: 'boost' }
  | { type: 'mud' }
  | { type: 'spring'; to: number }
  | { type: 'event' }
  | { type: 'star' }
  | { type: 'web' };

export interface TrackDef {
  id: string;
  name: string;
  blurb: string;
  spaces: Record<number, SpaceDef>;
}

interface Specials {
  boost?: number[];
  mud?: number[];
  spring?: [number, number][];
  event?: number[];
  star?: number[];
  web?: number[];
}

function track(id: string, name: string, blurb: string, s: Specials): TrackDef {
  const spaces: Record<number, SpaceDef> = {};
  s.boost?.forEach((n) => (spaces[n] = { type: 'boost' }));
  s.mud?.forEach((n) => (spaces[n] = { type: 'mud' }));
  s.spring?.forEach(([n, to]) => (spaces[n] = { type: 'spring', to }));
  s.event?.forEach((n) => (spaces[n] = { type: 'event' }));
  s.star?.forEach((n) => (spaces[n] = { type: 'star' }));
  s.web?.forEach((n) => (spaces[n] = { type: 'web' }));
  return { id, name, blurb, spaces };
}

export const TRACKS: Record<string, TrackDef> = {
  corkscrew: track('corkscrew', 'Corkscrew Canyon', 'A dusty spiral that winds into the middle.', {
    boost: [4, 17], mud: [9, 22, 27], spring: [[12, 15], [25, 19]], event: [7, 20], star: [14],
  }),
  lagoon: track('lagoon', 'Loop-de-Lagoon', 'A lazy S-bend around two lagoons, with three springs.', {
    boost: [6, 21], mud: [3, 13, 26], spring: [[10, 16], [28, 23], [18, 8]], event: [11, 24], star: [5],
  }),
  ridge: track('ridge', 'Rollercoaster Ridge', 'Up and down the hills. Mind the cobweb near the end.', {
    boost: [5, 19], mud: [8, 23], spring: [[11, 14], [26, 21]], event: [6, 17], star: [15], web: [3, 28],
  }),
  bigtop: track('bigtop', 'Big Top Dash', 'One lap of the circus ring, full of springs and boosts.', {
    boost: [3, 16, 24], mud: [10, 20], spring: [[7, 12], [27, 22], [14, 9]], event: [5, 18], star: [21], web: [29],
  }),
  hairpins: track('hairpins', 'Haunted Hairpins', 'Five spooky straights. Cobwebs everywhere.', {
    boost: [9, 26], mud: [12], spring: [[4, 8], [19, 13], [28, 24]], event: [10, 21], star: [17], web: [6, 15, 23],
  }),
  volcano: track('volcano', 'Volcano Climb', 'Switchbacks to the crater. The last spring is a long way down.', {
    boost: [2, 13], mud: [7, 18, 25], spring: [[10, 16], [22, 14], [29, 20]], event: [8, 19], star: [27], web: [5],
  }),
  /** No special spaces. Used by tests. */
  plain: track('plain', 'Plain', 'Test track.', {}),
};

/** Tracks a Grand Prix can be played on. */
export const TRACK_IDS = ['corkscrew', 'lagoon', 'ridge', 'bigtop', 'hairpins', 'volcano'];
