export type RacerId = string;
export type CardId = string;
export type Mode = 'standard' | 'duel' | 'trioDoubles';

export interface Player {
  id: number;
  name: string;
  colour: string;
  /** Controlled by the computer. */
  bot: boolean;
  stars: number;
  wins: number;
  seconds: number;
  team: RacerId[];
  used: RacerId[];
}

export interface Entrant {
  id: number;
  racerId: RacerId;
  /** The ability currently in effect (differs from racerId once Understudy inherits). */
  abilityId: string;
  ownerId: number;
  space: number;
  dazed: boolean;
  status: 'racing' | 'finished' | 'out';
  counters: Record<string, number>;
  usedHeat: boolean;
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
  starsEarned: Record<number, number>;
  names: Record<number, string>;
  rng: number;
  /** Dice to use before the RNG (tests only). */
  forcedDice: number[];
  silenceLeft: number;
  turn: TurnState;
  over: boolean;
}

export interface Choice {
  entrantId: number;
  playerId: number;
  kind: 'roll' | 'dazed' | 'ability';
  prompt: string;
  options: string[];
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
  version: 2;
  mode: Mode;
  players: Player[];
  phase: 'draft' | 'lineup' | 'heat' | 'heatResults' | 'final';
  draft: { pool: RacerId[]; order: number[]; pick: number } | null;
  lineup: { picks: Record<number, RacerId[]>; order: number[]; turn: number } | null;
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
  | { type: 'answer'; option: number }
  | { type: 'nextHeat' };
