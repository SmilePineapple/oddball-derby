# Oddball Derby — Stage 1 Specification

An original pass-and-play dice-racing game for 2–6 players on one device.
Working title and all content (racers, events, tracks) are original and can be renamed or re-themed.

Status: rules engine implemented and tested (Stage 3). Rulings on undecided cases are in `docs/OPEN_QUESTIONS.md`.

---

## 1. Core rules

### 1.1 Goal
Play a Grand Prix of **4 heats**. The first two racers to finish each heat win stars. Most stars after heat 4 wins.

### 1.2 Terminology
These terms are used precisely by every ability and by the engine.

| Term | Meaning |
|---|---|
| **Main move** | The dice-driven move a racer makes on its own turn. One per turn at most. |
| **Bonus move** | Any other movement along the track, forward or backward, caused by an ability, space or event. Moves space by space. |
| **Teleport** | The racer is lifted and placed on another space. It is *not* a move: it does not pass anything and does not trigger "when moves" or "when passes" effects. It *does* count as stopping on the destination space. |
| **Pass** | During a main or bonus move, moving through a space containing another racer and ending beyond it. Starting on the same space and leaving does not count. |
| **Stop** | Ending a main move, bonus move or teleport on a space. |
| **Share** | Two or more racers on the same space. Any number may share. |
| **Ahead / behind** | Strictly greater / smaller space number. Racers sharing a space are neither. |
| **First / last place** | The racer(s) on the highest / lowest space among racers still in the heat. Ties are possible; "alone in last" means no tie. |
| **Dazed** | The racer skips its next main move, then recovers. It still takes its turn: abilities, bonus moves and teleports work normally. Daze does not stack. |
| **Knocked out** | Removed from the heat. Scores nothing. Its abilities stop. |
| **Finished** | Reached or passed the finish space. Removed from the track; abilities stop. |
| **In the heat** | Not finished and not knocked out. |

### 1.3 Turn structure
1. **Turn start.** "Start of turn" abilities trigger.
2. **Pre-roll.** "Before main move" abilities trigger (e.g. declare a boost, make a prediction, replace the main move).
3. **Roll.** If dazed: remove daze, skip to step 7. Otherwise roll one d6 (unless an ability changes this).
4. **Roll reactions.** "When a die is rolled" abilities trigger. A reroll returns to step 4 with the new result; each reroll source may act once per turn.
5. **Compute.** Apply modifiers to get the main-move distance. Minimum 0. Modifiers sum; "set to" effects apply before "+/−" effects.
6. **Main move.** Move space by space. Passing is recorded. On arrival: stop triggers, then "after main move" triggers.
7. **Turn end.** "End of turn" abilities trigger. Play passes clockwise.

### 1.4 Priority (simultaneous triggers)
When one event triggers several effects, resolve in this order:
1. Abilities of the **active racer**.
2. Abilities of other racers in **turn order** from the active player.
3. **Track space** effects.
4. **Active event card** effects.

Each effect resolves fully, including anything it triggers (depth-first), before the next one in the list. Before resolving a queued effect, re-check that its condition is still true; if not, it fizzles.

### 1.5 Loop rule
- An ability triggers **at most once per triggering event**.
- A track space affects a given racer **at most once per turn**.
- If a chain exceeds 50 resolved effects in one turn, the chain stops, the log records "the dust settles", and the turn ends.

### 1.6 Finishing and heat end
- A racer finishes when any move or teleport takes it to or beyond the finish space. Overshoot is fine.
- 1st finisher: **4 stars**. 2nd finisher: **2 stars**. The heat ends immediately when the second racer finishes.
- If knock-outs leave only one racer in the heat, it finishes automatically in the next open place.
- If two racers finish from the same effect, the one further ahead before the effect places higher; if tied, the active racer, then turn order.

### 1.7 Grand Prix flow
- Each heat is on a different track where possible, drawn at game start from the tracks chosen at setup.
- Each racer on a team runs in exactly one heat.
- Heat 1 start player is random. Later heats are started by the player with the fewest stars (ties: the tied player who finished worse last heat).
- Final tie-break: most heat wins, then most second places, then shared victory.

---

## 2. Game modes

