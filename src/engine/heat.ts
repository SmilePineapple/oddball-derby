import type { CardId, Entrant, GameEvent, HeatCore, HeatState, MoveOptions, RacerId, Rules, TurnState } from './types';
import { ChainHalt, Ctx, HeatOver, Pause, spaceName, type MainMoveInfo } from './ctx';
import { FINISH, nextSpace } from './tracks';
import { rollDie } from './rng';

export const DEFAULT_RULES: Rules = { move: 'dice', duels: false, boosts: false, traps: false, sprint: false, bidding: false, forks: false };
const FULL_HAND = [1, 2, 3, 4, 5, 6];

const freshTurn = (): TurnState => ({ mod: 0, floor: 0, flags: {}, usedTurn: {}, spaceHit: {}, effects: 0 });

export function createHeat(o: {
  racers: { racerId: RacerId; ownerId: number }[];
  trackId: string;
  heatNumber?: number;
  seed: number;
  deck: CardId[];
  names: Record<number, string>;
  rules?: Partial<Rules>;
  boosts?: Record<number, number>;
  extra?: Record<number, 'boost' | 'mud'>;
}): HeatState {
  const rules = { ...DEFAULT_RULES, ...o.rules };
  const entrants: Entrant[] = o.racers.map((r, id) => ({
    id,
    racerId: r.racerId,
    abilityId: r.racerId,
    ownerId: r.ownerId,
    space: 0,
    dazed: false,
    status: 'racing',
    counters: {},
    usedHeat: false,
    hand: rules.move === 'dice' ? [] : [...FULL_HAND],
    sprintUsed: false,
  }));
  const core: HeatCore = {
    trackId: o.trackId,
    heatNumber: o.heatNumber ?? 1,
    rules,
    entrants,
    order: entrants.map((e) => e.id),
    active: 0,
    turnCount: 0,
    placings: [],
    activeCards: [],
    deck: [...o.deck],
    spaceState: { eventUsed: {}, starTaken: {}, marbles: {} },
    extra: { ...o.extra },
    boosts: { ...o.boosts },
    starsEarned: {},
    names: o.names,
    rng: o.seed | 0,
    forcedDice: [],
    silenceLeft: 0,
    turn: freshTurn(),
    over: false,
  };
  return { core, base: structuredClone(core), answers: [], emitted: 0, choice: null };
}

/** @param card a move card played instead of rolling */
function mainMove(ctx: Ctx, a: Entrant, card?: number): void {
  const h = ctx.h;
  const t = h.turn;
  const ab = ctx.ability(a);

  // --- roll ---
  type RollMode = 'one' | 'sum' | 'high' | 'low';
  let mode: RollMode = 'one';
  if (!card) {
    if (ctx.card('doubledice')) mode = 'low';
    else if (t.flags.ignite) mode = 'sum';
    else if (ab?.dice === 'high') mode = 'high';
  }
  const dice = card ? [card] : mode === 'one' ? [rollDie(h)] : [rollDie(h), rollDie(h)];
  if (card) ctx.emit('roll', `${ctx.label(a)} plays a ${card} card.`, { id: a.id, dice: [...dice], card: true });
  else ctx.emit('roll', `${ctx.label(a)} rolls ${dice.join(' and ')}.`, { id: a.id, dice: [...dice] });

  ctx.hook('onDiceRolled', a, dice);
  ctx.emit('dice', '', { id: a.id, dice: [...dice] });
  ctx.hook('onDiceFinal', a, dice);
  if (a.status !== 'racing') return;

  // --- compute ---
  const face = (d: number) => {
    let f = d;
    if (ctx.card('headwind') && f === 6) f = 4;
    if (ab?.dieFace) f = ab.dieFace(f);
    return f;
  };
  const faces = dice.map(face);
  const rollValue =
    mode === 'one' ? faces[0] : mode === 'sum' ? faces[0] + faces[1] : mode === 'high' ? Math.max(...faces) : Math.min(...faces);
  const doubles = dice.length === 2 && dice[0] === dice[1];
  const crash = mode === 'sum' && doubles;
  if (mode === 'high' && doubles) t.flags.dizzy = 1;

  let value = ab?.setValue ? ab.setValue(rollValue, ctx) : rollValue;
  let dir: 1 | -1 = 1;
  if (ctx.card('mirror')) {
    if (value % 2 === 1) dir = -1;
    else value *= 2;
  }
  ab?.onCompute?.(ctx, a, rollValue);
  if (ctx.card('tailwind')) t.mod += 1;
  const dist = crash ? 0 : Math.max(t.floor, value + t.mod);

  // --- move ---
  const from = a.space;
  const startSpaces: Record<number, number> = {};
  for (const e of h.entrants) startSpaces[e.id] = e.space;
  const path = ctx.walk(a, dist, dir, true);
  if (ab?.bounce && a.space !== from) {
    while (a.space < FINISH && ctx.others(a).some((o) => o.space === a.space)) {
      a.space = nextSpace(ctx.track, a.space, false);
      path.push(a.space);
    }
  }
  const to = a.space;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const passed = ctx.others(a).filter((o) => o.space > lo && o.space < hi).map((o) => o.id);
  const info: MainMoveInfo = { mover: a.id, from, to, dist, dir, dice, passed, startSpaces, finished: to >= FINISH };

  if (crash) {
    ctx.emit('crash', `${ctx.label(a)} rolled doubles and crashes!`, { id: a.id });
    ctx.daze(a, { kind: 'ability', by: a.id });
  }
  ctx.emit(
    'mainMove',
    to === from
      ? `${ctx.label(a)} doesn't move.`
      : `${ctx.label(a)} moves ${to > from ? 'forward' : 'back'} ${path.length} to ${spaceName(to)}.`,
    { id: a.id, from, to, dist, path },
  );
  if (to < from) ab?.onSelfBack?.(ctx, a);
  if (to >= FINISH) ctx.finish(a);
  else if (to !== from) {
    ctx.stopped(a);
    duel(ctx, a);
  }
  ctx.hook('afterMainMove', info);
}

