import { useState } from 'react';
import type { CardOf } from '../content/schema';
import { Code, Html } from '../lib/ui';
import { CardFrame, Reveal, type CardViewProps } from './CardFrame';
import { bugRegion } from './hints';

export function BugCard({ card, ctx }: CardViewProps<CardOf<'bug'>>) {
  const [picked, setPicked] = useState<number | null>(null);
  const narrowed = ctx.hinted && !card.hint ? bugRegion(card) : null;
  const isBug = (n: number) => card.bugLines.includes(n);
  const isSymptom = (n: number) => !!card.symptomLines?.includes(n);

  const pick = (n: number) => {
    if (ctx.answered) return;
    setPicked(n);
    ctx.onAnswer(isBug(n) ? 'correct' : isSymptom(n) ? 'partial' : 'wrong');
  };

  const outcome = picked === null ? 'wrong' : isBug(picked) ? 'correct' : isSymptom(picked) ? 'partial' : 'wrong';
  const verdict = outcome === 'correct' ? 'Got it' : outcome === 'partial' ? "Close: that's where the symptom shows" : 'Not that one';
  const lines = card.bugLines.length > 1 ? `Lines ${card.bugLines.join(' and ')}.` : `Line ${card.bugLines[0]}.`;

  return (
    <CardFrame
      card={card}
      ctx={ctx}
      controls={<p className="hint">Tap the line that causes it</p>}
      reveal={
        <Reveal outcome={outcome} verdict={verdict}>
          <p>
            <b>{lines}</b> <Html html={card.explanation} />
          </p>
          <p className="fix-label">Fix</p>
          <Code src={card.fix} />
        </Reveal>
      }
    >
      <Html as="p" className="prompt-title" html={card.prompt} />
      <Code
        src={card.code}
        onLine={pick}
        lineDisabled={(n) => ctx.answered || (!!narrowed && (n < narrowed[0] || n > narrowed[1]))}
        lineClass={(n) => {
          if (ctx.answered) return isBug(n) ? 'hit' : n === picked ? 'miss' : '';
          return narrowed && (n < narrowed[0] || n > narrowed[1]) ? 'dim' : '';
        }}
      />
    </CardFrame>
  );
}
