import type { Choice, Entrant, GameEvent, HeatCore, MoveOptions } from './types';
import { RACERS } from './racers';
import { ABILITIES, type Ability } from './abilities';
import { CARDS } from './cards';
import { FINISH, TRACKS, nextSpace, prevSpace, type SpaceDef, type TrackDef } from './tracks';

/** Thrown when the engine needs a player's answer before it can continue. */
export class Pause {
  constructor(public choice: Choice) {}
}
/** Thrown when the heat ends mid-resolution. */
export class HeatOver {}
/** Thrown by the loop guard. */
export class ChainHalt {}

export const MAX_EFFECTS_PER_TURN = 50;

export type Src = { kind: 'ability'; by: number } | { kind: 'space' } | { kind: 'card' };

export interface MainMoveInfo {
  mover: number;
  from: number;
  to: number;
  dist: number;
  dir: 1 | -1;
  dice: number[];
  passed: number[];
  startSpaces: Record<number, number>;
  finished: boolean;
}

type HookName = {
  [K in keyof Ability]-?: NonNullable<Ability[K]> extends (...a: any[]) => any ? K : never;
}[keyof Ability];

/** How a space is named in the log. */
export const spaceName = (s: number) => (Number.isInteger(s) ? `space ${s}` : 'the shortcut');

/**
 * All heat state changes go through this class. Triggers resolve depth-first
 * in priority order: active racer, other racers in turn order, track space.
 */
export class Ctx {
  events: GameEvent[] = [];
  private answerIndex = 0;

  constructor(public h: HeatCore, private answers: number[]) {}

  // ---------- lookups ----------
  get track(): TrackDef {
    return TRACKS[this.h.trackId];
  }
  ent(id: number): Entrant {
    return this.h.entrants[id];
  }
  active(): Entrant {
    return this.ent(this.h.order[this.h.active]);
  }
  racing(): Entrant[] {
    return this.h.entrants.filter((e) => e.status === 'racing');
  }
  /** All entrants in priority order, starting with the active one. */
  order(): Entrant[] {
    const { order, active } = this.h;
    return order.map((_, i) => this.ent(order[(active + i) % order.length]));
  }
  others(self: Entrant): Entrant[] {
    return this.order().filter((e) => e.id !== self.id && e.status === 'racing');
  }
  label(e: Entrant): string {
    return RACERS[e.racerId]?.name ?? e.racerId;
  }
  card(id: string): boolean {
    return this.h.activeCards.includes(id);
  }
  ability(e: Entrant): Ability | null {
    if (e.status !== 'racing' || this.card('silence')) return null;
    return ABILITIES[e.abilityId] ?? null;
  }
  aloneLast(e: Entrant): boolean {
    const o = this.others(e);
    return o.length > 0 && o.every((x) => x.space > e.space);
  }
  immune(target: Entrant, src: Src): boolean {
    return src.kind === 'ability' && src.by !== target.id && !!this.ability(target)?.immune;
  }
  /** What is on a space: a player's tile, a shortcut hazard, or the track's own space. */
  spaceDef(space: number): SpaceDef | undefined {
    const placed = this.h.extra[space];
    if (placed) return { type: placed };
    if (!Number.isInteger(space)) return this.track.forkSpaces[space];
    return this.track.spaces[space];
  }

  // ---------- plumbing ----------
  emit(t: string, text: string, data: Record<string, unknown> = {}): void {
    this.events.push({ t, text, ...data });
  }

  /** Ask a player something. Replays a stored answer or pauses the engine. */
  choose(e: Entrant, kind: Choice['kind'], prompt: string, options: string[], extra: Partial<Choice> = {}): number {
    if (this.answerIndex < this.answers.length) {
      const a = this.answers[this.answerIndex++];
      if (!Number.isInteger(a) || a < 0 || a >= options.length) throw new Error(`Invalid option ${a} for "${prompt}"`);
      return a;
    }
    throw new Pause({ entrantId: e.id, playerId: e.ownerId, kind, prompt, options, ...extra });
  }

  /** Ask how the active racer makes its main move: roll or card, with optional boost and sprint. */
  chooseMove(e: Entrant, mv: MoveOptions): { card: number; boost: boolean; sprint: number } {
    if (this.answerIndex < this.answers.length) {
      const n = this.answers[this.answerIndex++];
      const card = n % 100;
      const boost = Math.floor(n / 100) % 10;
      const sprint = Math.floor(n / 1000);
      const ok =
        Number.isInteger(n) && n >= 0 &&
        (card === 0 ? mv.canRoll : mv.cards.includes(card)) &&
        (boost === 0 || (boost === 1 && mv.boosts > 0)) &&
        (sprint === 0 || (mv.sprint && sprint <= 4));
      if (!ok) throw new Error(`Invalid move ${n}`);
      return { card, boost: boost === 1, sprint };
    }
    throw new Pause({ entrantId: e.id, playerId: e.ownerId, kind: 'move', prompt: `${this.label(e)}: your move!`, options: ['Roll'], move: mv });
  }

