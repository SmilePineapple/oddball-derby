import type { Ctx } from './ctx';
import type { Entrant } from './types';

export interface CardDef {
  id: string;
  name: string;
  lasting: boolean;
  text: string;
  onReveal?(ctx: Ctx, revealer: Entrant): void;
}

const CARD = { kind: 'card' } as const;

export const CARD_LIST: CardDef[] = [
  { id: 'tailwind', name: 'Tailwind', lasting: true, text: 'Every main move gets +1.' },
  { id: 'headwind', name: 'Headwind', lasting: true, text: 'Main-move rolls of 6 count as 4.' },
  {
    id: 'stampede', name: 'Stampede', lasting: false,
    text: 'Every racer makes a bonus move forward 2, first place first.',
    onReveal(ctx) {
      const list = ctx.order().filter((e) => e.status === 'racing');
      list.sort((a, b) => b.space - a.space);
      for (const e of list) ctx.bonusMove(e, 2, CARD);
    },
  },
  {
    id: 'mudslide', name: 'Mud Slide', lasting: false,
    text: 'The first-place racer(s) make a bonus move back 3.',
    onReveal(ctx) {
      const racing = ctx.order().filter((e) => e.status === 'racing');
      const top = Math.max(...racing.map((e) => e.space));
      for (const e of racing.filter((x) => x.space === top)) ctx.bonusMove(e, -3, CARD);
    },
  },
  {
    id: 'wideawake', name: 'Wide Awake', lasting: true,
    text: 'Nobody can be dazed. Existing daze is removed.',
    onReveal(ctx) {
      for (const e of ctx.h.entrants) e.dazed = false;
    },
  },
  { id: 'mirror', name: 'Mirror Day', lasting: true, text: 'Odd main-move rolls move backward; even rolls move double.' },
  {
    id: 'grouphug', name: 'Group Hug', lasting: false,
    text: 'Every racer teleports to the space of the racer in the middle position (lower middle if even).',
    onReveal(ctx) {
      const racing = ctx.order().filter((e) => e.status === 'racing');
      const sorted = racing.map((e) => e.space).sort((a, b) => a - b);
      const median = sorted[Math.floor((sorted.length - 1) / 2)];
      for (const e of racing) if (e.status === 'racing' && e.space !== median) ctx.teleport(e, median, CARD);
    },
  },
  {
    id: 'sprint', name: 'Sudden Sprint', lasting: true,
    text: 'The heat now ends when the first racer finishes; second place goes to whoever is furthest ahead.',
    onReveal(ctx) {
      ctx.checkEnd();
    },
  },
  {
    id: 'trapdoor', name: 'Trapdoor', lasting: false,
    text: 'The racer who revealed this is knocked out. If only 2 racers remain, it is dazed instead.',
    onReveal(ctx, revealer) {
      if (ctx.racing().length <= 2) ctx.daze(revealer, CARD);
      else ctx.knockOut(revealer);
    },
  },
  { id: 'doubledice', name: 'Double Dice', lasting: true, text: 'Everyone rolls two dice for main moves and uses the lower.' },
  { id: 'underdog', name: 'Underdog Hour', lasting: true, text: 'A racer alone in last place at its turn start gets +2 to its main move.' },
  {
    id: 'silence', name: 'Silence!', lasting: true,
    text: 'Racer abilities do not work for one full round, then this card is discarded.',
    onReveal(ctx) {
      ctx.h.silenceLeft = ctx.racing().length + 1;
    },
  },
];

export const CARDS: Record<string, CardDef> = Object.fromEntries(CARD_LIST.map((c) => [c.id, c]));
