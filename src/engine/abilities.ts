import type { Ctx, MainMoveInfo, Src } from './ctx';
import type { Entrant } from './types';
import { FINISH } from './tracks';
import { rollDie } from './rng';

/**
 * One entry per racer. Hooks are called by the engine in priority order;
 * each hook re-checks its own condition at the moment it resolves.
 */
export interface Ability {
  /** Cannot be moved, teleported or dazed by other racers' abilities. */
  immune?: boolean;
  /** Rolls two dice and uses the higher. */
  dice?: 'high';
  /** Main move continues past occupied spaces. */
  bounce?: boolean;
  dieFace?(face: number): number;
  setValue?(value: number, ctx: Ctx): number;
  onHeatStart?(ctx: Ctx, self: Entrant): void;
  onTurnStart?(ctx: Ctx, self: Entrant, active: Entrant): void;
  /** Return true if the main move was replaced. */
  preRoll?(ctx: Ctx, self: Entrant): boolean | void;
  onDiceRolled?(ctx: Ctx, self: Entrant, roller: Entrant, dice: number[]): void;
  onDiceFinal?(ctx: Ctx, self: Entrant, roller: Entrant, dice: number[]): void;
  onCompute?(ctx: Ctx, self: Entrant, rollValue: number): void;
  afterMainMove?(ctx: Ctx, self: Entrant, info: MainMoveInfo): void;
  onStop?(ctx: Ctx, self: Entrant, mover: Entrant, space: number): void;
  onAbilityForward?(ctx: Ctx, self: Entrant, byId: number, target: Entrant): void;
  onLeftHeat?(ctx: Ctx, self: Entrant, leaver: Entrant): void;
  onSelfBack?(ctx: Ctx, self: Entrant): void;
  onSelfDazed?(ctx: Ctx, self: Entrant): void;
}

const by = (self: Entrant): Src => ({ kind: 'ability', by: self.id });

function activate(ctx: Ctx, self: Entrant, what: string): void {
  ctx.emit('ability', `${ctx.label(self)}: ${what}`, { id: self.id, abilityId: self.abilityId });
}

function pickDarling(ctx: Ctx, self: Entrant): void {
  const options = ctx.others(self);
  if (!options.length) return;
  const i = ctx.choose(self, 'ability', `${ctx.label(self)}: who is your darling?`, options.map((o) => ctx.label(o)));
  self.counters.darling = options[i].id;
  activate(ctx, self, `${ctx.label(options[i])} is her darling.`);
}

