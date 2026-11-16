import { describe, expect, it } from 'vitest';
import type { CardOf } from '../content/schema';
import { CARDS } from '../content/index';
import { bugRegion, hintFor, patternOptions, removedChoice, struckPatterns } from './hints';
import { checkOneLiner, normalize } from './oneliner';

const grid: CardOf<'oneliner'> = {
  id: 'g',
  kind: 'oneliner',
  title: 'grid',
  prompt: 'p',
  explanation: 'e',
  tags: ['t'],
  accept: ['Array.from({ length: m }, () => Array(n).fill(0))'],
  traps: [{ answer: 'Array(m).fill(Array(n).fill(0))', why: 'shared rows' }],
};

describe('one-liner checking', () => {
  it('ignores spacing, quotes, semicolons and parens around a single arrow param', () => {
    expect(normalize("[...s].reverse().join('');")).toBe(normalize('[ ...s ].reverse().join("")'));
    expect(normalize('nums.map((x) => x * 2)')).toBe(normalize('nums.map(x=>x*2)'));
    expect(normalize('new Array(n)')).toBe(normalize('Array(n)'));
  });
  it('recognizes accepted answers, traps, blanks and unknowns', () => {
    expect(checkOneLiner(grid, 'Array.from({length:m},()=>new Array(n).fill(0));').kind).toBe('match');
    expect(checkOneLiner(grid, 'Array(m).fill(Array(n).fill(0))')).toEqual({ kind: 'trap', why: 'shared rows' });
    expect(checkOneLiner(grid, '  ').kind).toBe('empty');
    expect(checkOneLiner(grid, 'grid = []').kind).toBe('unknown');
  });
});

describe('automatic hints', () => {
  it('bug region is 3 lines inside the code and contains the bug', () => {
    const card: CardOf<'bug'> = { id: 'b', kind: 'bug', title: 't', prompt: 'p', explanation: 'e', tags: ['t'], code: 'a\nb\nc\nd\ne', bugLines: [5], fix: 'f' };
    expect(bugRegion(card)).toEqual([3, 5]);
    expect(bugRegion({ ...card, bugLines: [1] })).toEqual([1, 3]);
    expect(hintFor(card)).toEqual({ html: 'The bug is somewhere in lines 3–5.', auto: true });
  });

  it('every seed card has a usable hint, and auto hints never remove a right answer', () => {
    for (const c of CARDS) {
      if (c.kind !== 'flip') expect(hintFor(c), c.id).not.toBeNull();
      if (c.kind === 'mcq') expect(removedChoice(c)).not.toBe(c.correct);
      if (c.kind === 'pattern') {
        const opts = patternOptions(c);
        expect(opts).toHaveLength(8);
        for (const p of c.patterns) expect(opts).toContain(p);
        for (const p of struckPatterns(c)) expect(c.patterns).not.toContain(p);
      }
    }
  });

  it('every one-liner accepts its own model answers and flags its own traps', () => {
    for (const c of CARDS) {
      if (c.kind !== 'oneliner') continue;
      for (const a of c.accept) expect(checkOneLiner(c, a).kind, `${c.id}: ${a}`).toBe('match');
      for (const t of c.traps ?? []) expect(checkOneLiner(c, t.answer).kind, `${c.id}: ${t.answer}`).toBe('trap');
    }
  });
});
