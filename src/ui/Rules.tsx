import { useState } from 'react';
import { RACER_LIST } from '../engine/racers';
import { CARD_LIST } from '../engine/cards';
import { Modal, RacerCard } from './bits';
import { SPACE_STYLE } from './art';

const TABS = ['How to play', 'House rules', 'Racers', 'Event cards', 'Track spaces', 'Words'] as const;

const TERMS: [string, string][] = [
  ['Main move', 'The dice move a racer makes on its own turn.'],
  ['Bonus move', 'Any other movement along the track, forward or back, caused by an ability, a space or a card.'],
  ['Teleport', 'The racer is lifted and placed elsewhere. It is not a move, so it passes nobody, but the racer does stop on the new space.'],
  ['Pass', 'Moving through a space with another racer on it and ending beyond it.'],
  ['Stop', 'Ending a move or teleport on a space. Track spaces only work when you stop on them.'],
  ['Share', 'Two or more racers on one space. Any number can share.'],
  ['Alone in last', 'Behind every other racer, with nobody level with you.'],
  ['Dazed', 'Skip your next main move, then recover. Abilities still work.'],
  ['Knocked out', 'Removed from the heat. Scores nothing.'],
];

export function Rules({ onClose, initial }: { onClose: () => void; initial?: (typeof TABS)[number] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>(initial ?? 'How to play');
  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between mb-3">
        <h2 className="display text-4xl">Rules</h2>
        <button className="btn small ghost" onClick={onClose}>Close ✕</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t} className={`btn small ${t === tab ? 'red' : 'ghost'}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'How to play' && (
        <div className="space-y-3 leading-relaxed font-bold">
          <p><b>Goal.</b> Win the most stars over 4 heats. In each heat the first racer home wins <b>4 stars</b> and the second wins <b>2</b>. The heat ends as soon as the second racer finishes.</p>
          <p><b>Teams.</b> Each player drafts a team of racers. Every racer runs in exactly one heat, so choose who to save. Line-ups are picked in secret and revealed together.</p>
          <p><b>On your turn.</b> Roll one die and move that many spaces. That is your <i>main move</i>. Every racer has an ability that bends this rule somehow.</p>
          <p><b>Who goes first when things happen together?</b> The racer whose turn it is, then the other racers in turn order, then the track space.</p>
          <p><b>Track spaces</b> only work when you <i>stop</i> on them, never when you pass, and each racer can only be affected by one space per turn.</p>
          <p><b>Heats</b> are run on four tracks drawn from the ones you chose at setup. The player with the fewest stars starts the next heat.</p>
          <p><b>Ties</b> at the end go to the player with more heat wins, then more second places. If still tied, the win is shared.</p>
          <p><b>Two players</b> (Duel) and <b>three-player doubles</b> draft 8 racers each and run 2 per heat.</p>
        </div>
      )}
      {tab === 'House rules' && (
        <div className="space-y-2">
          <p className="font-bold opacity-75">Optional rules chosen when you start a game.</p>
          {[
            ['Move cards', 'Instead of rolling you may play a move card numbered 1 to 6. In "Dice or cards" each card can be used once per heat. In "Cards only" your cards come back when all six are used. A played card counts as your roll for abilities. Dizzy Dervish and an ignited Jetpack Granny always roll.'],
            ['Space duels', 'When your main move ends on another player\'s racer, the two of you play a reaction duel. Wait for GO, then tap your side first. Tap early and you lose. The loser moves back 1.'],
            ['Boost tokens', 'Each player has 3 for the whole Grand Prix. Switch one on before your main move for +2.'],
            ['Timing sprint', 'Once per heat each racer may sprint before moving. Stop the needle in the middle for +3, close for +2 or +1. A miss still uses it up.'],
            ['Secret tiles', 'Before each heat every player secretly places one boost or mud tile on an empty space. They are revealed when the race starts. If two players pick the same space, the first one stands.'],
            ['Bid to start', 'From the second heat, players secretly bid up to 3 stars. The highest bidder pays and starts the heat. Nobody else pays.'],
            ['Shortcuts', 'Loop-de-Lagoon and Haunted Hairpins gain a shortcut. When your main move reaches its entrance with steps to spare, choose the long way or the shortcut. The shortcut is shorter but its spaces are hazards. Only main moves can take it.'],
          ].map(([k, v]) => (
            <div key={k} className="card flat p-3"><div className="display text-lg">{k}</div><div className="text-sm font-bold opacity-90">{v}</div></div>
          ))}
        </div>
      )}
      {tab === 'Racers' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {RACER_LIST.map((r) => <RacerCard key={r.id} id={r.id} />)}
        </div>
      )}
      {tab === 'Event cards' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {CARD_LIST.map((c) => (
            <div key={c.id} className="card flat p-3" style={{ background: '#ffe3ee' }}>
              <div className="display text-xl">{c.name}</div>
              <div className="chip mb-1">{c.lasting ? 'Lasts for the heat' : 'Happens once'}</div>
              <div className="text-sm font-bold">{c.text}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'Track spaces' && (
        <div className="space-y-2">
          {Object.values(SPACE_STYLE).map((s) => (
            <div key={s.label} className="card flat p-3 flex items-center gap-3">
              <div className="display w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: s.fill, border: '3px solid var(--ink)' }}>{s.icon}</div>
              <div className="font-bold"><span className="display text-lg">{s.label}.</span> {s.help}</div>
            </div>
          ))}
          <p className="text-sm font-bold opacity-75 pt-1">Marbles are left by Marble Merchant. The next other racer to stop there is dazed.</p>
        </div>
      )}
      {tab === 'Words' && (
        <dl className="space-y-2">
          {TERMS.map(([k, v]) => (
            <div key={k} className="card flat p-3"><dt className="display text-lg">{k}</dt><dd className="text-sm font-bold opacity-90">{v}</dd></div>
          ))}
        </dl>
      )}
    </Modal>
  );
}
