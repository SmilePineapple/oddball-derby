export type RacerId = string;
export type CardId = string;
export type Mode = 'standard' | 'duel' | 'trioDoubles';

/** Optional house rules, chosen at setup. All off is the classic game. */
export interface Rules {
  /** dice: roll every turn. cards: play move cards 1–6. choice: roll, or play a card (each card once per heat). */
  move: 'dice' | 'cards' | 'choice';
  /** Stopping on a rival's space starts a head-to-head duel; the loser moves back 1. */
  duels: boolean;
  /** Each player has 3 boost tokens per Grand Prix, worth +2 on a main move. */
  boosts: boolean;
  /** Before each heat every player secretly places one boost or mud tile. */
  traps: boolean;
  /** Once per heat each racer may try a timing meter for +0 to +3. */
  sprint: boolean;
  /** Players secretly bid stars to start the heat. */
  bidding: boolean;
  /** Some tracks have a risky shortcut. */
  forks: boolean;
}

export interface Player {
  id: number;
  name: string;
  colour: string;
  /** Controlled by the computer. */
  bot: boolean;
  stars: number;
  wins: number;
  seconds: number;
  /** Boost tokens left this Grand Prix. */
  boosts: number;
  team: RacerId[];
  used: RacerId[];
}

export interface Entrant {
  id: number;
  racerId: RacerId;
  /** The ability currently in effect (differs from racerId once Understudy inherits). */
  abilityId: string;
  ownerId: number;
  /** Usually a whole number. Shortcut spaces sit between two whole numbers. */
  space: number;
  dazed: boolean;
  status: 'racing' | 'finished' | 'out';
  counters: Record<string, number>;
  usedHeat: boolean;
  /** Move cards in hand. */
  hand: number[];
  sprintUsed: boolean;
}

export interface TurnState {
  /** Sum of +/- modifiers for this turn's main move. */
  mod: number;
  /** Minimum main-move distance this turn. */
  floor: number;
  flags: Record<string, number>;
  /** Once-per-turn abilities already used, keyed by entrant id. */
  usedTurn: Record<number, boolean>;
  /** Entrants already affected by a track space this turn. */
  spaceHit: Record<number, boolean>;
  effects: number;
}

export interface HeatCore {
  trackId: string;
  heatNumber: number;
  rules: Rules;
  entrants: Entrant[];
  /** Entrant ids in turn order. */
  order: number[];
  /** Index into `order` of the active entrant. */
  active: number;
  turnCount: number;
  placings: number[];
  activeCards: CardId[];
  deck: CardId[];
  spaceState: {
    eventUsed: Record<number, boolean>;
    starTaken: Record<number, boolean>;
    /** space -> entrant id who left the marbles */
    marbles: Record<number, number>;
  };
  /** Tiles placed by players before the heat. */
  extra: Record<number, 'boost' | 'mud'>;
  /** Boost tokens left, by player id. */
  boosts: Record<number, number>;
  starsEarned: Record<number, number>;
  names: Record<number, string>;
  rng: number;
  /** Dice to use before the RNG (tests only). */
  forcedDice: number[];
  silenceLeft: number;
  turn: TurnState;
  over: boolean;
}

export interface MoveOptions {
  canRoll: boolean;
  /** Move cards that may be played. */
  cards: number[];
  /** Boost tokens the player could spend. */
  boosts: number;
  /** The timing sprint is still available. */
  sprint: boolean;
}

export interface Choice {
  entrantId: number;
  playerId: number;
  /**
   * roll/dazed/ability/fork: answer with an option index.
   * duel: answer 0 if entrant `duel.a` won, 1 if `duel.b` won.
   * move: answer with card (0 = roll) + 100 if boosting + 1000 × (sprint bonus + 1) if sprinting.
   */
  kind: 'roll' | 'dazed' | 'ability' | 'move' | 'duel' | 'fork';
  prompt: string;
  options: string[];
  move?: MoveOptions;
  duel?: { a: number; b: number };
  /** Where each route would end this move. */
  fork?: { long: number; short: number };
}

/**
 * A heat is advanced by replaying the current turn from `base` with the
 * answers given so far. `core` is the state to display.
 */
export interface HeatState {
  core: HeatCore;
  base: HeatCore;
  answers: number[];
  emitted: number;
  choice: Choice | null;
}

export interface GameEvent {
  t: string;
  text: string;
  [key: string]: unknown;
}

export interface HeatSummary {
  heatNumber: number;
  trackId: string;
  placings: { racerId: RacerId; ownerId: number }[];
  starsEarned: Record<number, number>;
  performance: Record<number, number>;
}

export interface GameState {
  version: 3;
  mode: Mode;
  rules: Rules;
  players: Player[];
  phase: 'draft' | 'lineup' | 'bids' | 'traps' | 'heat' | 'heatResults' | 'final';
  draft: { pool: RacerId[]; order: number[]; pick: number } | null;
  lineup: { picks: Record<number, RacerId[]>; order: number[]; turn: number } | null;
  bids: { order: number[]; turn: number; amounts: Record<number, number> } | null;
  traps: { order: number[]; turn: number; picks: Record<number, { space: number; kind: 'boost' | 'mud' }> } | null;
  heatNumber: number;
  /** The track for each heat, chosen at game start. */
  tracks: string[];
  heat: HeatState | null;
  startPlayer: number;
  deck: CardId[];
  rng: number;
  history: HeatSummary[];
  log: string[];
}

export type Action =
  | { type: 'draftPick'; racerId: RacerId }
  | { type: 'lineupPick'; racerIds: RacerId[] }
  | { type: 'bid'; amount: number }
  | { type: 'placeTrap'; space: number; kind: 'boost' | 'mud' }
  | { type: 'answer'; option: number }
  | { type: 'nextHeat' };
