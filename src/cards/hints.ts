import { PATTERNS, type Card, type CardOf, type Pattern } from '../content/schema';
import { escapeHtml, hash } from '../lib/ui';

export interface HintInfo {
  html: string;
  /** true = generated from the card's answer because the card has no written hint. */
  auto: boolean;
}

/** The written hint, or an automatic one. Flip cards without a written hint have none. */
export function hintFor(card: Card): HintInfo | null {
  if (card.hint) return { html: card.hint, auto: false };
  switch (card.kind) {
    case 'bug': {
      const [a, b] = bugRegion(card);
      return { html: `The bug is somewhere in lines ${a}–${b}.`, auto: true };
    }
    case 'mcq':
      return { html: 'One wrong answer has been removed.', auto: true };
    case 'pattern':
      return { html: "Some patterns that don't fit have been struck out.", auto: true };
    case 'oneliner': {
      const start = card.accept[0].split('(')[0].slice(0, 16);
      return { html: `It starts with <code>${escapeHtml(start)}</code>.`, auto: true };
    }
    case 'flip':
      return null;
  }
}

/** A 3-line window around the root-cause line, for the automatic bug hint. */
export function bugRegion(card: CardOf<'bug'>): [number, number] {
  const n = card.code.split('\n').length;
  const start = Math.max(1, Math.min(card.bugLines[0] - 1, n - 2));
  return [start, Math.min(n, start + 2)];
}

/** The wrong choice the automatic MCQ hint removes. */
export function removedChoice(card: CardOf<'mcq'>): number {
  const wrong = card.choices.map((_, i) => i).filter((i) => i !== card.correct);
  return wrong[hash(card.id) % wrong.length];
}

/** The chips offered on a pattern card: every right answer plus distractors, 8 in total, in a stable order. */
export function patternOptions(card: CardOf<'pattern'>): Pattern[] {
  const distractors = PATTERNS.filter((p) => !card.patterns.includes(p))
    .sort((a, b) => hash(card.id + a) - hash(card.id + b))
    .slice(0, Math.max(0, 8 - card.patterns.length));
  return [...card.patterns, ...distractors].sort((a, b) => hash(card.id + '/' + a) - hash(card.id + '/' + b));
}

/** Half of the wrong chips, struck out by the automatic pattern hint. */
export function struckPatterns(card: CardOf<'pattern'>): Pattern[] {
  const wrong = patternOptions(card).filter((p) => !card.patterns.includes(p));
  return wrong.slice(0, Math.ceil(wrong.length / 2));
}
