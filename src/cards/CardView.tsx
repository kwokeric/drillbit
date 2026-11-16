import type { Card } from '../content/schema';
import { BugCard } from './BugCard';
import type { CardCtx } from './CardFrame';
import { FlipCard } from './FlipCard';
import { McqCard } from './McqCard';
import { OneLinerCard } from './OneLinerCard';
import { PatternCard } from './PatternCard';

export function CardView({ card, ctx }: { card: Card; ctx: CardCtx }) {
  switch (card.kind) {
    case 'bug':
      return <BugCard card={card} ctx={ctx} />;
    case 'mcq':
      return <McqCard card={card} ctx={ctx} />;
    case 'flip':
      return <FlipCard card={card} ctx={ctx} />;
    case 'pattern':
      return <PatternCard card={card} ctx={ctx} />;
    case 'oneliner':
      return <OneLinerCard card={card} ctx={ctx} />;
  }
}
