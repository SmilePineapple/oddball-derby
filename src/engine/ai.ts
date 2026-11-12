import type { Action, Choice, GameState, HeatState } from './types';
import { currentPlayer, maxBid, MODES, trapSpaces } from './game';
import { FINISH, TRACKS } from './tracks';

/**
 * Computer players. They only use what a human could see: the board, the
 * prompt and the dice already rolled. They never peek at future dice.
 */

/** Rough strength of each racer, used for drafting. */
const RATING: Record<string, number> = {
  snowball: 9, granny: 8, dervish: 8, redo: 7, wizard: 7, rubber: 7, giant: 6, duck: 6, sam: 6, shadow: 6, mum: 6,
  fortune: 6, tortoise: 6, hitch: 6, mole: 5, kite: 5, troll: 5, ant: 5, frog: 5, merchant: 5, chicken: 5, referee: 5,
  photo: 5, understudy: 5, cannon: 7, penny: 6, goat: 5, hurdler: 6, slug: 5, parrot: 6, bear: 5, daredevil: 6,
};

const numbers = (labels: string[]) => labels.map((l) => Number(/(\d+)/.exec(l)?.[1] ?? NaN));

/** A uniformly random legal answer to any choice. Used by tests and as a fallback. */
export function randomAnswer(choice: Choice, rand: () => number): number {
  if (choice.kind !== 'move') return Math.floor(rand() * choice.options.length);
  const mv = choice.move!;
  const bases = [...(mv.canRoll ? [0] : []), ...mv.cards];
  let n = bases[Math.floor(rand() * bases.length)];
  if (mv.boosts > 0 && rand() < 0.3) n += 100;
  if (mv.sprint && rand() < 0.3) n += 1000 * (1 + Math.floor(rand() * 4));
  return n;
}

/** How good it is to stop on a space, in spaces gained. */
function landing(hs: HeatState, from: number, steps: number): number {
  const core = hs.core;
  const to = Math.min(FINISH, from + steps);
  if (to >= FINISH) return steps + 10;
  const placed = core.extra[to];
  const def = placed ? { type: placed } : TRACKS[core.trackId].spaces[to];
  if (!def) return steps;
  switch (def.type) {
    case 'boost': return steps + 2;
    case 'mud': return steps - 2;
    case 'web': return steps - 3;
    case 'star': return steps + (core.spaceState.starTaken[to] ? 0 : 3);
    case 'spring': return steps + ((def as { to: number }).to - to);
    default: return steps;
  }
}

function chooseMove(hs: HeatState, rand: () => number): number {
  const choice = hs.choice!;
  const mv = choice.move!;
  const core = hs.core;
  const self = core.entrants[choice.entrantId];
  const toGo = FINISH - self.space;

  // Card or dice. A die is worth 3.5 on average.
  let base = 0;
  if (mv.cards.length) {
    let best = mv.cards[0];
    for (const c of mv.cards) if (landing(hs, self.space, c) > landing(hs, self.space, best)) best = c;
    const value = landing(hs, self.space, best);
    // With a choice, save cards for when they beat the dice clearly. Cards-only must play one.
    if (!mv.canRoll || value >= 5) base = best;
  }
  let n = base;
  // Boost tokens and the sprint are saved for the run-in.
  if (mv.boosts > 0 && (toGo <= 10 || rand() < 0.1)) n += 100;
  if (mv.sprint && (self.space >= 10 || rand() < 0.15)) n += 1000 * (1 + [0, 1, 1, 2, 2, 3][Math.floor(rand() * 6)]);
  return n;
}

