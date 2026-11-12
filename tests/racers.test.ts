import { activeId, go, mk, spaces } from './helpers';
import { RACER_LIST } from '../src/engine/racers';
import { ABILITIES } from '../src/engine/abilities';

describe('roster', () => {
  it('has 32 racers, each with an ability handler', () => {
    expect(RACER_LIST).toHaveLength(32);
    for (const r of RACER_LIST) expect(ABILITIES[r.id], r.id).toBeDefined();
  });
});

describe('basic turn', () => {
  it('rolls, moves and passes the turn', () => {
    const hs = mk(['x1', 'x2', 'x3'], { dice: [4] });
    expect(hs.choice?.kind).toBe('roll');
    go(hs, 0);
    expect(spaces(hs)).toEqual([4, 0, 0]);
    expect(activeId(hs)).toBe(1);
  });

  it('a dazed racer skips its main move, then recovers', () => {
    const hs = mk(['x1', 'x2', 'x3'], { tweak: (c) => (c.entrants[0].dazed = true) });
    expect(hs.choice?.kind).toBe('dazed');
    go(hs, 0);
    expect(spaces(hs)).toEqual([0, 0, 0]);
    expect(hs.core.entrants[0].dazed).toBe(false);
    expect(activeId(hs)).toBe(1);
  });
});

describe('Jetpack Granny', () => {
  it('ignite adds two dice', () => {
    const hs = mk(['granny', 'x1', 'x2'], { dice: [3, 5] });
    expect(hs.choice?.kind).toBe('ability');
    go(hs, 1, 0);
    expect(spaces(hs)[0]).toBe(8);
  });
  it('doubles crash: no move and dazed', () => {
    const hs = mk(['granny', 'x1', 'x2'], { dice: [2, 2] });
    go(hs, 1, 0);
    expect(spaces(hs)[0]).toBe(0);
    expect(hs.core.entrants[0].dazed).toBe(true);
  });
  it('declining rolls one die', () => {
    const hs = mk(['granny', 'x1', 'x2'], { dice: [3, 5] });
    go(hs, 0, 0);
    expect(spaces(hs)[0]).toBe(3);
  });
  it('is not offered the jetpack while dazed', () => {
    const hs = mk(['granny', 'x1', 'x2'], { tweak: (c) => (c.entrants[0].dazed = true) });
    expect(hs.choice?.kind).toBe('dazed');
  });
});

