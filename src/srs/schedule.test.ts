import { describe, expect, it } from 'vitest';
import { addDays, formatInterval, intervalFor, MIN_EASE, newState, next, startOfDay, type SrsState } from './schedule';

const NOW = new Date(2026, 10, 15, 20, 30).getTime();

describe('next()', () => {
  it('Good on a new card: 1 day, then 3, then interval x ease', () => {
    let s = next(newState(NOW), 'good', NOW);
    expect(s.interval).toBe(1);
    s = next(s, 'good', NOW);
    expect(s.interval).toBe(3);
    s = next(s, 'good', NOW);
    expect(s.interval).toBe(Math.round(3 * 2.5));
    expect(s.reps).toBe(3);
    expect(s.ease).toBe(2.5);
  });

  it('due lands at the start of a local day', () => {
    const s = next(newState(NOW), 'good', NOW);
    expect(s.due).toBe(addDays(NOW, 1));
    expect(s.due).toBe(startOfDay(s.due));
    expect(new Date(s.due).getDate()).toBe(16);
  });

  it('Again resets reps, counts a lapse, drops ease and comes back tomorrow', () => {
    const mature: SrsState = { due: NOW, interval: 30, ease: 2.5, reps: 5, lapses: 0 };
    expect(next(mature, 'again', NOW)).toMatchObject({ interval: 1, reps: 0, lapses: 1, ease: 2.3 });
  });

  it('Hard grows the interval by 1.2 and lowers ease', () => {
    const s = next({ due: NOW, interval: 10, ease: 2.5, reps: 3, lapses: 0 }, 'hard', NOW);
    expect(s.interval).toBe(12);
    expect(s.ease).toBe(2.35);
  });

  it('Easy beats Good and raises ease', () => {
    const st: SrsState = { due: NOW, interval: 10, ease: 2.5, reps: 3, lapses: 0 };
    expect(intervalFor(st, 'easy')).toBeGreaterThan(intervalFor(st, 'good'));
    expect(next(st, 'easy', NOW).ease).toBe(2.65);
    expect(intervalFor(newState(NOW), 'easy')).toBe(2);
  });

  it('ease never drops below the floor', () => {
    let s = newState(NOW);
    for (let i = 0; i < 20; i++) s = next(s, 'again', NOW);
    expect(s.ease).toBe(MIN_EASE);
  });

  it('a better grade never gives a shorter interval', () => {
    const states: SrsState[] = [newState(NOW), { due: NOW, interval: 3, ease: 1.3, reps: 2, lapses: 4 }, { due: NOW, interval: 40, ease: 2.8, reps: 6, lapses: 0 }];
    for (const st of states) {
      const [a, h, g, e] = (['again', 'hard', 'good', 'easy'] as const).map((gr) => intervalFor(st, gr));
      expect(a).toBeLessThanOrEqual(h);
      expect(h).toBeLessThanOrEqual(g);
      expect(g).toBeLessThan(e);
    }
  });
});

describe('formatInterval()', () => {
  it('formats days, weeks, months and years', () => {
    expect(formatInterval(1)).toBe('1d');
    expect(formatInterval(21)).toBe('3w');
    expect(formatInterval(90)).toBe('3mo');
    expect(formatInterval(500)).toBe('1.4y');
  });
});
