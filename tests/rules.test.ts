import { activeId, go, mk, spaces } from './helpers';
import { advanceHeat } from '../src/engine/heat';
import { ChainHalt, Ctx, HeatOver, MAX_EFFECTS_PER_TURN } from '../src/engine/ctx';
import { CARD_LIST } from '../src/engine/cards';
import type { HeatState } from '../src/engine/types';

const X = ['x1', 'x2', 'x3'];
const ck = { track: 'corkscrew' };

describe('track spaces (Corkscrew Canyon)', () => {
  it('boost: +2 on stop', () => {
    const hs = mk(X, { ...ck, dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(6);
  });
  it('passing a space does nothing', () => {
    const hs = mk(X, { ...ck, spaces: [3, 0, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(6);
  });
  it('mud: −2 on stop', () => {
    const hs = mk(X, { ...ck, spaces: [5, 0, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(7);
  });
  it('spring teleports to its linked space', () => {
    const hs = mk(X, { ...ck, spaces: [8, 0, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(15);
  });
  it('star goes to the first racer only', () => {
    const hs = mk(X, { ...ck, spaces: [10, 10, 0], dice: [4, 4] });
    go(hs, 0, 0);
    expect(hs.core.starsEarned).toEqual({ 0: 1 });
  });
  it('cobweb dazes whoever stops on it', () => {
    const hs = mk(X, { track: 'hairpins', spaces: [2, 0, 0], dice: [4] });
    go(hs, 0);
    expect(hs.core.entrants[0].dazed).toBe(true);
  });
  it('a space affects a racer at most once per turn', () => {
    // Stampede pushes the revealer from the event space onto mud; mud does not apply.
    const hs = mk(X, { ...ck, spaces: [3, 0, 0], dice: [4], deck: ['stampede'] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([9, 2, 2]);
  });
});

describe('event cards', () => {
  it('there are 12', () => expect(CARD_LIST).toHaveLength(12));

  it('event space reveals once; Tailwind gives +1 afterwards', () => {
    const hs = mk(X, { ...ck, spaces: [3, 0, 0], dice: [4, 2], deck: ['tailwind', 'mirror'] });
    go(hs, 0);
    expect(hs.core.activeCards).toEqual(['tailwind']);
    expect(hs.core.spaceState.eventUsed[7]).toBe(true);
    go(hs, 0);
    expect(spaces(hs)[1]).toBe(3);
    expect(hs.core.deck).toEqual(['mirror']);
  });
  it('Headwind: 6 counts as 4', () => {
    const hs = mk(X, { cards: ['headwind'], dice: [6] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(4);
  });
  it('Mud Slide: leader back 3', () => {
    const hs = mk(X, { ...ck, spaces: [3, 21, 0], dice: [4], deck: ['mudslide'] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([7, 18, 0]);
  });
  it('Wide Awake: clears and prevents daze', () => {
    const hs = mk(['x1', 'dervish', 'x3'], {
      ...ck, spaces: [3, 0, 0], dice: [4, 2, 2], deck: ['wideawake'],
      tweak: (c) => (c.entrants[2].dazed = true),
    });
    go(hs, 0);
    expect(hs.core.entrants[2].dazed).toBe(false);
    go(hs, 0);
    expect(hs.core.entrants[1].dazed).toBe(false);
  });
  it('Mirror Day: odd goes backward, even doubles', () => {
    let hs = mk(X, { cards: ['mirror'], spaces: [10, 0, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(7);
    hs = mk(X, { cards: ['mirror'], spaces: [10, 0, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(18);
  });
  it('Group Hug: everyone teleports to the middle racer', () => {
    const hs = mk(X, { ...ck, spaces: [3, 21, 2], dice: [4], deck: ['grouphug'] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([7, 7, 7]);
  });
  it('Sudden Sprint: heat ends on the first finish; furthest ahead takes second', () => {
    const hs = mk(X, { cards: ['sprint'], spaces: [28, 10, 5], dice: [3] });
    go(hs, 0);
    expect(hs.core.over).toBe(true);
    expect(hs.core.placings).toEqual([0, 1]);
    expect(hs.core.starsEarned).toEqual({ 0: 4, 1: 2 });
  });
  it('Trapdoor: knocks out the revealer', () => {
    const hs = mk(X, { ...ck, spaces: [3, 0, 0], dice: [4], deck: ['trapdoor'] });
    go(hs, 0);
    expect(hs.core.entrants[0].status).toBe('out');
    expect(activeId(hs)).toBe(1);
  });
  it('Trapdoor: only dazes when 2 racers remain', () => {
    const hs = mk(X, {
      ...ck, spaces: [3, 0, 30], dice: [4], deck: ['trapdoor'],
      tweak: (c) => {
        c.entrants[2].status = 'finished';
        c.placings = [2];
      },
    });
    go(hs, 0);
    expect(hs.core.entrants[0].status).toBe('racing');
    expect(hs.core.entrants[0].dazed).toBe(true);
  });
  it('Double Dice: use the lower of two', () => {
    const hs = mk(X, { cards: ['doubledice'], dice: [5, 2] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(2);
  });
  it('Underdog Hour: +2 when alone in last', () => {
    const hs = mk(X, { cards: ['underdog'], spaces: [0, 3, 4], dice: [2] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(4);
  });
  it('Silence!: abilities are off, then return', () => {
    const hs = mk(['x1', 'duck', 'x2'], { cards: ['silence'], dice: [1, 1, 1], tweak: (c) => (c.silenceLeft = 2) });
    go(hs, 0);
    expect(spaces(hs)).toEqual([1, 0, 0]);
    go(hs, 0);
    expect(spaces(hs)).toEqual([1, 1, 0]);
    expect(hs.core.activeCards).toEqual([]);
    go(hs, 0);
    expect(spaces(hs)).toEqual([1, 3, 1]);
  });
});

describe('priority and interactions', () => {
  it('active racer resolves first: Picnic Ant leaves before Toll Troll can charge', () => {
    const hs = mk(['ant', 'troll', 'x1'], { spaces: [0, 3, 3], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(5);
  });
  it('Frog’s bounce is part of the main move: only the final space applies', () => {
    const hs = mk(['frog', 'x1', 'x2'], { ...ck, spaces: [0, 3, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(6); // bounced 3 -> 4 (boost) -> 6
  });
  it('a racer pulled onto mud by Magnet Mole triggers the mud', () => {
    const hs = mk(['mole', 'x1', 'x2'], { ...ck, spaces: [6, 10, 0], dice: [2] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([8, 7, 0]);
  });
  it('a teleport is not a move: Kite is not passed by a spring jump', () => {
    const hs = mk(['x1', 'kite', 'x2'], { ...ck, spaces: [8, 13, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([15, 13, 0]);
  });
  it('Professor Redo’s reroll is what Lucky Duck sees', () => {
    const hs = mk(['x1', 'redo', 'duck'], { dice: [1, 4] });
    go(hs, 0, 1);
    expect(spaces(hs)).toEqual([4, 0, 0]);
  });
  it('marbles do not daze Tug Tortoise', () => {
    const hs = mk(['merchant', 'tortoise', 'x1'], { spaces: [3, 0, 0], dice: [2, 1] });
    go(hs, 0, 0);
    expect(spaces(hs)[1]).toBe(3);
    expect(hs.core.entrants[1].dazed).toBe(false);
  });
  it('Mirror Day stacks with modifiers after direction is set', () => {
    const hs = mk(['sam', 'x1', 'x2'], { cards: ['mirror'], spaces: [5, 8, 9], dice: [2] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(12); // 2 doubled = 4, +3
  });
});

describe('finishing and scoring', () => {
  it('first gets 4 stars, second gets 2, and the heat ends', () => {
    const hs = mk(X, { spaces: [28, 27, 0], dice: [5, 6] });
    go(hs, 0, 0);
    expect(hs.core.over).toBe(true);
    expect(hs.core.placings).toEqual([0, 1]);
    expect(hs.core.starsEarned).toEqual({ 0: 4, 1: 2 });
    expect(() => advanceHeat(hs)).toThrow();
  });
  it('a finished racer is skipped in turn order', () => {
    const hs = mk(X, { spaces: [28, 0, 0], dice: [5, 1, 1] });
    go(hs, 0, 0, 0);
    expect(activeId(hs)).toBe(1);
  });
  it('when knock-outs leave one racer, it takes the next place', () => {
    const hs = mk(X, { spaces: [30, 5, 3], tweak: (c) => { c.entrants[0].status = 'finished'; c.placings = [0]; } });
    const ctx = new Ctx(hs.core, []);
    expect(() => ctx.knockOut(ctx.ent(1))).toThrow(HeatOver);
    expect(hs.core.placings).toEqual([0, 2]);
  });
});

describe('engine safety', () => {
  it('the loop guard halts runaway chains', () => {
    const hs = mk(X, { spaces: [10, 0, 0] });
    const ctx = new Ctx(hs.core, []);
    const run = () => {
      for (let i = 0; i <= MAX_EFFECTS_PER_TURN; i++) ctx.bonusMove(ctx.ent(0), i % 2 ? 1 : -1, { kind: 'card' });
    };
    expect(run).toThrow(ChainHalt);
  });
  it('rejects answers that are not on offer', () => {
    const hs = mk(X);
    expect(() => advanceHeat(hs, 3)).toThrow();
    expect(() => advanceHeat(hs)).toThrow();
  });
  it('a heat saved mid-choice resumes to the same result', () => {
    const a = mk(['x1', 'hitch', 'x2'], { spaces: [0, 2, 0], dice: [5, 3, 2] });
    go(a, 0);
    const b: HeatState = JSON.parse(JSON.stringify(a));
    go(a, 1, 0, 0);
    go(b, 1, 0, 0);
    expect(b).toEqual(a);
  });
});