| Mode | Players | Team | Racers per heat |
|---|---|---|---|
| Standard | 3–6 | Draft 4 | 1 each |
| Duel | 2 | Draft 8 | 2 each (turns alternate A1, B1, A2, B2) |
| Trio Doubles | 3 | Draft 8 | 2 each |

In doubles modes a player's two racers are separate racers for all abilities ("another racer" includes your own partner).

### 2.1 Draft
- Deal a face-up pool of `players × team size + 2` racers at random (capped at the 24-racer roster).
- **Snake draft**: 1→N, N→1, repeating until teams are full.
- **Beginner deal**: skip the draft; deal teams at random.

### 2.2 Heat line-up
Each player secretly picks a racer for the heat, one at a time behind a handover screen ("Pass to Maya — tap when ready"). All picks are revealed together.

---

## 3. Racers (24)

Fields used in the data file: `id`, `name`, `blurb`, `rulesText`, `triggers[]`, `optional`, `limit` (`none` | `oncePerTurn` | `oncePerHeat`), `fx`.

| # | Racer | Trigger | Opt? | Limit | Rules text |
|---|---|---|---|---|---|
| 1 | **Jetpack Granny** | Before main move | Optional | — | May ignite: roll two dice and move the total. If the dice match, she moves 0 instead and is dazed. |
| 2 | **Sleepy Giant** | Compute | Mandatory | — | On a roll of 1–3 he moves 0. On 4–6 he moves double the roll. |
| 3 | **Magnet Mole** | After own main move | Mandatory | — | Each other racer 1 or 2 spaces ahead of him makes a bonus move back 1. |
| 4 | **Tailwind Kite** | Passed during another racer's main move | Mandatory | Once per turn | After that main move ends, she makes a bonus move forward 1. |
| 5 | **Toll Troll** | Another racer stops on his space | Mandatory | — | That racer makes a bonus move back 2. |
| 6 | **Lucky Duck** | Any main-move die shows 1 | Mandatory | — | Lucky Duck makes a bonus move forward 2. |
| 7 | **Professor Redo** | Any main-move die rolled | Optional | Once per turn | May force that die to be rerolled. The new result stands. |
| 8 | **Slingshot Sam** | Start of own turn | Mandatory | — | If alone in last place, his main move this turn gets +3. |
| 9 | **Shadow** | Another racer finishes a main move of 5+ | Mandatory | Once per turn | If that racer started the move ahead of Shadow, Shadow makes a bonus move forward 2. |
| 10 | **Bubble Wizard** | Before main move | Optional | Once per heat | Instead of a main move, swap spaces with any other racer. Both teleport. |
| 11 | **Snowball** | Compute | Mandatory | — | Has momentum, starting at 0. Adds momentum to his main move, then gains 1 momentum (max 3). Momentum resets to 0 when he is dazed or moves backward. |
| 12 | **Picnic Ant** | Stops on a shared space | Mandatory | Once per turn | Bonus move forward 1 for each other racer on that space. |
| 13 | **Trampoline Frog** | Own main move would stop on an occupied space | Mandatory | — | She keeps moving to the next empty space ahead. This is part of the main move. |
| 14 | **Marble Merchant** | After own main move | Mandatory | — | Leaves marbles on the space where the move started (one pile at a time; the old pile vanishes). The next other racer to stop there is dazed and the pile is removed. |
| 15 | **Stage Mum** | Heat start; darling's main-move die | Mandatory | — | At heat start she names another racer as her darling. Whenever the darling's main-move die shows 4+, Stage Mum makes a bonus move forward 1. If the darling leaves the heat she names a new one at her next turn start. |
| 16 | **Rubber Band** | Before main move | Optional | — | If the first-place racer is 9+ spaces ahead of him, he may teleport to the space 4 behind that racer instead of making a main move. |
| 17 | **Fortune Teller** | Before main move | Mandatory (choice) | — | Must predict odd or even. Correct: +2 to the main move. Wrong: −1. |
| 18 | **Tug Tortoise** | Continuous; compute | Mandatory | — | Cannot be moved, teleported or dazed by other racers' abilities. Track spaces and events still affect him. Main-move rolls of 1 or 2 count as 3. |
| 19 | **Chaos Chicken** | Own main-move die | Mandatory | — | On a 6, every other racer makes a bonus move back 1. On a 1, every other racer makes a bonus move forward 1. Resolves after her main move, in turn order. |
| 20 | **Hitchhiker** | Passed during another racer's main move | Optional | Once per heat | May teleport to the space where that racer's main move ends. |
| 21 | **Referee** | Another racer's ability moves any racer forward | Mandatory | Once per turn | Referee makes a bonus move forward 1. |
| 22 | **Dizzy Dervish** | Roll | Mandatory | — | Rolls two dice and uses the higher. If they match, she is dazed after her main move. |
| 23 | **Photo Finisher** | Compute | Mandatory | — | Within 8 spaces of the finish at turn start: +3. Otherwise −1 (minimum 1). |
| 24 | **Understudy** | A racer finishes or is knocked out | Mandatory | Once per heat | Has no ability until the first other racer leaves the heat, then permanently gains that racer's ability for this heat. |