/** House rule: a main move that ends on a rival's space starts a duel. The loser moves back 1. */
function duel(ctx: Ctx, a: Entrant): void {
  if (!ctx.h.rules.duels || a.status !== 'racing') return;
  const rival = ctx.others(a).find((o) => o.space === a.space && o.ownerId !== a.ownerId);
  if (!rival) return;
  ctx.emit('duelStart', `Duel! ${ctx.label(a)} against ${ctx.label(rival)}.`, { a: a.id, b: rival.id });
  const won = ctx.choose(a, 'duel', `Duel: ${ctx.label(a)} against ${ctx.label(rival)}`, [`${ctx.label(a)} wins`, `${ctx.label(rival)} wins`], {
    duel: { a: a.id, b: rival.id },
  });
  const winner = won === 0 ? a : rival;
  const loser = won === 0 ? rival : a;
  ctx.emit('duel', `${ctx.label(winner)} wins the duel!`, { id: winner.id, loser: loser.id });
  ctx.bonusMove(loser, -1, { kind: 'card' });
}

/** What the active racer may do for its main move under the house rules. */
function moveOptions(ctx: Ctx, a: Entrant): MoveOptions {
  const { rules, turn, boosts } = ctx.h;
  const cardsAllowed = rules.move !== 'dice' && !turn.flags.ignite && ctx.ability(a)?.dice !== 'high' && !ctx.card('doubledice');
  const cards = cardsAllowed ? [...a.hand].sort() : [];
  return {
    canRoll: rules.move !== 'cards' || cards.length === 0,
    cards,
    boosts: rules.boosts ? boosts[a.ownerId] ?? 0 : 0,
    sprint: rules.sprint && !a.sprintUsed,
  };
}

