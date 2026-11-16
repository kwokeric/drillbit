/**
 * Simplified SM-2 scheduler. Pure: next(state, grade, now) -> state.
 *
 *   Again  re-show this session, then 1 day   ease -0.20
 *   Hard   interval x 1.2                     ease -0.15
 *   Good   1d -> 3d -> interval x ease        ease unchanged
 *   Easy   Good interval x 1.3                ease +0.15
 *
 * Ease starts at 2.5 with a floor of 1.3. Intervals are whole days, and a card becomes due at the
 * start of its due day (local time), so "due today" doesn't depend on the hour you studied.
 */
export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy'];

export interface SrsState {
  /** Epoch ms when the card is next due. */
  due: number;
  /** Days. 0 for a card that has never been reviewed. */
  interval: number;
  ease: number;
  /** Consecutive successful reviews. */
  reps: number;
  lapses: number;
}

export const DAY = 86_400_000;
export const START_EASE = 2.5;
export const MIN_EASE = 1.3;

export const newState = (now: number): SrsState => ({ due: now, interval: 0, ease: START_EASE, reps: 0, lapses: 0 });

export function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Adds whole calendar days in local time (DST-safe) and returns the start of that day. */
export function addDays(t: number, days: number): number {
  const d = new Date(startOfDay(t));
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function goodInterval(s: SrsState): number {
  if (s.reps === 0) return 1;
  if (s.reps === 1) return 3;
  return Math.max(s.interval + 1, Math.round(s.interval * s.ease));
}

export function intervalFor(s: SrsState, grade: Grade): number {
  switch (grade) {
    case 'again':
      return 1;
    case 'hard':
      return Math.max(1, Math.round(Math.max(s.interval, 1) * 1.2));
    case 'good':
      return goodInterval(s);
    case 'easy': {
      const g = goodInterval(s);
      return Math.max(g + 1, Math.round(g * 1.3));
    }
  }
}

export function next(s: SrsState, grade: Grade, now: number): SrsState {
  const interval = intervalFor(s, grade);
  const delta = { again: -0.2, hard: -0.15, good: 0, easy: 0.15 }[grade];
  return {
    due: addDays(now, interval),
    interval,
    ease: Math.max(MIN_EASE, Math.round((s.ease + delta) * 100) / 100),
    reps: grade === 'again' ? 0 : s.reps + 1,
    lapses: grade === 'again' ? s.lapses + 1 : s.lapses,
  };
}

/** Label for a grade button: "1d", "3d", "2w", "4mo", "1.2y". */
export function formatInterval(days: number): string {
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
