import { LAYOUTS } from '../src/ui/trackLayout';
import { FINISH, TRACKS, TRACK_IDS } from '../src/engine/tracks';

describe('track data', () => {
  it('has six playable tracks', () => expect(TRACK_IDS).toHaveLength(6));
  for (const id of TRACK_IDS) {
    it(id + ': special spaces are valid', () => {
      const sp = TRACKS[id].spaces;
      expect(sp[0]).toBeUndefined();
      expect(sp[FINISH]).toBeUndefined();
      for (const [k, def] of Object.entries(sp)) {
        expect(+k).toBeGreaterThan(0);
        expect(+k).toBeLessThan(FINISH);
        if (def.type === 'spring') {
          expect(def.to).toBeGreaterThan(0);
          expect(def.to).toBeLessThan(FINISH);
          expect(sp[def.to]).toBeUndefined();
        }
      }
      expect(Object.values(sp).filter((d) => d.type === 'event')).toHaveLength(2);
    });
  }
});

describe('track layouts', () => {
  for (const id of TRACK_IDS) {
    it(`${id}: 31 spaces inside the board, none overlapping`, () => {
      const { pts } = LAYOUTS[id];
      expect(pts).toHaveLength(31);
      let min = Infinity;
      for (let i = 0; i < pts.length; i++) {
        expect(pts[i][0]).toBeGreaterThan(30);
        expect(pts[i][0]).toBeLessThan(970);
        expect(pts[i][1]).toBeGreaterThan(30);
        expect(pts[i][1]).toBeLessThan(610);
        for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
      }
      expect(min).toBeGreaterThan(52);
    });
  }
});

describe('shortcut layouts', () => {
  it('shortcut spaces do not overlap any other space', async () => {
    const { FORK_PTS } = await import('../src/ui/trackLayout');
    expect(Object.keys(FORK_PTS).sort()).toEqual(['hairpins', 'lagoon']);
    for (const [id, nodes] of Object.entries(FORK_PTS)) {
      const all = [...LAYOUTS[id].pts, ...Object.values(nodes)];
      for (const p of Object.values(nodes)) {
        for (const q of all) if (q !== p) expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeGreaterThan(48);
      }
    }
  });
});
