import { useState } from 'react';
import type { CardOf } from '../content/schema';
import { Code, Html } from '../lib/ui';
import { CardFrame, Reveal, type CardViewProps } from './CardFrame';
import { removedChoice } from './hints';

export function McqCard({ card, ctx }: CardViewProps<CardOf<'mcq'>>) {
  const [picked, setPicked] = useState<number | null>(null);
  const removed = ctx.hinted && !card.hint ? removedChoice(card) : -1;
  const ok = picked === card.correct;

  const pick = (i: number) => {
    if (ctx.answered) return;
    setPicked(i);
    ctx.onAnswer(i === card.correct ? 'correct' : 'wrong');
  };

  return (
    <CardFrame
      card={card}
      ctx={ctx}
      controls={<p className="hint">Pick one</p>}
      reveal={
        <Reveal outcome={ok ? 'correct' : 'wrong'} verdict={ok ? 'Correct' : 'Not quite'}>
          <Html as="p" html={card.explanation} />
        </Reveal>
      }
    >
      <Html as="p" className="prompt-title" html={card.prompt} />
      {card.code && <Code src={card.code} />}
      <div className="opts">
        {card.choices.map((c, i) => {
          const cls = ctx.answered ? (i === card.correct ? 'o-ok' : i === picked ? 'o-bad' : '') : i === removed ? 'o-removed' : '';
          return (
            <button key={i} type="button" className={`opt ${cls}`} disabled={ctx.answered || i === removed} onClick={() => pick(i)}>
              <span className="letter">{'ABCDE'[i]}</span>
              <Html html={c} />
            </button>
          );
        })}
      </div>
    </CardFrame>
  );
}