export const ABILITIES: Record<string, Ability> = {
  granny: {
    preRoll(ctx, self) {
      if (self.dazed || ctx.card('doubledice')) return;
      const a = ctx.choose(self, 'ability', 'Ignite the jetpack? Roll two dice and add them, but doubles means a crash.', [
        'Normal roll',
        'Ignite!',
      ]);
      if (a === 1) {
        ctx.h.turn.flags.ignite = 1;
        activate(ctx, self, 'ignites the jetpack!');
      }
    },
  },

  giant: {
    setValue: (v) => (v <= 3 ? 0 : v * 2),
  },

  mole: {
    afterMainMove(ctx, self, info) {
      if (info.mover !== self.id) return;
      const targets = ctx.others(self).filter((o) => o.space - self.space === 1 || o.space - self.space === 2);
      if (!targets.length) return;
      activate(ctx, self, 'pulls nearby racers back.');
      for (const t of targets) ctx.bonusMove(t, -1, by(self));
    },
  },

  kite: {
    afterMainMove(ctx, self, info) {
      if (info.mover === self.id || !info.passed.includes(self.id) || ctx.h.turn.usedTurn[self.id]) return;
      ctx.h.turn.usedTurn[self.id] = true;
      activate(ctx, self, 'catches the tailwind.');
      ctx.bonusMove(self, 1, by(self));
    },
  },

  troll: {
    onStop(ctx, self, mover, space) {
      if (mover.id === self.id || self.space !== space) return;
      activate(ctx, self, `charges ${ctx.label(mover)} a toll.`);
      ctx.bonusMove(mover, -2, by(self));
    },
  },

  duck: {
    onDiceFinal(ctx, self, _roller, dice) {
      for (const d of dice) {
        if (d !== 1) continue;
        activate(ctx, self, 'gets lucky on a 1.');
        ctx.bonusMove(self, 2, by(self));
      }
    },
  },

  redo: {
    onDiceRolled(ctx, self, roller, dice) {
      if (ctx.h.turn.usedTurn[self.id]) return;
      const a = ctx.choose(
        self,
        'ability',
        `${ctx.label(roller)} rolled ${dice.join(' and ')}. Force a reroll?`,
        ['Keep', ...dice.map((d) => `Reroll the ${d}`)],
      );
      if (a === 0) return;
      ctx.h.turn.usedTurn[self.id] = true;
      const old = dice[a - 1];
      dice[a - 1] = rollDie(ctx.h);
      activate(ctx, self, `rerolls the ${old}. It is now a ${dice[a - 1]}.`);
    },
  },

  sam: {
    onTurnStart(ctx, self, active) {
      if (active.id !== self.id || !ctx.aloneLast(self)) return;
      ctx.h.turn.mod += 3;
      activate(ctx, self, 'is alone in last place: +3.');
    },
  },

  shadow: {
    afterMainMove(ctx, self, info) {
      if (info.mover === self.id || info.dir < 0 || info.dist < 5 || ctx.h.turn.usedTurn[self.id]) return;
      if (info.startSpaces[info.mover] <= info.startSpaces[self.id]) return;
      ctx.h.turn.usedTurn[self.id] = true;
      activate(ctx, self, 'follows close behind.');
      ctx.bonusMove(self, 2, by(self));
    },
  },

  wizard: {
    preRoll(ctx, self) {
      if (self.usedHeat) return;
      const targets = ctx.others(self).filter((o) => !ctx.immune(o, by(self)));
      if (!targets.length) return;
      const a = ctx.choose(self, 'ability', 'Swap places with another racer instead of rolling? (once per heat)', [
        'No swap',
        ...targets.map((t) => `${ctx.label(t)} (space ${t.space})`),
      ]);
      if (a === 0) return;
      self.usedHeat = true;
      activate(ctx, self, 'blows a bubble...');
      ctx.swap(self, targets[a - 1]);
      return true;
    },
  },

  snowball: {
    onCompute(ctx, self) {
      const m = self.counters.momentum ?? 0;
      ctx.h.turn.mod += m;
      if (m) activate(ctx, self, `has momentum: +${m}.`);
      self.counters.momentum = Math.min(3, m + 1);
    },
    onSelfBack(_ctx, self) {
      self.counters.momentum = 0;
    },
    onSelfDazed(_ctx, self) {
      self.counters.momentum = 0;
    },
  },

  ant: {
    onStop(ctx, self, mover, space) {
      if (mover.id !== self.id || ctx.h.turn.usedTurn[self.id]) return;
      const n = ctx.others(self).filter((o) => o.space === space).length;
      if (!n) return;
      ctx.h.turn.usedTurn[self.id] = true;
      activate(ctx, self, `found a crowd: forward ${n}.`);
      ctx.bonusMove(self, n, by(self));
    },
  },

  frog: { bounce: true },

  merchant: {
    afterMainMove(ctx, self, info) {
      if (info.mover !== self.id) return;
      const m = ctx.h.spaceState.marbles;
      for (const k of Object.keys(m)) if (m[+k] === self.id) delete m[+k];
      m[info.from] = self.id;
      activate(ctx, self, `drops marbles on space ${info.from}.`);
    },
  },

  mum: {
    onHeatStart(ctx, self) {
      pickDarling(ctx, self);
    },
    onTurnStart(ctx, self, active) {
      if (active.id !== self.id) return;
      const d = self.counters.darling;
      if (d === undefined || ctx.ent(d).status !== 'racing') pickDarling(ctx, self);
    },
    onDiceFinal(ctx, self, roller, dice) {
      if (roller.id !== self.counters.darling || !dice.some((d) => d >= 4)) return;
      activate(ctx, self, 'is so proud of her darling.');
      ctx.bonusMove(self, 1, by(self));
    },
  },

  rubber: {
    preRoll(ctx, self) {
      const others = ctx.others(self);
      if (!others.length) return;
      const lead = Math.max(...others.map((o) => o.space));
      if (lead - self.space < 9) return;
      const a = ctx.choose(self, 'ability', `Snap forward to space ${lead - 4} instead of rolling?`, ['Roll normally', 'Snap!']);
      if (a === 0) return;
      activate(ctx, self, 'snaps forward!');
      ctx.teleport(self, lead - 4, by(self));
      return true;
    },
  },

  fortune: {
    preRoll(ctx, self) {
      if (self.dazed) return;
      const a = ctx.choose(self, 'ability', 'Predict your roll.', ['Odd', 'Even']);
      ctx.h.turn.flags.predict = a + 1;
      activate(ctx, self, `predicts ${a === 0 ? 'odd' : 'even'}.`);
    },
    onCompute(ctx, self, rollValue) {
      const p = ctx.h.turn.flags.predict;
      if (!p) return;
      const correct = (rollValue % 2 === 1) === (p === 1);
      ctx.h.turn.mod += correct ? 2 : -1;
      activate(ctx, self, correct ? 'was right: +2.' : 'was wrong: −1.');
    },
  },

  tortoise: {
    immune: true,
    dieFace: (f) => (f <= 2 ? 3 : f),
  },

  chicken: {
    afterMainMove(ctx, self, info) {
      if (info.mover !== self.id) return;
      if (info.dice.includes(6)) {
        activate(ctx, self, 'rolled a 6: everyone else back 1!');
        for (const o of ctx.others(self)) ctx.bonusMove(o, -1, by(self));
      }
      if (info.dice.includes(1) && self.status === 'racing') {
        activate(ctx, self, 'rolled a 1: everyone else forward 1!');
        for (const o of ctx.others(self)) ctx.bonusMove(o, 1, by(self));
      }
    },
  },

  hitch: {
    afterMainMove(ctx, self, info) {
      if (info.mover === self.id || info.finished || self.usedHeat || !info.passed.includes(self.id)) return;
      if (info.to >= FINISH) return;
      const a = ctx.choose(self, 'ability', `Hitch a ride to space ${info.to}? (once per heat)`, ['Stay put', 'Hitch a ride']);
      if (a === 0) return;
      self.usedHeat = true;
      activate(ctx, self, 'hitches a ride!');
      ctx.teleport(self, info.to, by(self));
    },
  },

  referee: {
    onAbilityForward(ctx, self, byId) {
      if (byId === self.id || ctx.h.turn.usedTurn[self.id]) return;
      ctx.h.turn.usedTurn[self.id] = true;
      activate(ctx, self, 'blows the whistle and steps forward.');
      ctx.bonusMove(self, 1, by(self));
    },
  },

  dervish: {
    dice: 'high',
    afterMainMove(ctx, self, info) {
      if (info.mover !== self.id || !ctx.h.turn.flags.dizzy) return;
      activate(ctx, self, 'rolled doubles and is too dizzy.');
      ctx.daze(self, by(self));
    },
  },

  photo: {
    onTurnStart(ctx, self, active) {
      if (active.id === self.id) ctx.h.turn.flags.near = FINISH - self.space <= 8 ? 1 : 2;
    },
    onCompute(ctx, self) {
      const near = ctx.h.turn.flags.near;
      if (near === 1) {
        ctx.h.turn.mod += 3;
        activate(ctx, self, 'sees the cameras: +3.');
      } else if (near === 2) {
        ctx.h.turn.mod -= 1;
        ctx.h.turn.floor = Math.max(ctx.h.turn.floor, 1);
      }
    },
  },

  cannon: {
    preRoll(ctx, self) {
      if (self.usedHeat || self.dazed) return;
      const a = ctx.choose(self, 'ability', 'Fire the cannon? Fly forward 9 instead of rolling, then be dazed. (once per heat)', ['Roll normally', 'Fire!']);
      if (a === 0) return;
      self.usedHeat = true;
      activate(ctx, self, 'fires himself out of the cannon!');
      ctx.bonusMove(self, 9, by(self));
      ctx.daze(self, by(self));
      return true;
    },
  },

  penny: {
    preRoll(ctx, self) {
      const coins = self.counters.coins ?? 0;
      if (!coins || self.dazed) return;
      const a = ctx.choose(self, 'ability', `Smash the piggy bank? ${coins} coin${coins > 1 ? 's' : ''} saved.`, ['Keep saving', `Smash it! (+${coins * 3})`]);
      if (a === 0) return;
      ctx.h.turn.mod += coins * 3;
      self.counters.coins = 0;
      activate(ctx, self, `smashes the piggy bank: +${coins * 3}!`);
    },
    onDiceFinal(ctx, self, roller, dice) {
      if (roller.id !== self.id || !dice.some((d) => d <= 2)) return;
      const coins = self.counters.coins ?? 0;
      if (coins >= 3) return;
      self.counters.coins = coins + 1;
      activate(ctx, self, `saves a coin (${coins + 1} of 3).`);
    },
  },

  goat: {
    onStop(ctx, self, mover, space) {
      if (mover.id !== self.id || ctx.h.turn.usedTurn[self.id]) return;
      const targets = ctx.others(self).filter((o) => o.space === space);
      if (!targets.length) return;
      ctx.h.turn.usedTurn[self.id] = true;
      activate(ctx, self, 'clears some room.');
      for (const t of targets) ctx.bonusMove(t, -2, by(self));
    },
  },

  hurdler: {
    afterMainMove(ctx, self, info) {
      if (info.mover !== self.id || !info.passed.length) return;
      activate(ctx, self, `cleared ${info.passed.length} hurdle${info.passed.length > 1 ? 's' : ''}.`);
      ctx.bonusMove(self, info.passed.length, by(self));
    },
  },

  slug: {
    setValue: () => 3,
    onLeftHeat(ctx, self, leaver) {
      if (leaver.id === self.id || leaver.status !== 'finished') return;
      activate(ctx, self, 'is furious and speeds up.');
      ctx.bonusMove(self, 5, by(self));
    },
  },

  parrot: {
    onDiceFinal(ctx, self, roller, dice) {
      if (roller.id === self.id) {
        self.counters.last = dice[0];
        return;
      }
      if (self.counters.last === undefined || !dice.includes(self.counters.last)) return;
      activate(ctx, self, `heard a ${self.counters.last} before!`);
      ctx.bonusMove(self, 2, by(self));
    },
  },

  bear: {
    onStop(ctx, self, mover, space) {
      if (mover.id === self.id || self.space !== space || ctx.h.turn.usedTurn[self.id]) return;
      ctx.h.turn.usedTurn[self.id] = true;
      activate(ctx, self, `gets honey all over ${ctx.label(mover)}.`);
      ctx.daze(mover, by(self));
    },
  },

  daredevil: {
    preRoll(ctx, self) {
      if (self.dazed) return;
      const a = ctx.choose(self, 'ability', 'Double or nothing? 4 or more moves double, 3 or less moves nothing.', ['Play it safe', 'Double or nothing!']);
      if (a === 0) return;
      ctx.h.turn.flags.dare = 1;
      activate(ctx, self, 'calls double or nothing!');
    },
    setValue: (v, ctx) => (ctx.h.turn.flags.dare ? (v >= 4 ? v * 2 : 0) : v),
  },

  understudy: {
    onLeftHeat(ctx, self, leaver) {
      if (leaver.id === self.id || self.abilityId !== 'understudy' || leaver.abilityId === 'understudy') return;
      self.abilityId = leaver.abilityId;
      self.counters = {};
      self.usedHeat = false;
      activate(ctx, self, `takes over ${ctx.label(leaver)}'s role!`);
    },
  },
};