The roster is data-driven, so adding more racers later is a matter of one data entry, one handler and its tests.

---

## 4. Event cards (12)

A shuffled deck. The first racer to stop on an **Event space** each heat reveals the top card with a full-screen reveal. Instant cards resolve and are discarded; lasting cards stay until the heat ends. Reshuffle between Grand Prix only.

| # | Card | Type | Effect |
|---|---|---|---|
| 1 | Tailwind | Lasting | Every main move gets +1. |
| 2 | Headwind | Lasting | Main-move rolls of 6 count as 4. |
| 3 | Stampede | Instant | Every racer makes a bonus move forward 2, first place first. |
| 4 | Mud Slide | Instant | The first-place racer(s) make a bonus move back 3. |
| 5 | Wide Awake | Lasting | Nobody can be dazed. Existing daze is removed. |
| 6 | Mirror Day | Lasting | Odd main-move rolls move backward; even rolls move double. |
| 7 | Group Hug | Instant | Every racer teleports to the space of the racer in median position (lower median if even). |
| 8 | Sudden Sprint | Lasting | The heat now ends when the *first* racer finishes; second place goes to whoever is furthest ahead (ties: turn order). |
| 9 | Trapdoor | Instant | The racer who revealed this is knocked out, unless only 2 racers remain, in which case it is dazed instead. |
| 10 | Double Dice | Lasting | Everyone rolls two dice for main moves and uses the lower. |
| 11 | Underdog Hour | Lasting | A racer alone in last place at its turn start gets +2 to its main move. |
| 12 | Silence! | Lasting | Racer abilities do not work for one full round, then this card is discarded. |

---

## 5. Tracks

There are six tracks; a Grand Prix runs its four heats on tracks drawn at random from the ones switched on at setup. All have spaces **0 (Start) to 30 (Finish)**. Racers begin on 0. Space effects apply only when a racer **stops** there, never when passing.

| Space type | Effect on stop |
|---|---|
| Boost | Bonus move forward 2. |
| Mud | Bonus move back 2. |
| Spring | Teleport to the linked space. |
| Event | First stop of the heat reveals an event card; afterwards a plain space. |
| Star | First racer to stop there each heat gains 1 star for its owner. |
| Cobweb | The racer is dazed. |

### 5.1 Corkscrew Canyon
A track that spirals inward: two full clockwise loops tightening to a central finish.

- Boost: 4, 17
- Mud: 9, 22, 27
- Spring: 12 → 15, 25 → 19
- Event: 7, 20
- Star: 14

### 5.2 Loop-de-Lagoon
An S-bend that winds around two lagoons. (A figure-eight was dropped because spaces overlapped at the crossing.)

- Boost: 6, 21
- Mud: 3, 13, 26
- Spring: 10 → 16, 28 → 23, 18 → 8
- Event: 11, 24
- Star: 5

### 5.3 Rollercoaster Ridge
Rolling hills from left to right.

- Boost: 5, 19 · Mud: 8, 23 · Spring: 11 → 14, 26 → 21 · Event: 6, 17 · Star: 15 · Cobweb: 3, 28

### 5.4 Big Top Dash
One lap of a circus ring.

- Boost: 3, 16, 24 · Mud: 10, 20 · Spring: 7 → 12, 27 → 22, 14 → 9 · Event: 5, 18 · Star: 21 · Cobweb: 29

### 5.5 Haunted Hairpins
Five vertical straights joined by hairpin bends.

