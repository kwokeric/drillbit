import { z } from 'zod';

export const PATTERNS = [
  'Hash map / set',
  'Two pointers',
  'Sliding window',
  'Prefix sum',
  'Binary search',
  'Sort first',
  'Stack / monotonic stack',
  'Heap / top-k',
  'Intervals: sort + sweep',
  'Fast & slow pointers',
  'Tree DFS / BFS',
  'Graph BFS / DFS',
  'Topological sort',
  'Backtracking',
  'Dynamic programming',
  'Greedy',
  'Union-Find',
  'Trie',
] as const;

export const Pattern = z.enum(PATTERNS);
export type Pattern = z.infer<typeof Pattern>;

const base = {
  id: z.string().regex(/^[a-z0-9-]+$/, 'ids are kebab-case'),
  title: z.string().min(1),
  /** Short question or symptom. May contain inline HTML (<code>, <b>, <i>). */
  prompt: z.string().min(1),
  /** Shown after answering. May contain inline HTML. */
  explanation: z.string().min(1),
  tags: z.array(z.string()).min(1),
  /** A nudge that points at the idea without giving the answer away. */
  hint: z.string().optional(),
};

const BugCard = z.object({
  ...base,
  kind: z.literal('bug'),
  code: z.string(),
  /** 1-indexed lines that count as the bug. The first one is the root cause. */
  bugLines: z.array(z.number().int().positive()).min(1),
  /** 1-indexed lines where the symptom shows up. Tapping one earns "close". */
  symptomLines: z.array(z.number().int().positive()).optional(),
  /** The corrected line(s). Plain code, not HTML. */
  fix: z.string().min(1),
});

const McqCard = z.object({
  ...base,
  kind: z.literal('mcq'),
  code: z.string().optional(),
  choices: z.array(z.string()).min(2).max(5),
  correct: z.number().int().nonnegative(),
});

const FlipCard = z.object({ ...base, kind: z.literal('flip') });

const PatternCard = z.object({
  ...base,
  kind: z.literal('pattern'),
  leetcode: z.object({
    id: z.number().int().positive(),
    slug: z.string(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  }),
  patterns: z.array(Pattern).min(1),
  steps: z.array(z.string()).min(2).max(4),
  complexity: z.object({ time: z.string(), space: z.string() }),
  gotcha: z.string().optional(),
});

const OneLinerCard = z.object({
  ...base,
  kind: z.literal('oneliner'),
  /** Accepted answers, compared after normalizing whitespace, quotes and a trailing semicolon. The first is the model answer. */
  accept: z.array(z.string()).min(1),
  traps: z.array(z.object({ answer: z.string(), why: z.string() })).optional(),
});

export const Card = z
  .discriminatedUnion('kind', [BugCard, McqCard, FlipCard, PatternCard, OneLinerCard])
  .superRefine((c, ctx) => {
    if (c.kind === 'bug') {
      const n = c.code.split('\n').length;
      for (const l of [...c.bugLines, ...(c.symptomLines ?? [])])
        if (l > n) ctx.addIssue({ code: 'custom', message: `line ${l} is past the end of the code (${n} lines)` });
    }
    if (c.kind === 'mcq' && c.correct >= c.choices.length)
      ctx.addIssue({ code: 'custom', message: `correct=${c.correct} but only ${c.choices.length} choices` });
  });

export type Card = z.infer<typeof Card>;
export type CardKind = Card['kind'];
export type CardOf<K extends CardKind> = Extract<Card, { kind: K }>;
export const ContentFile = z.union([Card, z.array(Card)]);

/** Decks shown in the app. 'mcq' and 'flip' cards both belong to Fundamentals. */
export type DeckId = 'bug' | 'fundamentals' | 'pattern' | 'oneliner';
export const DECKS: { id: DeckId; name: string; short: string; color: string; kindClass: string }[] = [
  { id: 'bug', name: 'Spot the bug', short: 'Spot the bug', color: 'var(--bad)', kindClass: 'k-bug' },
  { id: 'fundamentals', name: 'JS / TS fundamentals', short: 'JS / TS', color: 'var(--tn)', kindClass: 'k-js' },
  { id: 'pattern', name: 'Algo patterns', short: 'Algo pattern', color: 'var(--accent)', kindClass: 'k-pat' },
  { id: 'oneliner', name: 'One-liners', short: 'One-liner', color: 'var(--ok)', kindClass: 'k-one' },
];
export const deckOf = (c: Card): DeckId => (c.kind === 'mcq' || c.kind === 'flip' ? 'fundamentals' : c.kind);
export const deckInfo = (c: Card) => DECKS.find((d) => d.id === deckOf(c))!;
