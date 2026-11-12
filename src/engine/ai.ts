import type { Action, GameState, HeatState } from './types';
import { currentPlayer, MODES } from './game';

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

function chooseOption(hs: HeatState, playerId: number, rand: () => number): number {
  const choice = hs.choice!;
  const n = choice.options.length;
  if (n === 1) return 0;
  const core = hs.core;
  const self = core.entrants[choice.entrantId];
  const random = () => Math.floor(rand() * n);

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
      return random();
  }
}

/** The action a computer player takes now, or null if it is not a computer's move. */
export function botAction(g: GameState, rand: () => number = Math.random): Action | null {
  const pid = currentPlayer(g);
  if (pid === null || !g.players[pid].bot) return null;

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
    const p = g.players[pid];
    const free = p.team.filter((r) => !p.used.includes(r));
    const racerIds: string[] = [];
    for (let i = 0; i < MODES[g.mode].perHeat; i++) racerIds.push(free.splice(Math.floor(rand() * free.length), 1)[0]);
    return { type: 'lineupPick', racerIds };
  }
  if (g.phase === 'heat' && g.heat?.choice) {
    return { type: 'answer', option: chooseOption(g.heat, pid, rand) };
  }
  return null;
}
