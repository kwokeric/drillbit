import { useState } from 'react';
import type { CardOf, Pattern } from '../content/schema';
import { Html } from '../lib/ui';
import { CardFrame, Reveal, type CardViewProps } from './CardFrame';
import { patternOptions, struckPatterns } from './hints';

export function PatternCard({ card, ctx }: CardViewProps<CardOf<'pattern'>>) {
  const [picked, setPicked] = useState<Set<Pattern>>(new Set());
  const options = patternOptions(card);
  const struck = ctx.hinted && !card.hint ? new Set(struckPatterns(card)) : new Set<Pattern>();
  const right = (p: Pattern) => card.patterns.includes(p);
  const hits = [...picked].filter(right).length;
  const wrong = [...picked].filter((p) => !right(p)).length;
  const outcome = hits === card.patterns.length && !wrong ? 'correct' : hits ? 'partial' : 'wrong';
  const lc = card.leetcode;
  const url = `https://leetcode.com/problems/${lc.slug}/`;

  const toggle = (p: Pattern) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });

  return (
    <CardFrame
      card={card}
      ctx={ctx}
      headRight={
        <a className="lc" href={url} target="_blank" rel="noopener noreferrer">
          LC #{lc.id} · {lc.difficulty} ↗
        </a>
      }
      controls={
        <button type="button" className="btn" disabled={!picked.size} onClick={() => ctx.onAnswer(outcome)}>
          Check
        </button>
      }
      reveal={
        <Reveal outcome={outcome} verdict={outcome === 'correct' ? 'Spot on' : outcome === 'partial' ? 'Partly right' : 'Not quite'}>
          <Html as="p" html={card.explanation} />
          <ol className="steps">
            {card.steps.map((s, i) => (
              <Html as="li" key={i} html={s} />
            ))}
          </ol>
          <div className="meta-row">
            <span className="pill">Time {card.complexity.time}</span>
            <span className="pill">Space {card.complexity.space}</span>
          </div>
          {card.gotcha && (
            <p className="gotcha">
              <b>Gotcha:</b> <Html html={card.gotcha} />
            </p>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open on LeetCode ↗
          </a>
        </Reveal>
      }
    >
      <p className="prompt-title">{card.title}</p>
      <Html as="p" html={card.prompt} />
      <p className="hint left">Which patterns would you reach for? Pick all that apply.</p>
      <div className="chips">
        {options.map((p) => {
          let cls = '';
          if (ctx.answered) cls = picked.has(p) ? (right(p) ? 'c-ok' : 'c-bad') : right(p) ? 'c-missed' : '';
          else if (struck.has(p)) cls = 'c-struck';
          return (
            <button
              key={p}
              type="button"
              className={`chip ${cls}`}
              aria-pressed={ctx.answered ? undefined : picked.has(p)}
              disabled={ctx.answered || struck.has(p)}
              onClick={() => toggle(p)}
            >
              {p}
            </button>
          );
        })}
      </div>
    </CardFrame>
  );
}