function chooseOption(hs: HeatState, playerId: number, rand: () => number): number {
  const choice = hs.choice!;
  const n = choice.options.length;
  if (choice.kind === 'move') return chooseMove(hs, rand);
  if (choice.kind === 'duel') return rand() < 0.5 ? 0 : 1;
  if (choice.kind === 'fork') {
    // Take the shortcut when it ends past the hazards and further on than the long way.
    const f = choice.fork!;
    return Number.isInteger(f.short) && f.short > f.long ? 1 : 0;
  }
  if (n === 1) return 0;
  const core = hs.core;
  const self = core.entrants[choice.entrantId];

  switch (self.abilityId) {
    case 'granny': // two dice average 5.8 even after crashes, against 3.5
    case 'rubber': // the snap is always worth at least 5 spaces
      return 1;
    case 'cannon': // save the shot for the second half of the track
      return self.space >= 12 ? 1 : 0;
    case 'penny': // smash with a full bank, or when close to home
      return (self.counters.coins ?? 0) >= 3 || self.space >= 18 ? 1 : 0;
    case 'daredevil':
    case 'fortune':
      return rand() < 0.5 ? 0 : 1;
    case 'wizard': {
      // Swap only with someone well ahead.
      const spaces = choice.options.slice(1).map((l) => Number(/space (\d+)/.exec(l)?.[1] ?? 0));
      const best = spaces.indexOf(Math.max(...spaces));
      return spaces[best] - self.space >= 6 ? best + 1 : 0;
    }
    case 'hitch': {
      const to = Number(/space (\d+)/.exec(choice.prompt)?.[1] ?? 0);
      return to - self.space >= 4 ? 1 : 0;
    }
    case 'redo': {
      // Reroll my own bad dice and other players' good ones.
      const dice = numbers(choice.options.slice(1));
      const roller = core.entrants[core.order[core.active]];
      if (roller.ownerId === playerId) {
        const low = Math.min(...dice);
        return low <= 2 ? dice.indexOf(low) + 1 : 0;
      }
      const high = Math.max(...dice);
      return high >= 5 ? dice.indexOf(high) + 1 : 0;
    }
    default:
      return Math.floor(rand() * n);
  }
}

/** True if a human needs to play this duel on screen. */
export function duelNeedsHuman(g: GameState): boolean {
  const c = g.heat?.choice;
  if (g.phase !== 'heat' || !c || c.kind !== 'duel' || !c.duel) return false;
  const core = g.heat!.core;
  return !g.players[core.entrants[c.duel.a].ownerId].bot || !g.players[core.entrants[c.duel.b].ownerId].bot;
}

/** The action a computer player takes now, or null if it is not a computer's move. */
export function botAction(g: GameState, rand: () => number = Math.random): Action | null {
  const pid = currentPlayer(g);
  if (pid === null || !g.players[pid].bot) return null;
  const p = g.players[pid];

  if (g.phase === 'draft' && g.draft) {
    let best = g.draft.pool[0];
    let bestScore = -Infinity;
    for (const id of g.draft.pool) {
      const score = (RATING[id] ?? 5) + rand() * 3;
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    }
    return { type: 'draftPick', racerId: best };
  }
  if (g.phase === 'lineup') {
    const free = p.team.filter((r) => !p.used.includes(r));
    const racerIds: string[] = [];
    for (let i = 0; i < MODES[g.mode].perHeat; i++) racerIds.push(free.splice(Math.floor(rand() * free.length), 1)[0]);
    return { type: 'lineupPick', racerIds };
  }
  if (g.phase === 'bids') {
    // Going first is worth a little, so bid a single star now and then.
    return { type: 'bid', amount: maxBid(p) >= 1 && p.stars >= 3 && rand() < 0.35 ? 1 : 0 };
  }
  if (g.phase === 'traps') {
    const spaces = trapSpaces(g);
    return { type: 'placeTrap', space: spaces[Math.floor(rand() * spaces.length)], kind: rand() < 0.5 ? 'boost' : 'mud' };
  }
  if (g.phase === 'heat' && g.heat?.choice) {
    if (duelNeedsHuman(g)) return null;
    return { type: 'answer', option: chooseOption(g.heat, pid, rand) };
  }
  return null;
}
