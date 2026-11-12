import { createGame, currentPlayer, dispatch, MODES, standings } from '../src/engine/game';
import { nextRand } from '../src/engine/rng';
import { botAction, randomAnswer } from '../src/engine/ai';
import { trapSpaces, maxBid } from '../src/engine/game';
import type { Rules } from '../src/engine/types';
import type { GameState, Mode } from '../src/engine/types';

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, colour: `c${i}` }));

/** Play a whole game with random legal choices. Returns the final state. */
function playRandom(mode: Mode, n: number, seed: number, beginnerDeal = false, rules?: Partial<Rules>): GameState {
  const r = { rng: seed * 7919 + 1 };
  const pick = (k: number) => Math.floor(nextRand(r) * k);
  let g = createGame({ mode, players: people(n), beginnerDeal, seed, rules });
  let steps = 0;
  while (g.phase !== 'final') {
    if (++steps > 20000) throw new Error(`Stuck game (mode ${mode}, seed ${seed}, phase ${g.phase})`);
    if (g.phase === 'draft') {
      g = dispatch(g, { type: 'draftPick', racerId: g.draft!.pool[pick(g.draft!.pool.length)] }).state;
    } else if (g.phase === 'lineup') {
      const p = g.players[currentPlayer(g)!];
      const free = p.team.filter((x) => !p.used.includes(x));
      const racerIds: string[] = [];
      for (let i = 0; i < MODES[mode].perHeat; i++) racerIds.push(free.splice(pick(free.length), 1)[0]);
      g = dispatch(g, { type: 'lineupPick', racerIds }).state;
    } else if (g.phase === 'bids') {
      g = dispatch(g, { type: 'bid', amount: pick(maxBid(g.players[currentPlayer(g)!]) + 1) }).state;
    } else if (g.phase === 'traps') {
      const sp = trapSpaces(g);
      g = dispatch(g, { type: 'placeTrap', space: sp[pick(sp.length)], kind: pick(2) ? 'boost' : 'mud' }).state;
    } else if (g.phase === 'heat') {
      g = dispatch(g, { type: 'answer', option: randomAnswer(g.heat!.choice!, () => nextRand(r)) }).state;
    } else {
      g = dispatch(g, { type: 'nextHeat' }).state;
    }
  }
  return g;
}

describe('setup and draft', () => {
  it('enforces player counts per mode', () => {
    expect(() => createGame({ mode: 'standard', players: people(2), beginnerDeal: false, seed: 1 })).toThrow();
    expect(() => createGame({ mode: 'duel', players: people(3), beginnerDeal: false, seed: 1 })).toThrow();
    expect(() => createGame({ mode: 'trioDoubles', players: people(4), beginnerDeal: false, seed: 1 })).toThrow();
  });

  it('deals a pool of players × team + 2 (capped at the roster)', () => {
    expect(createGame({ mode: 'standard', players: people(4), beginnerDeal: false, seed: 1 }).draft!.pool).toHaveLength(18);
    expect(createGame({ mode: 'duel', players: people(2), beginnerDeal: false, seed: 1 }).draft!.pool).toHaveLength(18);
    expect(createGame({ mode: 'standard', players: people(6), beginnerDeal: false, seed: 1 }).draft!.pool).toHaveLength(26);
  });

  it('uses a snake draft', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: false, seed: 5 });
    expect(g.draft!.order).toEqual([0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0]);
    while (g.phase === 'draft') g = dispatch(g, { type: 'draftPick', racerId: g.draft!.pool[0] }).state;
    expect(g.players.map((p) => p.team.length)).toEqual([4, 4, 4]);
    expect(new Set(g.players.flatMap((p) => p.team)).size).toBe(12);
    expect(g.phase).toBe('lineup');
  });

  it('rejects picking an unavailable racer', () => {
    const g = createGame({ mode: 'standard', players: people(3), beginnerDeal: false, seed: 5 });
    expect(() => dispatch(g, { type: 'draftPick', racerId: 'nobody' })).toThrow();
  });

  it('draws heats only from the chosen tracks', () => {
    const g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 2, tracks: ['volcano', 'bigtop'] });
    expect(g.tracks).toHaveLength(4);
    expect(new Set(g.tracks)).toEqual(new Set(['volcano', 'bigtop']));
  });

  it('beginner deal skips the draft', () => {
    const g = createGame({ mode: 'standard', players: people(5), beginnerDeal: true, seed: 2 });
    expect(g.phase).toBe('lineup');
    expect(g.players.every((p) => p.team.length === 4)).toBe(true);
  });
});

