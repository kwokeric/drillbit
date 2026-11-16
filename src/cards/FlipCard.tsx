import type { CardOf } from '../content/schema';
import { Html } from '../lib/ui';
import { CardFrame, Reveal, type CardViewProps } from './CardFrame';

export function FlipCard({ card, ctx }: CardViewProps<CardOf<'flip'>>) {
  return (
    <CardFrame
      card={card}
      ctx={ctx}
      controls={
        <button type="button" className="btn" onClick={() => ctx.onAnswer('self')}>
          Show answer
        </button>
      }
      reveal={
        <Reveal outcome="self" verdict="Answer">
          <Html as="p" html={card.explanation} />
        </Reveal>
      }
    >
      <Html as="p" className="prompt-title" html={card.prompt} />
      {!ctx.answered && <p className="muted small">Answer it out loud or in your head, then flip.</p>}
    </CardFrame>
  );
}
