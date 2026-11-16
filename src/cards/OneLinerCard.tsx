import { useRef, useState } from 'react';
import type { CardOf } from '../content/schema';
import type { Outcome } from '../session/session';
import { Code, Html } from '../lib/ui';
import { CardFrame, Reveal, type CardViewProps } from './CardFrame';
import { checkOneLiner, type OneLinerResult } from './oneliner';

const SYMBOLS = ['(', ')', '[', ']', '{', '}', '=>', '.', '...', ',', "'", '?'];

export function OneLinerCard({ card, ctx }: CardViewProps<CardOf<'oneliner'>>) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<OneLinerResult | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const insert = (s: string) => {
    const el = input.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    setValue(value.slice(0, start) + s + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + s.length, start + s.length);
    });
  };

  const check = () => {
    if (ctx.answered) return;
    const r = checkOneLiner(card, value);
    setResult(r);
    const o: Outcome = r.kind === 'match' ? 'correct' : r.kind === 'unknown' ? 'self' : 'wrong';
    ctx.onAnswer(o);
  };

  const r = result ?? { kind: 'empty' as const };
  const [outcome, verdict]: [Outcome, string] =
    r.kind === 'match' ? ['correct', 'Correct'] : r.kind === 'trap' ? ['wrong', 'Classic trap'] : r.kind === 'empty' ? ['wrong', "Here's the answer"] : ['self', 'No exact match'];
  const others = card.accept.slice(1);

  return (
    <CardFrame
      card={card}
      ctx={ctx}
      controls={
        <button type="button" className="btn" onClick={check}>
          {value.trim() ? 'Check' : 'Show answer'}
        </button>
      }
      reveal={
        <Reveal outcome={outcome} verdict={verdict}>
          {r.kind === 'trap' && <Html as="p" html={r.why} />}
          {r.kind === 'unknown' && <p>Compare with the answer below and grade yourself honestly.</p>}
          <Code src={card.accept[0]} />
          <Html as="p" html={card.explanation} />
          {others.length > 0 && (
            <details>
              <summary>Also accepted</summary>
              {others.map((a) => (
                <Code key={a} src={a} />
              ))}
            </details>
          )}
        </Reveal>
      }
    >
      <Html as="p" className="prompt-title" html={card.prompt} />
      <div className="oneline">
        <input
          ref={input}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          disabled={ctx.answered}
          placeholder="One expression"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Your answer"
        />
        {!ctx.answered && (
          <div className="symbar">
            {SYMBOLS.map((s) => (
              <button
                key={s}
                type="button"
                className="sym"
                // Keep the keyboard open on mobile: don't let the button take focus.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => insert(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </CardFrame>
  );
}