- Boost: 9, 26 · Mud: 12 · Spring: 4 → 8, 19 → 13, 28 → 24 · Event: 10, 21 · Star: 17 · Cobweb: 6, 15, 23

### 5.6 Volcano Climb
Switchbacks up to the crater.

- Boost: 2, 13 · Mud: 7, 18, 25 · Spring: 10 → 16, 22 → 14, 29 → 20 · Event: 8, 19 · Star: 27 · Cobweb: 5

Layouts are stored as an ordered list of SVG coordinates per space, so racer positions and animation paths come straight from track data.

---

## 6. Game-state model

```ts
type GameState = {
  mode: 'standard' | 'duel' | 'trioDoubles';
  players: Player[];              // id, name, colour, stars, team: RacerId[], used: RacerId[]
  phase: 'setup' | 'draft' | 'lineup' | 'heat' | 'heatResults' | 'final';
  draft?: { pool: RacerId[]; order: PlayerId[]; pickIndex: number };
  heatNumber: 1 | 2 | 3 | 4;
  heat?: HeatState;
  eventDeck: EventId[];
  rngSeed: number;                // seeded RNG: every game is replayable and testable
  log: LogEntry[];
};

type HeatState = {
  trackId: 'corkscrew' | 'lagoon';
  entrants: Entrant[];            // racerId, ownerId, space, dazed, status, counters, usedOncePerHeat
  turnOrder: EntrantId[];
  activeIndex: number;
  turn: TurnState;                // step, dice, modifiers, usedOncePerTurn, passedThisMove, effectCount
  placings: EntrantId[];
  activeEvents: EventId[];
  spaceState: Record<number, { eventUsed?: boolean; starTaken?: boolean; marbles?: EntrantId }>;
  queue: PendingEffect[];
  pendingChoice?: Choice;         // engine is paused waiting for a player
};
```

State is plain serialisable JSON. Saving is writing it to `localStorage` after every resolved action.

---

## 7. Rules engine

Pure TypeScript, no UI imports.

```
engine/
  state.ts        types
  rng.ts          seeded dice
  events.ts       GameEvent union (TurnStarted, DieRolled, MoveComputed, RacerPassed,
                  RacerStopped, MainMoveEnded, RacerDazed, RacerFinished, RacerKnockedOut, ...)
  movement.ts     the only code that changes a racer's space (mainMove, bonusMove, teleport)
  queue.ts        trigger collection, priority sort, depth-first resolution, loop guard
  abilities.ts    one entry per racer: named hooks the engine calls in priority order
  cards/          one file per event card
  tracks/         track data and space handlers
  heat.ts         turn steps, finishing, scoring
  game.ts         draft, line-ups, Grand Prix flow
  index.ts        dispatch(state, action) -> { state, emitted: GameEvent[] }
```

How it works:
- The UI sends **actions** (`ROLL`, `ANSWER_CHOICE`, `PICK_RACER`…). `dispatch` returns the new state plus the ordered list of events that occurred.
- Every state change emits an event. After each event the queue asks every ability, space and card "do you trigger?", sorts the answers by the priority rule, and resolves them depth-first.
- An optional ability or a required choice sets `pendingChoice` and the engine returns. The next `ANSWER_CHOICE` action resumes the queue exactly where it stopped.
- The UI never decides outcomes. It plays back the emitted event list as animations and log lines; with animations off it simply jumps to the final state.

---

## 8. Tricky interactions to get right

1. **Toll Troll vs Picnic Ant** on the same space: Ant is active, so Ant's bonus resolves first; if Ant leaves the space, Troll's effect fizzles on re-check.
2. **Trampoline Frog onto a Spring/Boost**: the bounce is part of the main move, so only the final space's effect applies.
3. **Magnet Mole pulling a racer onto Mud**: the pulled racer stops there, so Mud triggers, limited to once per racer per turn.
4. **Professor Redo vs Fortune Teller / Jetpack Granny**: prediction is locked before the roll; a reroll replaces one die and outcomes are judged on the final dice.
5. **Chaos Chicken's 1** moves others forward, which triggers Referee (once per turn) and may finish a racer mid-chain.
6. **Tug Tortoise immunity** covers Bubble Wizard swaps, Magnet Mole, Toll Troll, marbles and Chaos Chicken, but not track spaces or event cards.
7. **Hitchhiker and Tailwind Kite** both passed by one move: resolve in turn order after the main move ends.
8. **Dazed racer's turn**: start-of-turn and end-of-turn abilities still work; pre-roll replacements (Bubble Wizard, Rubber Band) are allowed since they are not main moves.
9. **Understudy inheriting** a once-per-heat ability gets a fresh use; inheriting Snowball starts at 0 momentum.
10. **Silence!** suppresses abilities but not continuous state like marbles already placed.
11. **Mirror Day + Sleepy Giant / Snowball**: "set" effects first, then card direction, then +/− modifiers.
12. **Backward past Start**: movement stops at space 0.
13. **Two finishers from one effect** (Stampede): ordering per 1.6.
14. **Sudden Sprint revealed after one racer already finished**: the heat ends immediately.
15. **Group Hug** makes everyone stop on one space at once: stop triggers queue in priority order, each re-checked.

