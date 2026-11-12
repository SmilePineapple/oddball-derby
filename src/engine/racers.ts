export interface RacerDef {
  id: string;
  name: string;
  blurb: string;
  rulesText: string;
  trigger: string;
  optional: boolean;
  limit: 'none' | 'oncePerTurn' | 'oncePerHeat';
}

const r = (
  id: string,
  name: string,
  blurb: string,
  trigger: string,
  optional: boolean,
  limit: RacerDef['limit'],
  rulesText: string,
): RacerDef => ({ id, name, blurb, trigger, optional, limit, rulesText });

export const RACER_LIST: RacerDef[] = [
  r('granny', 'Jetpack Granny', 'Knits at Mach 2.', 'Before main move', true, 'none',
    'May ignite: roll two dice and move the total. If the dice match, she moves 0 instead and is dazed.'),
  r('giant', 'Sleepy Giant', 'Naps hard, strides harder.', 'Main move', false, 'none',
    'On a roll of 1–3 he moves 0. On 4–6 he moves double the roll.'),
  r('mole', 'Magnet Mole', 'Attractive in the worst way.', 'After own main move', false, 'none',
    'Each other racer 1 or 2 spaces ahead of him makes a bonus move back 1.'),
  r('kite', 'Tailwind Kite', 'Loves being overtaken.', 'Passed during a main move', false, 'oncePerTurn',
    'When another racer passes her during its main move, she makes a bonus move forward 1 after that move ends.'),
  r('troll', 'Toll Troll', 'Exact change only.', 'Another racer stops on his space', false, 'none',
    'When another racer stops on his space, that racer makes a bonus move back 2.'),
  r('duck', 'Lucky Duck', 'Other people’s bad luck is delicious.', 'Any main-move die shows 1', false, 'none',
    'Whenever a main-move die shows 1, Lucky Duck makes a bonus move forward 2.'),
  r('redo', 'Professor Redo', 'Believes in second drafts.', 'Any main-move die rolled', true, 'oncePerTurn',
    'Once per turn, may force one main-move die to be rerolled. The new result stands.'),
  r('sam', 'Slingshot Sam', 'Best when furthest behind.', 'Start of own turn', false, 'none',
    'If he is alone in last place at the start of his turn, his main move gets +3.'),
  r('shadow', 'Shadow', 'Always right behind you.', 'Another racer’s big main move', false, 'oncePerTurn',
    'When a racer who started ahead of Shadow makes a main move of 5 or more, Shadow makes a bonus move forward 2.'),
  r('wizard', 'Bubble Wizard', 'Pop! You’re over there now.', 'Before main move', true, 'oncePerHeat',
    'Once per heat, instead of a main move, may swap spaces with any other racer. Both teleport.'),
  r('snowball', 'Snowball', 'Starts small.', 'Main move', false, 'none',
    'Has momentum, starting at 0. Adds momentum to his main move, then gains 1 momentum (max 3). Momentum resets to 0 when he is dazed or moves backward.'),
  r('ant', 'Picnic Ant', 'Goes where the crowd is.', 'Stops on a shared space', false, 'oncePerTurn',
    'When she stops on a space with other racers, she makes a bonus move forward 1 for each of them.'),
  r('frog', 'Trampoline Frog', 'Refuses to share.', 'Own main move', false, 'none',
    'If her main move would stop on an occupied space, she keeps going to the next empty space ahead. This is part of the main move.'),
  r('merchant', 'Marble Merchant', 'Oops. Dropped them again.', 'After own main move', false, 'none',
    'Leaves marbles on the space where his main move started (one pile at a time). The next other racer to stop there is dazed and the pile is removed.'),
  r('mum', 'Stage Mum', 'Living through her darling.', 'Darling’s main-move die', false, 'none',
    'At heat start she names another racer as her darling. Whenever the darling’s main-move die shows 4 or more, Stage Mum makes a bonus move forward 1. If the darling leaves the heat she names a new one at her next turn start.'),
  r('rubber', 'Rubber Band', 'Stretches, then snaps.', 'Before main move', true, 'none',
    'If the first-place racer is 9 or more spaces ahead of him, he may teleport to the space 4 behind that racer instead of making a main move.'),
  r('fortune', 'Fortune Teller', 'Fifty percent accurate.', 'Before main move', false, 'none',
    'Must predict odd or even before rolling. Correct: +2 to the main move. Wrong: −1.'),
  r('tortoise', 'Tug Tortoise', 'Immovable. Mostly.', 'Always', false, 'none',
    'Cannot be moved, teleported or dazed by other racers’ abilities. Track spaces and event cards still affect him. Main-move rolls of 1 or 2 count as 3.'),
  r('chicken', 'Chaos Chicken', 'Nobody is safe.', 'Own main-move die', false, 'none',
    'On a 6, every other racer makes a bonus move back 1. On a 1, every other racer makes a bonus move forward 1. Resolves after her main move.'),
  r('hitch', 'Hitchhiker', 'Going my way?', 'Passed during a main move', true, 'oncePerHeat',
    'Once per heat, when another racer passes him during its main move, he may teleport to the space where that move ends.'),
  r('referee', 'Referee', 'Rewards himself for your fouls.', 'Another racer’s ability moves a racer forward', false, 'oncePerTurn',
    'Once per turn, when another racer’s ability moves any racer forward, Referee makes a bonus move forward 1.'),
  r('dervish', 'Dizzy Dervish', 'Fast, then nauseous.', 'Main move', false, 'none',
    'Rolls two dice and uses the higher. If they match, she is dazed after her main move.'),
  r('photo', 'Photo Finisher', 'Saves it for the cameras.', 'Main move', false, 'none',
    'If she starts her turn within 8 spaces of the finish: +3. Otherwise −1 (minimum 1).'),
  r('understudy', 'Understudy', 'Waiting for someone to break a leg.', 'A racer leaves the heat', false, 'oncePerHeat',
    'Has no ability until the first other racer finishes or is knocked out, then gains that racer’s ability for the rest of the heat.'),
  r('cannon', 'Captain Cannonball', 'One shot. Make it count.', 'Before main move', true, 'oncePerHeat',
    'Once per heat, instead of rolling, he may fire himself forward 9 spaces. He is then dazed.'),
  r('penny', 'Penny Pig', 'Saving up for something big.', 'Own main-move die', true, 'none',
    'Whenever she rolls a 1 or 2 she saves a coin (up to 3). Before rolling she may smash the piggy bank: +3 to her main move for each coin.'),
  r('goat', 'Billy Bash', 'Personal space enthusiast.', 'Stops on a shared space', false, 'oncePerTurn',
    'When he stops on a space with other racers, each of them makes a bonus move back 2.'),
  r('hurdler', 'Hurdling Hank', 'You are an obstacle to him.', 'After own main move', false, 'none',
    'After his main move, he makes a bonus move forward 1 for each racer that move passed.'),
  r('slug', 'Steady Slug', 'Slow, bitter, reliable.', 'Main move', false, 'none',
    'Her main move is always exactly 3, whatever she rolls. Whenever another racer finishes, she makes a bonus move forward 5 out of spite.'),
  r('parrot', 'Polly Repeat', 'Heard that one before.', 'Any main-move die', false, 'none',
    'Remembers her own last roll. Whenever another racer rolls that same number, she makes a bonus move forward 2.'),
  r('bear', 'Honey Bear', 'Sticky situation.', 'Another racer stops on his space', false, 'oncePerTurn',
    'Once per turn, when another racer stops on his space, that racer is dazed.'),
  r('daredevil', 'Dare Devil Dee', 'Double or nothing.', 'Before main move', true, 'none',
    'Before rolling she may call double or nothing: a roll of 4 or more moves double, but 3 or less moves 0.'),
];

export const RACERS: Record<string, RacerDef> = Object.fromEntries(RACER_LIST.map((x) => [x.id, x]));
