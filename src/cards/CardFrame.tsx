import { useEffect, useRef, type ReactNode } from 'react';
import { deckInfo, type Card } from '../content/schema';
import type { Outcome } from '../session/session';
import { Html } from '../lib/ui';
import { hintFor } from './hints';

/** What the session passes to every card component. */
export interface CardCtx {
  hinted: boolean;
  onHint: () => void;
  answered: boolean;
  onAnswer: (o: Outcome) => void;
  /** Rendered in the dock once the card is answered. */
  gradeBar: ReactNode;
}

export interface CardViewProps<C extends Card = Card> {
  card: C;
  ctx: CardCtx;
}

const VERDICT_CLASS: Record<Outcome, string> = { correct: 'good', partial: '', wrong: 'bad', self: '' };

export function Reveal({ outcome, verdict, children }: { outcome: Outcome; verdict: string; children: ReactNode }) {
  return (
    <section className={`reveal ${VERDICT_CLASS[outcome]}`} aria-live="polite">
      <span className="verdict">{verdict}</span>
      {children}
    </section>
  );
}

interface FrameProps {
  card: Card;
  ctx: CardCtx;
  /** Right side of the card header. Defaults to the card's tags. */
  headRight?: ReactNode;
  children: ReactNode;
  reveal?: ReactNode;
  /** Dock contents before answering (buttons or a short instruction). */
  controls: ReactNode;
}

export function CardFrame({ card, ctx, headRight, children, reveal, controls }: FrameProps) {
  const deck = deckInfo(card);
  const hint = hintFor(card);
  const revealRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (ctx.answered) revealRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [ctx.answered]);
  useEffect(() => {
    if (ctx.hinted) hintRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [ctx.hinted]);

  return (
    <>
      <div className="pbody">
        <article className="icard">
          <header className="icard-head">
            <span className={`kind ${deck.kindClass}`}>{card.kind === 'flip' && deck.id === 'fundamentals' ? 'Flip card' : deck.short}</span>
            {headRight ?? <span className="lc">{card.tags.slice(0, 2).join(' · ')}</span>}
          </header>
          <div className="icard-body">
            {children}
            {ctx.hinted && hint && (
              <p className="hintbox" ref={hintRef}>
                <b>Hint</b>
                <Html html={hint.html} />
              </p>
            )}
          </div>
        </article>
        {ctx.answered && <div ref={revealRef}>{reveal}</div>}
      </div>
      <div className="dock">
        {ctx.answered ? (
          ctx.gradeBar
        ) : (
          <div className="dock-row">
            {controls}
            {hint && (
              <button type="button" className="btn ghost hintbtn" onClick={ctx.onHint} disabled={ctx.hinted}>
                {ctx.hinted ? 'Hint used' : 'Hint'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