describe('line-ups and heats', () => {
  it('the heat starts only when everyone has picked; each racer runs once', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 3 });
    const first = currentPlayer(g)!;
    expect(first).toBe(g.startPlayer);
    for (let i = 0; i < 3; i++) {
      expect(g.phase).toBe('lineup');
      const p = g.players[currentPlayer(g)!];
      g = dispatch(g, { type: 'lineupPick', racerIds: [p.team[0]] }).state;
    }
    expect(g.phase).toBe('heat');
    expect(g.heat!.core.trackId).toBe(g.tracks[0]);
    expect(g.heat!.core.entrants[0].ownerId).toBe(first);
    expect(g.players.every((p) => p.used.length === 1)).toBe(true);
  });

  it('rejects reusing a racer or picking the wrong number', () => {
    const g = createGame({ mode: 'duel', players: people(2), beginnerDeal: true, seed: 3 });
    const p = g.players[currentPlayer(g)!];
    expect(() => dispatch(g, { type: 'lineupPick', racerIds: [p.team[0]] })).toThrow();
    expect(() => dispatch(g, { type: 'lineupPick', racerIds: [p.team[0], p.team[0]] })).toThrow();
  });

  it('doubles modes field two racers per player, interleaved', () => {
    let g = createGame({ mode: 'duel', players: people(2), beginnerDeal: true, seed: 4 });
    for (let i = 0; i < 2; i++) {
      const p = g.players[currentPlayer(g)!];
      g = dispatch(g, { type: 'lineupPick', racerIds: p.team.slice(0, 2) }).state;
    }
    const owners = g.heat!.core.entrants.map((e) => e.ownerId);
    expect(owners).toEqual([g.startPlayer, 1 - g.startPlayer, g.startPlayer, 1 - g.startPlayer]);
  });

  it('dispatch does not mutate its input', () => {
    const g = createGame({ mode: 'standard', players: people(3), beginnerDeal: false, seed: 5 });
    const copy = JSON.stringify(g);
    dispatch(g, { type: 'draftPick', racerId: g.draft!.pool[0] });
    expect(JSON.stringify(g)).toBe(copy);
  });
});