/** Run the active entrant's whole turn. Throws Pause when a player must answer. */
function runTurn(ctx: Ctx): void {
  const h = ctx.h;
  try {
    if (h.turnCount === 0) ctx.hook('onHeatStart');
    const a = ctx.active();
    h.turn = freshTurn();
    ctx.emit('turnStart', `— ${ctx.label(a)}'s turn${h.names[a.ownerId] ? ` (${h.names[a.ownerId]})` : ''} —`, {
      id: a.id, ownerId: a.ownerId,
    });
    ctx.hook('onTurnStart', a);
    if (ctx.card('underdog') && ctx.aloneLast(a)) {
      h.turn.mod += 2;
      ctx.emit('cardEffect', `Underdog Hour: ${ctx.label(a)} gets +2.`, { id: a.id, cardId: 'underdog' });
    }

    const wasDazed = a.dazed;
    const replaced = ctx.ability(a)?.preRoll?.(ctx, a) === true;
    if (replaced) {
      // An existing daze is used up; a daze caused by the ability itself stays.
      if (wasDazed) a.dazed = false;
    } else if (a.dazed) {
      ctx.choose(a, 'dazed', `${ctx.label(a)} is dazed and misses this main move.`, ['Continue']);
      a.dazed = false;
      ctx.emit('skip', `${ctx.label(a)} is dazed and skips their main move.`, { id: a.id });
    } else {
      const mv = moveOptions(ctx, a);
      if (!mv.cards.length && !mv.boosts && !mv.sprint) {
        ctx.choose(a, 'roll', `${ctx.label(a)}: roll!`, ['Roll']);
        mainMove(ctx, a);
      } else {
        const m = ctx.chooseMove(a, mv);
        if (m.boost) {
          h.boosts[a.ownerId]--;
          h.turn.mod += 2;
          ctx.emit('boost', `${h.names[a.ownerId] ?? ctx.label(a)} spends a boost token: +2.`, { id: a.id, ownerId: a.ownerId });
        }
        if (m.sprint) {
          a.sprintUsed = true;
          h.turn.mod += m.sprint - 1;
          ctx.emit('sprint', `${ctx.label(a)} sprints: +${m.sprint - 1}.`, { id: a.id, bonus: m.sprint - 1 });
        }
        if (m.card) {
          a.hand = a.hand.filter((c) => c !== m.card);
          if (h.rules.move === 'cards' && !a.hand.length) a.hand = [...FULL_HAND];
        }
        mainMove(ctx, a, m.card || undefined);
      }
    }
  } catch (e) {
    if (e instanceof HeatOver) {
      ctx.emit('heatOver', 'The heat is over!', { placings: [...h.placings] });
      return;
    }
    if (e instanceof ChainHalt) ctx.emit('halt', 'The dust settles. (Chain limit reached.)');
    else throw e;
  }

  // --- end of turn ---
  if (ctx.card('silence') && --h.silenceLeft <= 0) {
    h.activeCards = h.activeCards.filter((c) => c !== 'silence');
    ctx.emit('cardEnd', 'Silence! is over. Abilities work again.', { cardId: 'silence' });
  }
  h.turnCount++;
  const n = h.order.length;
  for (let i = 1; i <= n; i++) {
    const idx = (h.active + i) % n;
    if (ctx.ent(h.order[idx]).status === 'racing') {
      h.active = idx;
      break;
    }
  }
}

/**
 * Advance the heat until a player must answer or the heat ends.
 * Pass `answer` to resolve the pending choice (see Choice.kind for its meaning).
 * Mutates `hs` and returns the new events since the last call.
 */
export function advanceHeat(hs: HeatState, answer?: number): GameEvent[] {
  if (hs.core.over) throw new Error('The heat is over.');
  if (answer === undefined && hs.choice) throw new Error('A choice is pending.');
  if (answer !== undefined) {
    if (!hs.choice) throw new Error('No choice is pending.');
    const outOfRange = hs.choice.kind !== 'move' && answer >= hs.choice.options.length;
    if (!Number.isInteger(answer) || answer < 0 || outOfRange) throw new Error('Invalid option.');
  }
  let answers = answer === undefined ? hs.answers : [...hs.answers, answer];
  let skip = hs.emitted;
  const out: GameEvent[] = [];
  for (;;) {
    const core = structuredClone(hs.base);
    const ctx = new Ctx(core, answers);
    try {
      runTurn(ctx);
    } catch (e) {
      if (!(e instanceof Pause)) throw e;
      out.push(...ctx.events.slice(skip));
      hs.core = core;
      hs.answers = answers;
      hs.emitted = ctx.events.length;
      hs.choice = e.choice;
      return out;
    }
    out.push(...ctx.events.slice(skip));
    hs.core = core;
    hs.base = structuredClone(core);
    hs.answers = answers = [];
    hs.emitted = skip = 0;
    hs.choice = null;
    if (core.over) return out;
  }
}