  hook<K extends HookName>(name: K, ...args: unknown[]): void {
    for (const e of this.order()) {
      const fn = this.ability(e)?.[name] as ((...a: unknown[]) => unknown) | undefined;
      if (fn) fn(this, e, ...args);
    }
  }

  countEffect(): void {
    if (++this.h.turn.effects > MAX_EFFECTS_PER_TURN) throw new ChainHalt();
  }

  // ---------- movement ----------
  /** Where `steps` forward from `from` would end. */
  ahead(from: number, steps: number, short: boolean): number {
    let s = from;
    for (let i = 0; i < steps && s < FINISH; i++) s = nextSpace(this.track, s, short);
    return s;
  }

  /**
   * Step along the track. Returns the spaces visited, in order.
   * With `mayFork`, the owner is asked which way to go at a shortcut.
   */
  walk(e: Entrant, steps: number, dir: 1 | -1, mayFork = false): number[] {
    const path: number[] = [];
    const fork = this.h.rules.forks ? this.track.fork : undefined;
    let short = false;
    for (let i = 0; i < steps; i++) {
      if (dir > 0) {
        if (e.space >= FINISH) break;
        if (mayFork && fork && e.space === fork.from) {
          const left = steps - i;
          const long = this.ahead(e.space, left, false);
          const cut = this.ahead(e.space, left, true);
          const a = this.choose(e, 'fork', `${this.label(e)} reaches the shortcut with ${left} to go. Which way?`, [
            `Long way (to ${spaceName(long)})`,
            `Shortcut (to ${spaceName(cut)})`,
          ], { fork: { long, short: cut } });
          short = a === 1;
          if (short) this.emit('fork', `${this.label(e)} takes the shortcut!`, { id: e.id });
        }
        e.space = nextSpace(this.track, e.space, short);
      } else {
        if (e.space <= 0) break;
        e.space = prevSpace(this.track, e.space);
      }
      path.push(e.space);
    }
    return path;
  }

  bonusMove(target: Entrant, delta: number, src: Src): number {
    if (target.status !== 'racing' || delta === 0) return 0;
    if (this.immune(target, src)) {
      this.emit('blocked', `${this.label(target)} won't budge.`, { id: target.id });
      return 0;
    }
    this.countEffect();
    const from = target.space;
    const dir = delta > 0 ? 1 : -1;
    const path = this.walk(target, Math.abs(delta), dir);
    if (!path.length) return 0;
    this.emit('bonusMove', `${this.label(target)} moves ${dir > 0 ? 'forward' : 'back'} ${path.length}.`, {
      id: target.id, from, to: target.space, path,
    });
    if (dir < 0) this.ability(target)?.onSelfBack?.(this, target);
    this.arrive(target);
    if (src.kind === 'ability' && dir > 0) this.hook('onAbilityForward', src.by, target);
    return path.length * dir;
  }

  teleport(target: Entrant, to: number, src: Src): boolean {
    if (target.status !== 'racing') return false;
    if (this.immune(target, src)) {
      this.emit('blocked', `${this.label(target)} won't budge.`, { id: target.id });
      return false;
    }
    this.countEffect();
    const from = target.space;
    let dest = Math.min(FINISH, Math.max(0, to));
    const onShortcut = this.h.rules.forks && !!this.track.fork?.nodes.includes(dest);
    if (!Number.isInteger(dest) && !onShortcut) dest = Math.floor(dest);
    target.space = dest;
    this.emit('teleport', `${this.label(target)} teleports to ${spaceName(dest)}.`, { id: target.id, from, to: dest });
    this.arrive(target);
    return true;
  }

  swap(a: Entrant, b: Entrant): void {
    this.countEffect();
    const sa = a.space;
    const sb = b.space;
    a.space = sb;
    b.space = sa;
    this.emit('swap', `${this.label(a)} and ${this.label(b)} swap places!`, { a: a.id, b: b.id, aTo: sb, bTo: sa });
    this.stopped(a);
    if (b.status === 'racing' && b.space === sa) this.stopped(b);
  }

  arrive(e: Entrant): void {
    if (e.space >= FINISH) this.finish(e);
    else this.stopped(e);
  }

