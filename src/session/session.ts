import { deckOf, type Card, type DeckId } from '../content/schema';
import { addDays, type Grade } from '../srs/schedule';

export type Mode = 'daily' | 'extra' | 'deck' | 'weak' | 'cram' | 'single';
/** How the card's own check went, before you graded yourself. 'self' = no auto-check (flip cards, unmatched one-liners). */
export type Outcome = 'correct' | 'partial' | 'wrong' | 'self';

export interface SessionResult {
  cardId: string;
  grade: Grade;
  hinted: boolean;
  outcome: Outcome;
}

export interface Session {
  mode: Mode;
  label: string;
  /** false = practice only: grades don't change the schedule. */
  schedule: boolean;
  queue: string[];
  pos: number;
  results: SessionResult[];
  startedAt: number;
  /** How many times each card was re-queued after Again. */
  reshown: Record<string, number>;
}

interface ReviewLike {
  due: number;
  lapses: number;
  hintsUsed: number;
  ease: number;
}
type Reviews = Map<string, ReviewLike>;

/** A card is due today if it's due any time before tomorrow starts. */
export const isDue = (r: ReviewLike, now: number) => r.due < addDays(now, 1);

export function dueCards(cards: Card[], reviews: Reviews, now: number): Card[] {
  return cards
    .filter((c) => {
      const r = reviews.get(c.id);
      return r && isDue(r, now);
    })
    .sort((a, b) => reviews.get(a.id)!.due - reviews.get(b.id)!.due);
}

/** Unseen cards, alternating between decks so new cards aren't all one type. */
export function newCards(cards: Card[], reviews: Reviews): Card[] {
  const byDeck = new Map<DeckId, Card[]>();
  for (const c of cards) if (!reviews.has(c.id)) byDeck.set(deckOf(c), [...(byDeck.get(deckOf(c)) ?? []), c]);
  const lists = [...byDeck.values()];
  const out: Card[] = [];
  for (let i = 0; out.length < lists.reduce((n, l) => n + l.length, 0); i++)
    for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}

/** Spreads `extra` evenly through `main`. */
function interleave<T>(main: T[], extra: T[]): T[] {
  if (!extra.length) return main;
  if (!main.length) return extra;
  const out: T[] = [];
  const step = (main.length + extra.length) / extra.length;
  let e = 0;
  let m = 0;
  for (let i = 0; i < main.length + extra.length; i++) {
    if (e < extra.length && i >= Math.round(step * e + step / 2) - 1) out.push(extra[e++]);
    else if (m < main.length) out.push(main[m++]);
    else out.push(extra[e++]);
  }
  return out;
}

export function shuffle<T>(arr: T[], rand = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const make = (mode: Mode, label: string, cards: Card[], schedule: boolean, now: number): Session => ({
  mode,
  label,
  schedule,
  queue: cards.map((c) => c.id),
  pos: 0,
  results: [],
  startedAt: now,
  reshown: {},
});

export function dailyPlan(cards: Card[], reviews: Reviews, now: number, newPerDay: number, newToday: number) {
  const due = dueCards(cards, reviews, now);
  const fresh = newCards(cards, reviews).slice(0, Math.max(0, newPerDay - newToday));
  return { due, fresh };
}

export function buildDaily(cards: Card[], reviews: Reviews, now: number, newPerDay: number, newToday: number): Session {
  const { due, fresh } = dailyPlan(cards, reviews, now, newPerDay, newToday);
  return make('daily', 'Daily', interleave(due, fresh), true, now);
}

/** Learn more new cards after today's limit is used up. */
export function buildExtra(cards: Card[], reviews: Reviews, now: number, count: number): Session {
  return make('extra', 'Extra new cards', newCards(cards, reviews).slice(0, count), true, now);
}

/** Due cards from one deck plus up to `newLimit` new ones. Falls back to practicing the whole deck when nothing is due. */
export function buildDeck(cards: Card[], reviews: Reviews, now: number, deck: DeckId, deckName: string, newLimit = 10): Session {
  const inDeck = cards.filter((c) => deckOf(c) === deck);
  const due = dueCards(inDeck, reviews, now);
  const fresh = newCards(inDeck, reviews).slice(0, newLimit);
  if (due.length + fresh.length) return make('deck', deckName, interleave(due, fresh), true, now);
  return make('deck', `${deckName} · practice`, shuffle(inDeck), false, now);
}

/** Higher = weaker. Lapses count double; hints and low ease add to it. */
export function weakness(r: ReviewLike): number {
  return r.lapses * 2 + r.hintsUsed + (r.ease < 2 ? 1 : 0);
}

export function weakCards(cards: Card[], reviews: Reviews, limit = 15): Card[] {
  return cards
    .filter((c) => {
      const r = reviews.get(c.id);
      return r && weakness(r) > 0;
    })
    .sort((a, b) => weakness(reviews.get(b.id)!) - weakness(reviews.get(a.id)!))
    .slice(0, limit);
}

export function buildWeak(cards: Card[], reviews: Reviews, now: number): Session {
  return make('weak', 'Weak spots', shuffle(weakCards(cards, reviews)), false, now);
}

export function buildCram(cards: Card[], tags: string[], now: number): Session {
  const pick = cards.filter((c) => c.tags.some((t) => tags.includes(t)));
  return make('cram', `Cram: ${tags.join(', ')}`, shuffle(pick), false, now);
}

export function buildSingle(card: Card, now: number): Session {
  return make('single', card.title, [card], false, now);
}

const MAX_RESHOWS = 2;
const RESHOW_GAP = 3;

/** Moves past the current card. Again re-queues it a few cards later (at most twice per session). */
export function advance(s: Session, result: SessionResult): Session {
  const queue = [...s.queue];
  const reshown = { ...s.reshown };
  if (result.grade === 'again' && (reshown[result.cardId] ?? 0) < MAX_RESHOWS) {
    reshown[result.cardId] = (reshown[result.cardId] ?? 0) + 1;
    queue.splice(Math.min(queue.length, s.pos + 1 + RESHOW_GAP), 0, result.cardId);
  }
  return { ...s, queue, reshown, pos: s.pos + 1, results: [...s.results, result] };
}

export const isFinished = (s: Session) => s.pos >= s.queue.length;

/** About 35 seconds per card. */
export const estimateMinutes = (n: number) => Math.max(1, Math.round((n * 35) / 60));
