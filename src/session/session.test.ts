import { describe, expect, it } from 'vitest';
import type { Card } from '../content/schema';
import { addDays } from '../srs/schedule';
import { advance, buildDaily, buildDeck, dueCards, newCards, weakCards, type Session } from './session';

const NOW = new Date(2026, 10, 15, 9).getTime();
const flip = (id: string): Card => ({ id, kind: 'flip', title: id, prompt: 'p', explanation: 'e', tags: ['t'] });
const bug = (id: string): Card => ({ id, kind: 'bug', title: id, prompt: 'p', explanation: 'e', tags: ['t'], code: 'x', bugLines: [1], fix: 'y' });
const rev = (due: number, extra: Partial<{ lapses: number; hintsUsed: number; ease: number }> = {}) => ({ due, lapses: 0, hintsUsed: 0, ease: 2.5, ...extra });

describe('session builders', () => {
  const cards = [flip('f1'), flip('f2'), flip('f3'), bug('b1'), bug('b2')];

  it('due today includes anything due before tomorrow, oldest first', () => {
    const reviews = new Map([
      ['f1', rev(addDays(NOW, 0) + 20 * 3600_000)],
      ['f2', rev(addDays(NOW, -3))],
      ['f3', rev(addDays(NOW, 1))],
    ]);
    expect(dueCards(cards, reviews, NOW).map((c) => c.id)).toEqual(['f2', 'f1']);
  });

  it('new cards alternate between decks', () => {
    expect(newCards(cards, new Map()).map((c) => c.id)).toEqual(['f1', 'b1', 'f2', 'b2', 'f3']);
  });

  it('daily respects the new-card limit already used today', () => {
    const s = buildDaily(cards, new Map(), NOW, 5, 3);
    expect(s.queue).toHaveLength(2);
    expect(s.schedule).toBe(true);
  });

  it('deck drill falls back to unscheduled practice when nothing is due', () => {
    const reviews = new Map(cards.map((c) => [c.id, rev(addDays(NOW, 5))]));
    const s = buildDeck(cards, reviews, NOW, 'bug', 'Spot the bug');
    expect(s.schedule).toBe(false);
    expect(s.queue.sort()).toEqual(['b1', 'b2']);
  });

  it('weak cards rank lapses above hints', () => {
    const reviews = new Map([
      ['f1', rev(NOW, { hintsUsed: 1 })],
      ['f2', rev(NOW, { lapses: 1 })],
      ['f3', rev(NOW)],
    ]);
    expect(weakCards(cards, reviews).map((c) => c.id)).toEqual(['f2', 'f1']);
  });
});

describe('advance()', () => {
  const base: Session = { mode: 'daily', label: '', schedule: true, queue: ['a', 'b', 'c', 'd', 'e', 'f'], pos: 0, results: [], startedAt: NOW, reshown: {} };

  it('Again re-queues the card three cards later', () => {
    const s = advance(base, { cardId: 'a', grade: 'again', hinted: false, outcome: 'wrong' });
    expect(s.queue).toEqual(['a', 'b', 'c', 'd', 'a', 'e', 'f']);
    expect(s.pos).toBe(1);
  });

  it('re-shows a card at most twice', () => {
    let s: Session = { ...base, queue: ['a'] };
    for (let i = 0; i < 5 && s.pos < s.queue.length; i++) s = advance(s, { cardId: 'a', grade: 'again', hinted: false, outcome: 'wrong' });
    expect(s.queue).toEqual(['a', 'a', 'a']);
    expect(s.pos).toBe(3);
  });

  it('Good just moves on', () => {
    const s = advance(base, { cardId: 'a', grade: 'good', hinted: false, outcome: 'correct' });
    expect(s.queue).toEqual(base.queue);
    expect(s.results).toHaveLength(1);
  });
});