  /** Resolve everything that triggers when `e` stops on its current space. */
  stopped(e: Entrant): void {
    const space = e.space;
    const still = () => e.status === 'racing' && e.space === space;
    for (const self of this.order()) {
      if (!still()) return;
      this.ability(self)?.onStop?.(this, self, e, space);
    }
    if (!still()) return;

    const marbleOwner = this.h.spaceState.marbles[space];
    if (marbleOwner !== undefined && marbleOwner !== e.id) {
      delete this.h.spaceState.marbles[space];
      this.emit('marbles', `${this.label(e)} hits the marbles!`, { id: e.id, space });
      this.daze(e, { kind: 'ability', by: marbleOwner });
    }
    if (!still()) return;
    this.spaceEffect(e, space);
  }

  private spaceEffect(e: Entrant, space: number): void {
    const def = this.spaceDef(space);
    const st = this.h.spaceState;
    if (!def || this.h.turn.spaceHit[e.id]) return;
    if (def.type === 'event' && (st.eventUsed[space] || this.h.deck.length === 0)) return;
    if (def.type === 'star' && st.starTaken[space]) return;
    this.h.turn.spaceHit[e.id] = true;
    this.countEffect();
    const SPACE: Src = { kind: 'space' };
    switch (def.type) {
      case 'boost':
        this.emit('space', `${this.label(e)} hits a boost pad!`, { id: e.id, space, kind: 'boost' });
        this.bonusMove(e, 2, SPACE);
        break;
      case 'mud':
        this.emit('space', `${this.label(e)} lands in the mud.`, { id: e.id, space, kind: 'mud' });
        this.bonusMove(e, -2, SPACE);
        break;
      case 'spring':
        this.emit('space', `${this.label(e)} bounces off a spring!`, { id: e.id, space, kind: 'spring' });
        this.teleport(e, def.to, SPACE);
        break;
      case 'web':
        this.emit('space', `${this.label(e)} is stuck in a cobweb!`, { id: e.id, space, kind: 'web' });
        this.daze(e, SPACE);
        break;
      case 'star':
        st.starTaken[space] = true;
        this.h.starsEarned[e.ownerId] = (this.h.starsEarned[e.ownerId] ?? 0) + 1;
        this.emit('star', `${this.label(e)} grabs a bonus star!`, { id: e.id, space, ownerId: e.ownerId });
        break;
      case 'event': {
        st.eventUsed[space] = true;
        const id = this.h.deck.shift()!;
        const card = CARDS[id];
        this.emit('card', `Event card: ${card.name}! ${card.text}`, { id: e.id, cardId: id, space });
        if (card.lasting) this.h.activeCards.push(id);
        card.onReveal?.(this, e);
        break;
      }
    }
  }

  // ---------- status ----------
  daze(target: Entrant, src: Src): boolean {
    if (target.status !== 'racing' || target.dazed) return false;
    if (this.immune(target, src) || this.card('wideawake')) {
      this.emit('blocked', `${this.label(target)} shrugs it off.`, { id: target.id });
      return false;
    }
    target.dazed = true;
    this.emit('dazed', `${this.label(target)} is dazed and will miss their next main move.`, { id: target.id });
    this.ability(target)?.onSelfDazed?.(this, target);
    return true;
  }

  knockOut(e: Entrant): void {
    if (e.status !== 'racing') return;
    e.status = 'out';
    this.emit('knockedOut', `${this.label(e)} is knocked out of the heat!`, { id: e.id });
    this.hook('onLeftHeat', e);
    this.checkEnd();
  }

  private place(e: Entrant): void {
    e.status = 'finished';
    e.space = FINISH;
    this.h.placings.push(e.id);
    const place = this.h.placings.length;
    const stars = place === 1 ? 4 : place === 2 ? 2 : 0;
    this.h.starsEarned[e.ownerId] = (this.h.starsEarned[e.ownerId] ?? 0) + stars;
    this.emit('finished', `${this.label(e)} finishes ${place === 1 ? 'first' : 'second'}! (+${stars} stars)`, {
      id: e.id, place, ownerId: e.ownerId, stars,
    });
  }

  finish(e: Entrant): void {
    if (e.status !== 'racing') return;
    this.place(e);
    this.hook('onLeftHeat', e);
    this.checkEnd();
  }

  /** End the heat if its end condition is met. */
  checkEnd(): void {
    const h = this.h;
    const end = (): never => {
      h.over = true;
      throw new HeatOver();
    };
    if (h.placings.length >= 2) end();
    if (this.card('sprint') && h.placings.length === 1) {
      const next = this.order().filter((e) => e.status === 'racing').sort((a, b) => b.space - a.space)[0];
      if (next) this.place(next);
      end();
    }
    const racing = this.racing();
    if (racing.length === 1) {
      this.place(racing[0]);
      end();
    }
    if (racing.length === 0) end();
  }
}
