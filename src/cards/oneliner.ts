import type { CardOf } from '../content/schema';

/** Normalizes a one-liner so formatting differences don't matter: whitespace, quote style, trailing semicolons, (x) => vs x =>. */
export function normalize(s: string): string {
  return s
    .trim()
    .replace(/\bnew\s+Array\b/g, 'Array')
    .replace(/\s+/g, '')
    .replace(/['`]/g, '"')
    .replace(/;+$/, '')
    .replace(/\((\w+)\)=>/g, '$1=>');
}

export type OneLinerResult = { kind: 'empty' } | { kind: 'match' } | { kind: 'trap'; why: string } | { kind: 'unknown' };

export function checkOneLiner(card: CardOf<'oneliner'>, input: string): OneLinerResult {
  const v = normalize(input);
  if (!v) return { kind: 'empty' };
  if (card.accept.some((a) => normalize(a) === v)) return { kind: 'match' };
  const trap = card.traps?.find((t) => normalize(t.answer) === v);
  if (trap) return { kind: 'trap', why: trap.why };
  return { kind: 'unknown' };
}