describe('Sleepy Giant', () => {
  it('sleeps on 1–3', () => {
    const hs = mk(['giant', 'x1', 'x2'], { dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(0);
  });
  it('doubles 4–6', () => {
    const hs = mk(['giant', 'x1', 'x2'], { dice: [5] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(10);
  });
});

it('Magnet Mole pulls racers 1 or 2 ahead back 1', () => {
  const hs = mk(['mole', 'x1', 'x2', 'x3'], { spaces: [5, 8, 9, 10], dice: [2] });
  go(hs, 0);
  expect(spaces(hs)).toEqual([7, 7, 8, 10]);
});

describe('Tailwind Kite', () => {
  it('moves 1 when passed by a main move', () => {
    const hs = mk(['x1', 'kite', 'x2'], { spaces: [0, 2, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([4, 3, 0]);
  });
  it('does not trigger when landed on', () => {
    const hs = mk(['x1', 'kite', 'x2'], { spaces: [0, 4, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([4, 4, 0]);
  });
});

describe('Toll Troll', () => {
  it('pushes back a racer who stops on his space', () => {
    const hs = mk(['x1', 'troll', 'x2'], { spaces: [0, 3, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([1, 3, 0]);
  });
  it('backward movement stops at the start', () => {
    const hs = mk(['x1', 'troll', 'x2'], { spaces: [0, 1, 0], dice: [1] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([0, 1, 0]);
  });
});

describe('Lucky Duck', () => {
  it('moves 2 when anyone rolls a 1', () => {
    const hs = mk(['x1', 'duck', 'x2'], { dice: [1] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([1, 2, 0]);
  });
  it('ignores other rolls', () => {
    const hs = mk(['x1', 'duck', 'x2'], { dice: [2] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([2, 0, 0]);
  });
});

describe('Professor Redo', () => {
  it('may reroll another racer’s die', () => {
    const hs = mk(['x1', 'redo', 'x2'], { dice: [2, 6] });
    go(hs, 0);
    expect(hs.choice?.playerId).toBe(1);
    expect(hs.choice?.options).toEqual(['Keep', 'Reroll the 2']);
    go(hs, 1);
    expect(spaces(hs)[0]).toBe(6);
  });
  it('may keep the roll', () => {
    const hs = mk(['x1', 'redo', 'x2'], { dice: [2, 6] });
    go(hs, 0, 0);
    expect(spaces(hs)[0]).toBe(2);
  });
});

describe('Slingshot Sam', () => {
  it('+3 when alone in last', () => {
    const hs = mk(['sam', 'x1', 'x2'], { spaces: [0, 3, 4], dice: [2] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(5);
  });
  it('no bonus when tied for last', () => {
    const hs = mk(['sam', 'x1', 'x2'], { spaces: [0, 0, 4], dice: [2] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(2);
  });
});

describe('Shadow', () => {
  it('follows a big move by a racer ahead', () => {
    const hs = mk(['x1', 'shadow', 'x2'], { spaces: [3, 1, 0], dice: [5] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([8, 3, 0]);
  });
  it('ignores racers who started behind, and small moves', () => {
    let hs = mk(['x1', 'shadow', 'x2'], { spaces: [0, 1, 0], dice: [5] });
    go(hs, 0);
    expect(spaces(hs)[1]).toBe(1);
    hs = mk(['x1', 'shadow', 'x2'], { spaces: [3, 1, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[1]).toBe(1);
  });
});

describe('Bubble Wizard', () => {
  it('swaps instead of rolling, once per heat', () => {
    const hs = mk(['wizard', 'x1', 'x2'], { spaces: [0, 10, 5], dice: [1, 1, 1] });
    expect(hs.choice?.options).toHaveLength(3);
    go(hs, 1);
    expect(spaces(hs)).toEqual([10, 0, 5]);
    expect(activeId(hs)).toBe(1);
    go(hs, 0, 0);
    expect(activeId(hs)).toBe(0);
    expect(hs.choice?.kind).toBe('roll');
  });
});

it('Snowball builds momentum and loses it when moved backward', () => {
  const hs = mk(['snowball', 'troll', 'x1'], { spaces: [0, 6, 20], dice: [2, 1, 1, 4, 1, 1, 1] });
  go(hs, 0);
  expect(spaces(hs)[0]).toBe(2);
  go(hs, 0, 0, 0); // troll to 7, x1, snowball rolls 4 +1 = 5 -> 7 -> toll -> 5
  expect(spaces(hs)[0]).toBe(5);
  expect(hs.core.entrants[0].counters.momentum).toBe(0);
  go(hs, 0, 0, 0);
  expect(spaces(hs)[0]).toBe(6);
});

it('Picnic Ant moves 1 per racer sharing her space', () => {
  const hs = mk(['ant', 'x1', 'x2'], { spaces: [0, 3, 3], dice: [3] });
  go(hs, 0);
  expect(spaces(hs)[0]).toBe(5);
});

it('Trampoline Frog bounces past occupied spaces', () => {
  const hs = mk(['frog', 'x1', 'x2'], { spaces: [0, 3, 4], dice: [3] });
  go(hs, 0);
  expect(spaces(hs)[0]).toBe(5);
});

it('Marble Merchant dazes the next racer to stop on his marbles', () => {
  const hs = mk(['merchant', 'x1', 'x2'], { spaces: [2, 0, 0], dice: [3, 2] });
  go(hs, 0);
  expect(hs.core.spaceState.marbles[2]).toBe(0);
  go(hs, 0);
  expect(hs.core.entrants[1].dazed).toBe(true);
  expect(hs.core.spaceState.marbles[2]).toBeUndefined();
});

it('Stage Mum names a darling and moves when it rolls 4+', () => {
  const hs = mk(['mum', 'x1', 'x2'], { dice: [2, 5] });
  expect(hs.choice?.kind).toBe('ability');
  expect(hs.choice?.options).toHaveLength(2);
  go(hs, 0, 0, 0);
  expect(spaces(hs)).toEqual([3, 5, 0]);
});

describe('Rubber Band', () => {
  it('may snap to 4 behind a distant leader', () => {
    const hs = mk(['rubber', 'x1', 'x2'], { spaces: [0, 12, 3] });
    go(hs, 1);
    expect(spaces(hs)[0]).toBe(8);
    expect(activeId(hs)).toBe(1);
  });
  it('gets no offer when the leader is close', () => {
    const hs = mk(['rubber', 'x1', 'x2'], { spaces: [0, 8, 3] });
    expect(hs.choice?.kind).toBe('roll');
  });
});

describe('Fortune Teller', () => {
  it('correct prediction gives +2', () => {
    const hs = mk(['fortune', 'x1', 'x2'], { dice: [3] });
    go(hs, 0, 0);
    expect(spaces(hs)[0]).toBe(5);
  });
  it('wrong prediction gives −1', () => {
    const hs = mk(['fortune', 'x1', 'x2'], { dice: [3] });
    go(hs, 1, 0);
    expect(spaces(hs)[0]).toBe(2);
  });
});

describe('Tug Tortoise', () => {
  it('treats 1–2 as 3 and ignores other racers’ abilities', () => {
    const hs = mk(['x1', 'tortoise', 'troll'], { spaces: [0, 0, 3], dice: [6, 2] });
    go(hs, 0, 0);
    expect(spaces(hs)).toEqual([6, 3, 3]);
  });
  it('is still affected by track spaces', () => {
    const hs = mk(['tortoise', 'x1', 'x2'], { track: 'corkscrew', spaces: [5, 0, 0], dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(7);
  });
});

describe('Chaos Chicken', () => {
  it('a 6 sends everyone else back 1', () => {
    const hs = mk(['chicken', 'x1', 'x2'], { spaces: [0, 5, 5], dice: [6] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([6, 4, 4]);
  });
  it('a 1 sends everyone else forward 1', () => {
    const hs = mk(['chicken', 'x1', 'x2'], { spaces: [0, 5, 5], dice: [1] });
    go(hs, 0);
    expect(spaces(hs)).toEqual([1, 6, 6]);
  });
});

describe('Hitchhiker', () => {
  it('may teleport to where the passer lands, once per heat', () => {
    const hs = mk(['x1', 'hitch', 'x2'], { spaces: [0, 2, 0], dice: [5] });
    go(hs, 0);
    expect(hs.choice?.playerId).toBe(1);
    go(hs, 1);
    expect(spaces(hs)).toEqual([5, 5, 0]);
    expect(hs.core.entrants[1].usedHeat).toBe(true);
  });
  it('may decline and keep the ability', () => {
    const hs = mk(['x1', 'hitch', 'x2'], { spaces: [0, 2, 0], dice: [5] });
    go(hs, 0, 0);
    expect(spaces(hs)).toEqual([5, 2, 0]);
    expect(hs.core.entrants[1].usedHeat).toBe(false);
  });
});

it('Referee moves when another racer’s ability moves someone forward', () => {
  const hs = mk(['x1', 'duck', 'referee'], { dice: [1] });
  go(hs, 0);
  expect(spaces(hs)).toEqual([1, 2, 1]);
});

describe('Dizzy Dervish', () => {
  it('uses the higher of two dice', () => {
    const hs = mk(['dervish', 'x1', 'x2'], { dice: [2, 5] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(5);
    expect(hs.core.entrants[0].dazed).toBe(false);
  });
  it('doubles daze her after moving', () => {
    const hs = mk(['dervish', 'x1', 'x2'], { dice: [4, 4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(4);
    expect(hs.core.entrants[0].dazed).toBe(true);
  });
});

describe('Photo Finisher', () => {
  it('−1 with a minimum of 1 far from the finish', () => {
    let hs = mk(['photo', 'x1', 'x2'], { dice: [1] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(1);
    hs = mk(['photo', 'x1', 'x2'], { dice: [4] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(3);
  });
  it('+3 within 8 of the finish', () => {
    const hs = mk(['photo', 'x1', 'x2'], { spaces: [22, 0, 0], dice: [2] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(27);
  });
});

it('Understudy inherits the ability of the first racer to leave', () => {
  const hs = mk(['duck', 'understudy', 'x1', 'x2'], { spaces: [29, 0, 0, 0], dice: [3, 1] });
  go(hs, 0);
  expect(hs.core.entrants[1].abilityId).toBe('duck');
  go(hs, 0);
  expect(spaces(hs)[1]).toBe(3);
});

describe('Captain Cannonball', () => {
  it('fires 9 spaces once per heat and is dazed', () => {
    const hs = mk(['cannon', 'x1', 'x2']);
    expect(hs.choice?.kind).toBe('ability');
    go(hs, 1);
    expect(spaces(hs)[0]).toBe(9);
    expect(hs.core.entrants[0].dazed).toBe(true);
    expect(hs.core.entrants[0].usedHeat).toBe(true);
    expect(activeId(hs)).toBe(1);
  });
});

it('Penny Pig saves coins on low rolls and can smash the bank', () => {
  const hs = mk(['penny', 'x1', 'x2'], { dice: [2, 1, 1, 4] });
  expect(hs.choice?.kind).toBe('roll');
  go(hs, 0, 0, 0);
  expect(hs.core.entrants[0].counters.coins).toBe(1);
  expect(hs.choice?.kind).toBe('ability');
  go(hs, 1, 0);
  expect(spaces(hs)[0]).toBe(9); // 2, then 4 + 3
  expect(hs.core.entrants[0].counters.coins).toBe(0);
});

it('Billy Bash knocks back everyone on the space he stops on', () => {
  const hs = mk(['goat', 'x1', 'x2'], { spaces: [0, 3, 3], dice: [3] });
  go(hs, 0);
  expect(spaces(hs)).toEqual([3, 1, 1]);
});

it('Hurdling Hank moves 1 extra for each racer he passes', () => {
  const hs = mk(['hurdler', 'x1', 'x2'], { spaces: [0, 2, 3], dice: [5] });
  go(hs, 0);
  expect(spaces(hs)[0]).toBe(7);
});

describe('Steady Slug', () => {
  it('always moves exactly 3', () => {
    const hs = mk(['slug', 'x1', 'x2'], { dice: [6] });
    go(hs, 0);
    expect(spaces(hs)[0]).toBe(3);
  });
  it('moves 5 when another racer finishes', () => {
    const hs = mk(['x1', 'slug', 'x2'], { spaces: [29, 4, 0], dice: [3] });
    go(hs, 0);
    expect(spaces(hs)[1]).toBe(9);
  });
});

it('Polly Repeat moves when someone repeats her last roll', () => {
  const hs = mk(['parrot', 'x1', 'x2'], { dice: [4, 4, 2] });
  go(hs, 0, 0, 0);
  expect(spaces(hs)).toEqual([6, 4, 2]);
});

it('Honey Bear dazes a racer who stops on his space', () => {
  const hs = mk(['x1', 'bear', 'x2'], { spaces: [0, 3, 0], dice: [3] });
  go(hs, 0);
  expect(hs.core.entrants[0].dazed).toBe(true);
});

describe('Dare Devil Dee', () => {
  it('doubles a roll of 4 or more', () => {
    const hs = mk(['daredevil', 'x1', 'x2'], { dice: [5] });
    go(hs, 1, 0);
    expect(spaces(hs)[0]).toBe(10);
  });
  it('moves nothing on 3 or less', () => {
    const hs = mk(['daredevil', 'x1', 'x2'], { dice: [2] });
    go(hs, 1, 0);
    expect(spaces(hs)[0]).toBe(0);
  });
  it('can play it safe', () => {
    const hs = mk(['daredevil', 'x1', 'x2'], { dice: [2] });
    go(hs, 0, 0);
    expect(spaces(hs)[0]).toBe(2);
  });
});
