import { activeId, go, mk, spaces } from './helpers';
import { advanceHeat } from '../src/engine/heat';
import { createGame, currentPlayer, dispatch, trapSpaces } from '../src/engine/game';
import type { GameState } from '../src/engine/types';

const X = ['x1', 'x2', 'x3'];
const people = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, colour: `c${i}` }));

describe('move cards', () => {
  it('cards only: play a card instead of rolling, and the hand refills when empty', () => {
    const hs = mk(X, { rules: { move: 'cards' } });
    expect(hs.choice?.kind).toBe('move');
    expect(hs.choice?.move).toMatchObject({ canRoll: false, cards: [1, 2, 3, 4, 5, 6] });
    go(hs, 4);
    expect(spaces(hs)[0]).toBe(4);
    expect(hs.core.entrants[0].hand).toEqual([1, 2, 3, 5, 6]);
    expect(() => advanceHeat(hs, 0)).toThrow(); // rolling is not allowed
    hs.base.entrants[1].hand = [2];
    hs.choice = null;
    hs.answers = [];
    advanceHeat(hs);
    go(hs, 2);
    expect(hs.core.entrants[1].hand).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('player\'s choice: roll or play a card, and each card is used once per heat', () => {
    const hs = mk(X, { rules: { move: 'choice' }, dice: [3] });
    expect(hs.choice?.move?.canRoll).toBe(true);
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(3);
    go(hs, 6);
    expect(spaces(hs)[1]).toBe(6);
    expect(hs.core.entrants[1].hand).toEqual([1, 2, 3, 4, 5]);
    expect(() => advanceHeat(hs, 7)).toThrow();
  });

  it('a played card counts as the roll for abilities', () => {
    const hs = mk(['x1', 'duck', 'x2'], { rules: { move: 'cards' } });
    go(hs, 1);
    expect(spaces(hs)).toEqual([1, 2, 0]);
  });

  it('Dizzy Dervish always rolls her two dice', () => {
    const hs = mk(['dervish', 'x1', 'x2'], { rules: { move: 'cards' }, dice: [2, 5] });
    expect(hs.choice?.kind).toBe('roll');
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(5);
  });
});

describe('boost tokens', () => {
  it('spending one gives +2 and uses it up', () => {
    const hs = mk(X, { rules: { boosts: true }, boosts: { 0: 1, 1: 0, 2: 0 }, dice: [3, 3] });
    expect(hs.choice?.move?.boosts).toBe(1);
    go(hs, 100);
    expect(spaces(hs)[0]).toBe(5);
    expect(hs.core.boosts[0]).toBe(0);
    expect(hs.choice?.kind).toBe('roll'); // the next player has none
  });
  it('cannot be spent without a token', () => {
    const hs = mk(X, { rules: { boosts: true, sprint: true }, boosts: { 0: 0 } });
    expect(() => advanceHeat(hs, 100)).toThrow();
  });
});

describe('timing sprint', () => {
  it('adds its bonus once per heat', () => {
    const hs = mk(X, { rules: { sprint: true }, dice: [2, 1, 1, 2] });
    go(hs, 4000); // sprint for +3
    expect(spaces(hs)[0]).toBe(5);
    expect(hs.core.entrants[0].sprintUsed).toBe(true);
    go(hs, 0, 0);
    expect(hs.choice?.kind).toBe('roll'); // already used
  });
  it('a missed sprint is used up for +0', () => {
    const hs = mk(X, { rules: { sprint: true }, dice: [2] });
    go(hs, 1000);
    expect(spaces(hs)[0]).toBe(2);
    expect(hs.core.entrants[0].sprintUsed).toBe(true);
  });
});

describe('space duels', () => {
  it('stopping on a rival starts a duel and the loser moves back 1', () => {
    const hs = mk(X, { rules: { duels: true }, spaces: [0, 3, 0], dice: [3] });
    go(hs, 0);
    expect(hs.choice?.kind).toBe('duel');
    expect(hs.choice?.duel).toEqual({ a: 0, b: 1 });
    go(hs, 0); // the mover wins
    expect(spaces(hs)).toEqual([3, 2, 0]);
  });
  it('the mover can lose', () => {
    const hs = mk(X, { rules: { duels: true }, spaces: [0, 3, 0], dice: [3] });
    go(hs, 0, 1);
    expect(spaces(hs)).toEqual([2, 3, 0]);
  });
  it('no duel between racers of the same player', () => {
    const hs = mk(X, { rules: { duels: true }, spaces: [0, 3, 0], dice: [3], tweak: (c) => (c.entrants[1].ownerId = 0) });
    go(hs, 0);
    expect(activeId(hs)).toBe(1);
    expect(spaces(hs)).toEqual([3, 3, 0]);
  });
});

describe('placed tiles', () => {
  it('a placed boost or mud tile works like the real thing', () => {
    const hs = mk(X, { extra: { 3: 'boost', 4: 'mud' }, dice: [3, 4] });
    go(hs, 0, 0);
    expect(spaces(hs)).toEqual([5, 2, 0]);
  });
});

describe('forked tracks', () => {
  const fork = { track: 'forky', rules: { forks: true } };
  it('asks which way to go at the shortcut, and the shortcut is shorter', () => {
    const hs = mk(X, { ...fork, spaces: [2, 0, 0], dice: [3] });
    go(hs, 0);
    expect(hs.choice?.kind).toBe('fork');
    expect(hs.choice?.fork).toEqual({ long: 5, short: 7 });
    go(hs, 1);
    expect(spaces(hs)[0]).toBe(7);
  });
  it('the long way is a normal move', () => {
    const hs = mk(X, { ...fork, spaces: [2, 0, 0], dice: [3] });
    go(hs, 0, 0);
    expect(spaces(hs)[0]).toBe(5);
  });
  it('stopping on the shortcut space triggers its hazard, which leads back out', () => {
    const hs = mk(X, { ...fork, spaces: [2, 0, 0], dice: [2] });
    go(hs, 0, 1); // 2 -> 3 -> shortcut (mud): back 2 -> 3 -> 2
    expect(spaces(hs)[0]).toBe(2);
  });
  it('a racer on the shortcut counts as between its two ends', () => {
    const hs = mk(['x1', 'kite', 'x3'], { ...fork, spaces: [4, 5.5, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([7, 7, 0]); // kite was passed, steps off the shortcut to 7
  });
  it('without the house rule there is no shortcut', () => {
    const hs = mk(X, { track: 'forky', spaces: [2, 0, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(5);
  });
});

describe('bidding and tile placement phases', () => {
  const toPhase = (g: GameState, phase: string) => {
    while (g.phase === 'lineup') {
      const p = g.players[currentPlayer(g)!];
      g = dispatch(g, { type: 'lineupPick', racerIds: [p.team.find((r) => !p.used.includes(r))!] }).state;
    }
    expect(g.phase).toBe(phase);
    return g;
  };

  it('nobody can bid in heat 1, so bidding is skipped', () => {
    const g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 3, rules: { bidding: true } });
    toPhase(g, 'heat');
  });

  it('the highest bidder pays and starts the heat', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 3, rules: { bidding: true } });
    g.players[0].stars = 5;
    g.players[1].stars = 2;
    g = toPhase(g, 'bids');
    expect(() => dispatch(g, { type: 'bid', amount: 9 })).toThrow();
    while (g.phase === 'bids') {
      const id = currentPlayer(g)!;
      g = dispatch(g, { type: 'bid', amount: id === 1 ? 2 : id === 0 ? 1 : 0 }).state;
    }
    expect(g.phase).toBe('heat');
    expect(g.players[1].stars).toBe(0);
    expect(g.players[0].stars).toBe(5);
    expect(g.heat!.core.entrants[0].ownerId).toBe(1);
  });

  it('every player places a tile, and they appear on the track', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 3, rules: { traps: true } });
    g = toPhase(g, 'traps');
    const free = trapSpaces(g);
    expect(() => dispatch(g, { type: 'placeTrap', space: 0, kind: 'mud' })).toThrow();
    g = dispatch(g, { type: 'placeTrap', space: free[0], kind: 'mud' }).state;
    g = dispatch(g, { type: 'placeTrap', space: free[0], kind: 'boost' }).state; // same space: wasted
    g = dispatch(g, { type: 'placeTrap', space: free[1], kind: 'boost' }).state;
    expect(g.phase).toBe('heat');
    expect(g.heat!.core.extra).toEqual({ [free[0]]: 'mud', [free[1]]: 'boost' });
  });

  it('boost tokens carry over between heats', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 3, rules: { boosts: true } });
    expect(g.players.map((p) => p.boosts)).toEqual([3, 3, 3]);
    g = toPhase(g, 'heat');
    const first = g.heat!.choice!.playerId;
    g = dispatch(g, { type: 'answer', option: 100 }).state;
    while (g.phase === 'heat') g = dispatch(g, { type: 'answer', option: 0 }).state;
    expect(g.players[first].boosts).toBe(2);
  });
});
