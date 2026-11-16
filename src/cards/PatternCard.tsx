import { useRef, useState, type PointerEvent } from 'react';
import { PATTERN_INFO } from '../content/patterns';
import type { CardOf, Pattern } from '../content/schema';
import { Html } from '../lib/ui';
import { CardFrame, Reveal, type CardViewProps } from './CardFrame';
import { patternOptions, struckPatterns } from './hints';

const LONG_PRESS_MS = 450;

export function PatternCard({ card, ctx }: CardViewProps<CardOf<'pattern'>>) {
  const [picked, setPicked] = useState<Set<Pattern>>(new Set());
  const [tip, setTip] = useState<Pattern | null>(null);
  const options = patternOptions(card);
  const struck = ctx.hinted && !card.hint ? new Set(struckPatterns(card)) : new Set<Pattern>();
  const right = (p: Pattern) => card.patterns.includes(p);
  const hits = [...picked].filter(right).length;
  const wrong = [...picked].filter((p) => !right(p));
  const missed = card.patterns.filter((p) => !picked.has(p));
  const outcome = hits === card.patterns.length && !wrong.length ? 'correct' : hits ? 'partial' : 'wrong';
  const lc = card.leetcode;
  const url = `https://leetcode.com/problems/${lc.slug}/`;

  const toggle = (p: Pattern) => {
    setTip(null);
    if (ctx.answered || struck.has(p)) return;
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });
  };

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
          <div className="answer-pats">
            <span className="fix-label">The pattern{card.patterns.length > 1 ? 's' : ''}</span>
            <div className="meta-row">
              {card.patterns.map((p) => (
                <span key={p} className={`pill ${picked.has(p) ? 'pill-ok' : 'pill-missed'}`}>
                  {p}
                  {!picked.has(p) && ' · you missed this'}
                </span>
              ))}
            </div>
            {wrong.length > 0 && (
              <p className="small muted">
                Not needed here: {wrong.join(', ')}.
              </p>
            )}
            {outcome !== 'correct' && missed.length > 0 && (
              <ul className="missed-why">
                {missed.map((p) => (
                  <li key={p}>
                    <b>{p}:</b> {PATTERN_INFO[p]}
                  </li>
                ))}
              </ul>
            )}
          </div>
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
      <p className="hint left">Which patterns would you reach for? Pick all that apply. Long-press one to see what it means.</p>
      <div className="chips">
        {options.map((p) => {
          let cls = '';
          if (ctx.answered) cls = picked.has(p) ? (right(p) ? 'c-ok' : 'c-bad') : right(p) ? 'c-missed' : '';
          else if (struck.has(p)) cls = 'c-struck';
          return (
            <PatternChip
              key={p}
              pattern={p}
              className={cls}
              pressed={ctx.answered ? undefined : picked.has(p)}
              inactive={ctx.answered || struck.has(p)}
              onTap={() => toggle(p)}
              onLongPress={() => setTip(p)}
            />
          );
        })}
      </div>
      {tip && (
        <div className="tip" role="tooltip">
          <div>
            <b>{tip}</b>
            <p>{PATTERN_INFO[tip]}</p>
          </div>
          <button type="button" className="tip-close" aria-label="Close" onClick={() => setTip(null)}>
            ×
          </button>
        </div>
      )}
    </CardFrame>
  );
}

interface ChipProps {
  pattern: Pattern;
  className: string;
  pressed: boolean | undefined;
  /** Can't be toggled (answered or struck out), but long-press still explains it. */
  inactive: boolean;
  onTap: () => void;
  onLongPress: () => void;
}

function PatternChip({ pattern, className, pressed, inactive, onTap, onLongPress }: ChipProps) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const cancel = () => window.clearTimeout(timer.current);

  const down = (e: PointerEvent) => {
    fired.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    cancel();
    timer.current = window.setTimeout(() => {
      fired.current = true;
      navigator.vibrate?.(10);
      onLongPress();
    }, LONG_PRESS_MS);
  };
  const move = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) cancel();
  };

  return (
    <button
      type="button"
      className={`chip ${className}`}
      aria-pressed={pressed}
      aria-disabled={inactive || undefined}
      title={PATTERN_INFO[pattern]}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        // A long press opens the tooltip. It shouldn't also toggle the chip.
        if (fired.current) {
          fired.current = false;
          return;
        }
        onTap();
      }}
    >
      {pattern}
    </button>
  );
}
