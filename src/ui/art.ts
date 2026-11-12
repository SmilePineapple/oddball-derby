/** Tile colour behind each racer's portrait. */
export const TINT: Record<string, string> = {
  granny: '#ffd9ea', giant: '#d6e6ff', mole: '#ecdcc8', kite: '#d5efff', troll: '#d8f5d2', duck: '#fff3b8',
  redo: '#e8e0ff', sam: '#ffd7d0', shadow: '#d9dbe8', wizard: '#e2d8ff', snowball: '#dff3ff', ant: '#ffd9c7',
  frog: '#d3f7d6', merchant: '#ffe6bd', mum: '#ffd9f1', rubber: '#ffe0c2', fortune: '#dcdfff', tortoise: '#cdf3e3',
  cannon: '#d5dbe8', penny: '#ffe0ec', goat: '#f1ede2', hurdler: '#cdf1ee', slug: '#e6f5c4', parrot: '#ffd9d3', bear: '#f3dcc0', daredevil: '#ffd6d6',
  chicken: '#ffe1dc', hitch: '#d0f3ee', referee: '#e9e9ee', dervish: '#cdf4f7', photo: '#ecdcff', understudy: '#ffdfe5',
};
export const tint = (id: string) => TINT[id] ?? '#eee';

export const PLAYER_COLOURS = ['#ff5d4a', '#4aa8ff', '#3fc65a', '#f5a400', '#8b5cf6', '#ff7ab0', '#17b8a6', '#8a5a2b'];

export const SPACE_STYLE: Record<string, { fill: string; icon: string; label: string; help: string }> = {
  boost: { fill: '#5ad66f', icon: '»', label: 'Boost', help: 'Stop here: move forward 2.' },
  mud: { fill: '#b07a3c', icon: '≈', label: 'Mud', help: 'Stop here: move back 2.' },
  spring: { fill: '#4fd8ee', icon: '⤴', label: 'Spring', help: 'Stop here: teleport along the dashed arrow.' },
  event: { fill: '#c79bff', icon: '?', label: 'Event', help: 'First racer to stop here reveals an event card.' },
  star: { fill: '#ffc83d', icon: '★', label: 'Star', help: 'First racer to stop here wins 1 bonus star.' },
  web: { fill: '#c9c6d6', icon: '✳', label: 'Cobweb', help: 'Stop here: you are dazed and miss your next main move.' },
};

export interface Theme {
  sky: [string, string];
  ribbon: string;
  edge: string;
  tile: string;
}
export const THEMES: Record<string, Theme> = {
  corkscrew: { sky: ['#ffb36b', '#e2572b'], ribbon: '#ffe6c2', edge: '#7a2e12', tile: '#fff7e8' },
  lagoon: { sky: ['#5fe0c0', '#0f8f86'], ribbon: '#fff1c9', edge: '#0b5a5a', tile: '#fffdf2' },
  ridge: { sky: ['#bfe9ff', '#62b8ff'], ribbon: '#fff6dd', edge: '#2f6b3a', tile: '#ffffff' },
  bigtop: { sky: ['#ff9fc0', '#e23a63'], ribbon: '#fff3d9', edge: '#7a1230', tile: '#ffffff' },
  hairpins: { sky: ['#6a58b5', '#221848'], ribbon: '#ddd0ff', edge: '#140d2e', tile: '#f6f1ff' },
  volcano: { sky: ['#ffb07a', '#5a2a3a'], ribbon: '#ffd9a0', edge: '#3a1620', tile: '#fff6e6' },
  plain: { sky: ['#ddd', '#999'], ribbon: '#fff', edge: '#444', tile: '#fff' },
};
