# Rulings and open questions

The spec left these cases undecided. The engine currently behaves as described; each is easy to change. Tell me if you want any ruled differently.

## Rulings the engine makes today

1. **Double Dice vs dice abilities.** While Double Dice is active, Jetpack Granny is not offered her jetpack and Dizzy Dervish rolls like everyone else (two dice, lower one, no daze on doubles).
2. **Sleepy Giant and modifiers.** His "moves 0" is set before modifiers, so Tailwind (+1) still moves a sleeping Giant 1.
3. **Mirror Day and bonuses.** Direction is decided from the roll, then +/− modifiers add to the distance. A +3 bonus on an odd roll therefore sends the racer further *backward*.
4. **Daze and replaced main moves.** If a dazed Bubble Wizard or Rubber Band uses their ability instead of a main move, the daze is still used up that turn.
5. **Hitchhiker and the finish.** He cannot hitch a ride with a racer whose move crosses the finish line.
6. **Lucky Duck and Stage Mum timing.** They move as soon as the dice are final, before the roller's main move. Lucky Duck moves once per die showing 1.
7. **Rerolls.** Lucky Duck, Stage Mum, Fortune Teller, Granny's crash and Dervish's daze all look at the dice after any reroll.
8. **Marbles vs Tug Tortoise.** The pile is used up but he is not dazed. Marbles stay on the track if Marble Merchant leaves the heat or abilities are silenced.
9. **Shadow.** "Started ahead" compares positions at the moment the main move began. A backward main move (Mirror Day) never triggers her.
10. **Trampoline Frog.** She only bounces if her main move actually moved her. A 0-distance move on a shared space stays put.
11. **Understudy.** Inherits a fresh copy: once-per-heat abilities can be used again and counters start at zero. Second place being auto-awarded under Sudden Sprint does not count as a racer leaving.
12. **Stampede order.** First place moves first (the draft spec said last place first, which contradicted the finishing-order rule).
13. **Event space with an empty deck** does nothing.
14. **Pool size** is capped at the roster: with 6 players or in Trio Doubles the pool was all 24 racers. (Now 32 racers, so those games draw 26.)
15. **Silence!** lasts for as many turns as there were racers when it was revealed, counted after the revealing turn.

## Still open

- **Professor Redo prompts on every roll.** Correct by the rules, but it may slow play. The UI could add a per-player "auto-keep unless asked" toggle.
- **Roster size.** 32 racers. More can be added one data entry and one handler at a time.
- **Balance.** Abilities have not been tuned. The soak test proves games finish, not that racers are evenly matched.

## House rules: rulings and known imbalances

16. **Cards and dice abilities.** Dizzy Dervish, an ignited Jetpack Granny, and everyone under Double Dice always roll; they cannot play cards that turn.
17. **Professor Redo vs cards.** He may "reroll" a played card, which replaces it with a real die roll.
18. **Duels** only start from a main move, only against another player's racer, and only one per turn. The duel moves the loser by rule, so Tug Tortoise can be pushed back by losing one.
19. **Shortcut and backward movement.** Stepping back off a shortcut space returns toward its entrance.
20. **Move cards make some racers much stronger.** Choosing the number removes the gamble from Sleepy Giant (4, 5 and 6 always double), Dare Devil Dee (double or nothing never fails on a 4+) and Fortune Teller (she always predicts correctly). Not rebalanced yet.
