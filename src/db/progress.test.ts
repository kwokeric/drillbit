import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CARDS } from '../content/index';
import { buildDeck } from '../session/session';
import { addDays } from '../srs/schedule';
import { db, recordAnswer, reviewMap } from './progress';

const NOW = new Date(2026, 10, 16, 9).getTime();

beforeEach(async () => {
  await db.reviews.clear();
  await db.log.clear();
});

describe('recordAnswer()', () => {
  it('a new card answered in practice is scheduled, so a deck drill skips it', async () => {
    await recordAnswer('lc-1-two-sum', 'good', false, false, NOW);
    const r = await db.reviews.get('lc-1-two-sum');
    expect(r?.due).toBe(addDays(NOW, 1));
    const drill = buildDeck(CARDS, await reviewMap(), NOW, 'pattern', 'Algo patterns', 100);
    expect(drill.queue).not.toContain('lc-1-two-sum');
    expect((await db.log.toArray())[0].newCards).toBe(1);
  });

  it('practicing a card you have seen before leaves its schedule alone', async () => {
    await recordAnswer('lc-1-two-sum', 'good', false, true, NOW);
    const before = await db.reviews.get('lc-1-two-sum');
    await recordAnswer('lc-1-two-sum', 'again', true, false, NOW);
    const after = await db.reviews.get('lc-1-two-sum');
    expect(after).toMatchObject({ due: before!.due, interval: before!.interval, lapses: 0, hintsUsed: 1 });
  });
});