Open design questions are listed in `docs/OPEN_QUESTIONS.md` once testing surfaces them; none are resolved silently.

---

## 9. Test plan (Vitest, engine only)

- **Movement**: main/bonus/teleport semantics; pass detection; clamp at 0; overshoot finish.
- **Per racer**: at least one test for trigger, non-trigger, limit, and optional decline, for all 24.
- **Per event card**: effect, duration, and interaction with at least one ability.
- **Per space type**: stop vs pass; once-per-turn guard; first-stop-only Event and Star.
- **Priority**: scripted scenarios for every item in section 8.
- **Daze and knock-out**: skip main move only; abilities stop on knock-out; auto-finish last racer.
- **Rerolls and modifiers**: stacking order, minimum 0.
- **Loop guard**: constructed infinite chain halts at 50.
- **Scoring and flow**: placings, stars, start player, tie-breaks, all three modes.
- **Draft**: snake order for 2–6 players, pool size, beginner deal.
- **Save/resume**: serialise mid-choice, reload, continue to identical result.
- **Soak**: 2,000 seeded random full games per mode with random choice answers; assert no crash, no stuck state, every heat ends.

---

## 10. Build stages and checklist

- [x] Stage 1 — this specification
- [x] Stage 2 — visual prototype (menu, setup, draft, board, log, results)
- [x] Stage 3 — rules engine + passing test suite (95 tests, `npm test`)
- [x] Stage 4 — full game wired to the engine, all modes (`npm run dev`)
- [ ] Stage 5 — animation, sound, polish (first pass done: dice, movement, card reveals, synth sounds, animations on/off)
- [ ] Stage 6 — full playthroughs, fixes (rules/help section done; one Standard game and one Duel heat played through the UI)

Stack: React, TypeScript, Vite, Tailwind CSS, Framer Motion, SVG tracks, `localStorage`, Vitest. Fully offline after `npm install`.

---

## 11. Computer players

Any seat can be handed to the computer at setup, so the game can be played solo. The logic is in `src/engine/ai.ts` and is tested by playing whole games with only computer players.

- **Draft:** picks by a fixed strength rating per racer plus a little randomness.
- **Line-ups:** picks unused racers at random.
- **Ability choices:** simple rules of thumb (always ignite the jetpack, swap only with a racer 6+ spaces ahead, reroll its own 1s and 2s and opponents' 5s and 6s, and so on).
- **Fairness:** it only uses what a human can see. It never looks at dice that have not been rolled.
- With exactly one human, the "pass the device" screen is skipped.

---

## 12. Later additions

- **Roster:** 32 racers. The eight added after the first build are Captain Cannonball, Penny Pig, Billy Bash, Hurdling Hank, Steady Slug, Polly Repeat, Honey Bear and Dare Devil Dee. Their rules text is in `src/engine/racers.ts` and each has tests in `tests/racers.test.ts`. The draft pool is now capped at 32, so six-player and Trio Doubles games draw 26.
- **3D view:** the board is drawn as a tilted table with stand-up racers and scenery, and the camera leans toward the active racer. A button on the race screen switches back to the flat view.
- **Interaction:** hold the Roll button to shake the dice and let go to throw (Space or Enter also rolls); dashed rings show where each roll of 1–6 would land before abilities and bonuses; reaction buttons throw emoji across the board; hovering a space names it.
- **Ruling:** Steady Slug's fixed 3 is an odd roll, so under Mirror Day she always moves backward.