describe('full games', () => {
  it('plays four heats on four different tracks and scores them', () => {
    const g = playRandom('standard', 4, 11);
    expect(g.history.map((h) => h.trackId)).toEqual(g.tracks);
    expect(new Set(g.tracks).size).toBe(4);
    const total = g.players.reduce((s, p) => s + p.stars, 0);
    const fromHistory = g.history.reduce((s, h) => s + Object.values(h.starsEarned).reduce((a, b) => a + b, 0), 0);
    expect(total).toBe(fromHistory);
    expect(total).toBeGreaterThanOrEqual(4 * 4);
    expect(g.players.every((p) => p.used.length === 4)).toBe(true);
    expect(standings(g).winners.length).toBeGreaterThanOrEqual(1);
  });

  it('the next heat is started by the player with the fewest stars', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 9 });
    const r = { rng: 42 };
    while (g.phase !== 'heatResults') {
      if (g.phase === 'lineup') {
        const p = g.players[currentPlayer(g)!];
        g = dispatch(g, { type: 'lineupPick', racerIds: [p.team[0]] }).state;
      } else {
        g = dispatch(g, { type: 'answer', option: randomAnswer(g.heat!.choice!, () => nextRand(r)) }).state;
      }
    }
    g = dispatch(g, { type: 'nextHeat' }).state;
    const fewest = Math.min(...g.players.map((p) => p.stars));
    expect(g.players[g.startPlayer].stars).toBe(fewest);
    expect(g.heatNumber).toBe(2);
  });

  it('standings break ties by wins, then second places', () => {
    const g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 1 });
    Object.assign(g.players[0], { stars: 8, wins: 1, seconds: 2 });
    Object.assign(g.players[1], { stars: 8, wins: 2, seconds: 0 });
    Object.assign(g.players[2], { stars: 8, wins: 2, seconds: 0 });
    const s = standings(g);
    expect(s.winners.map((p) => p.id)).toEqual([1, 2]);
    expect(s.ranked[2].id).toBe(0);
  });

  it('a game survives a JSON save and reload mid-heat', () => {
    let g = createGame({ mode: 'standard', players: people(3), beginnerDeal: true, seed: 8 });
    while (g.phase === 'lineup') {
      const p = g.players[currentPlayer(g)!];
      g = dispatch(g, { type: 'lineupPick', racerIds: [p.team[0]] }).state;
    }
    for (let i = 0; i < 5 && g.phase === 'heat'; i++) g = dispatch(g, { type: 'answer', option: 0 }).state;
    const loaded: GameState = JSON.parse(JSON.stringify(g));
    if (g.phase === 'heat') {
      expect(dispatch(loaded, { type: 'answer', option: 0 }).state).toEqual(dispatch(g, { type: 'answer', option: 0 }).state);
    }
  });
});

describe('soak: random full games never crash or stall', () => {
  const GAMES = 300;
  const cases: [Mode, number][] = [
    ['standard', 3], ['standard', 4], ['standard', 5], ['standard', 6], ['duel', 2], ['trioDoubles', 3],
  ];
  for (const [mode, n] of cases) {
    it(`${mode} with ${n} players × ${GAMES}`, () => {
      for (let seed = 1; seed <= GAMES; seed++) {
        // Every third game switches on a random mix of house rules.
        const on = (k: number) => seed % 3 === 0 && ((seed >> k) & 1) === 1;
        const rules: Partial<Rules> = { move: seed % 3 ? 'dice' : (['dice', 'cards', 'choice'] as const)[seed % 9 / 3 | 0], duels: on(1), boosts: on(2), traps: on(3), sprint: on(4), bidding: on(5), forks: seed % 3 === 0 };
        const g = playRandom(mode, n, seed, seed % 2 === 0, rules);
        expect(g.phase).toBe('final');
        expect(g.history).toHaveLength(4);
      }
    });
  }
});

describe('computer players', () => {
  const bots = (n: number, human = false) => Array.from({ length: n }, (_, i) => ({ name: 'B' + i, colour: 'c' + i, bot: !(human && i === 0) }));

  it('only acts on a computer player\'s turn', () => {
    const g = createGame({ mode: 'standard', players: bots(3, true), beginnerDeal: false, seed: 4 });
    const humanTurn = g.draft!.order[g.draft!.pick] === 0;
    expect(botAction(g) === null).toBe(humanTurn);
  });

  const cases: [Mode, number][] = [['standard', 3], ['standard', 6], ['duel', 2], ['trioDoubles', 3]];
  for (const [mode, n] of cases) {
    it('plays whole ' + mode + ' games with ' + n + ' computers, always legally', () => {
      for (let seed = 1; seed <= 40; seed++) {
        const r = { rng: seed };
        const all: Partial<Rules> = seed % 2 ? {} : { move: seed % 4 ? 'choice' : 'cards', duels: true, boosts: true, traps: true, sprint: true, bidding: true, forks: true };
        let g = createGame({ mode, players: bots(n), beginnerDeal: seed % 2 === 0, seed, rules: all });
        let steps = 0;
        while (g.phase !== 'final') {
          if (++steps > 20000) throw new Error('stuck');
          const a = g.phase === 'heatResults' ? ({ type: 'nextHeat' } as const) : botAction(g, () => nextRand(r));
          expect(a).not.toBeNull();
          g = dispatch(g, a!).state;
        }
        expect(g.history).toHaveLength(4);
      }
    });
  }
});
