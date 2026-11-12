import { advanceHeat, createHeat } from '../src/engine/heat';
import type { CardId, HeatCore, HeatState, Rules } from '../src/engine/types';

export interface Opts {
  spaces?: number[];
  dice?: number[];
  track?: string;
  cards?: CardId[];
  deck?: CardId[];
  tweak?: (c: HeatCore) => void;
  rules?: Partial<Rules>;
  boosts?: Record<number, number>;
  extra?: Record<number, 'boost' | 'mud'>;
}

/**
 * Build a heat with the given racers (ids starting with "x" have no ability),
 * one owner per racer, and advance to the first player prompt.
 */
export function mk(racers: string[], o: Opts = {}): HeatState {
  const hs = createHeat({
    racers: racers.map((racerId, i) => ({ racerId, ownerId: i })),
    trackId: o.track ?? 'plain',
    seed: 1,
    deck: o.deck ?? [],
    names: {},
    rules: o.rules,
    boosts: o.boosts,
    extra: o.extra,
  });
  const c = hs.base;
  o.spaces?.forEach((s, i) => (c.entrants[i].space = s));
  c.forcedDice = o.dice ?? [];
  if (o.cards) c.activeCards = [...o.cards];
  o.tweak?.(c);
  advanceHeat(hs);
  return hs;
}

export const go = (hs: HeatState, ...answers: number[]) => answers.forEach((a) => advanceHeat(hs, a));
export const spaces = (hs: HeatState) => hs.core.entrants.map((e) => e.space);
export const activeId = (hs: HeatState) => hs.core.order[hs.core.active];
