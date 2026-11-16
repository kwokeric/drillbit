import Dexie, { type EntityTable } from 'dexie';
import { z } from 'zod';
import { newState, next, startOfDay, type Grade, type SrsState } from '../srs/schedule';

/** One row per card you've seen. */
export interface ReviewRow extends SrsState {
  cardId: string;
  hintsUsed: number;
  lastReviewed: number;
}

/** One row per calendar day you studied. `day` is YYYY-MM-DD in local time. */
export interface LogRow {
  day: string;
  reviews: number;
  again: number;
  hints: number;
  /** Cards seen for the first time that day (in scheduled sessions). Caps the daily new-card limit. */
  newCards: number;
}

interface MetaRow {
  key: string;
  value: unknown;
}

export const db = new Dexie('drillbit') as Dexie & {
  reviews: EntityTable<ReviewRow, 'cardId'>;
  log: EntityTable<LogRow, 'day'>;
  meta: EntityTable<MetaRow, 'key'>;
};
db.version(1).stores({ reviews: 'cardId, due', log: 'day', meta: 'key' });

export const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ---------- settings & session state ---------- */

export interface Settings {
  newPerDay: number;
}
export const DEFAULT_SETTINGS: Settings = { newPerDay: 5 };

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}
export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value });
}
export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await getMeta<Partial<Settings>>('settings')) };
}

/* ---------- reviews ---------- */

export async function reviewMap(): Promise<Map<string, ReviewRow>> {
  return new Map((await db.reviews.toArray()).map((r) => [r.cardId, r]));
}

/**
 * Records one answer. With `schedule: false` (Cram, Weak spots, practice) the card's schedule is left alone,
 * but hints and the daily log are still counted.
 */
export async function recordAnswer(cardId: string, grade: Grade, hinted: boolean, schedule: boolean, now = Date.now()) {
  await db.transaction('rw', db.reviews, db.log, async () => {
    const prev = await db.reviews.get(cardId);
    const isNew = !prev;
    const base: ReviewRow = prev ?? { cardId, ...newState(now), hintsUsed: 0, lastReviewed: 0 };
    const srs = schedule ? next(base, grade, now) : {};
    if (schedule || prev) {
      await db.reviews.put({ ...base, ...srs, hintsUsed: base.hintsUsed + (hinted ? 1 : 0), lastReviewed: now });
    }
    const day = dayKey(now);
    const log = (await db.log.get(day)) ?? { day, reviews: 0, again: 0, hints: 0, newCards: 0 };
    log.reviews++;
    if (grade === 'again') log.again++;
    if (hinted) log.hints++;
    if (schedule && isNew) log.newCards++;
    await db.log.put(log);
  });
}

/** Consecutive days with at least one review, ending today (or yesterday, if you haven't studied yet today). */
export function streak(days: Set<string>, now = Date.now()): number {
  let t = startOfDay(now);
  if (!days.has(dayKey(t))) t = new Date(t).setDate(new Date(t).getDate() - 1);
  let n = 0;
  while (days.has(dayKey(t))) {
    n++;
    t = new Date(t).setDate(new Date(t).getDate() - 1);
  }
  return n;
}

/* ---------- backup ---------- */

const ExportFile = z.object({
  app: z.literal('drillbit'),
  version: z.literal(1),
  exportedAt: z.string(),
  reviews: z.array(
    z.object({
      cardId: z.string(),
      due: z.number(),
      interval: z.number(),
      ease: z.number(),
      reps: z.number(),
      lapses: z.number(),
      hintsUsed: z.number(),
      lastReviewed: z.number(),
    }),
  ),
  log: z.array(z.object({ day: z.string(), reviews: z.number(), again: z.number(), hints: z.number(), newCards: z.number() })),
  settings: z.object({ newPerDay: z.number() }).partial().optional(),
});

export async function exportProgress(): Promise<string> {
  const data: z.infer<typeof ExportFile> = {
    app: 'drillbit',
    version: 1,
    exportedAt: new Date().toISOString(),
    reviews: await db.reviews.toArray(),
    log: await db.log.toArray(),
    settings: await getSettings(),
  };
  return JSON.stringify(data, null, 1);
}

/** Replaces all progress with the file's contents. Throws with a readable message if the file isn't a Drillbit export. */
export async function importProgress(text: string): Promise<number> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const res = ExportFile.safeParse(json);
  if (!res.success) throw new Error("That file isn't a Drillbit backup.");
  await db.transaction('rw', db.reviews, db.log, db.meta, async () => {
    await db.reviews.clear();
    await db.log.clear();
    await db.reviews.bulkPut(res.data.reviews);
    await db.log.bulkPut(res.data.log);
    if (res.data.settings) await setMeta('settings', res.data.settings);
    await db.meta.delete('session');
  });
  return res.data.reviews.length;
}

export async function resetProgress() {
  await db.transaction('rw', db.reviews, db.log, db.meta, async () => {
    await db.reviews.clear();
    await db.log.clear();
    await db.meta.delete('session');
    await db.meta.delete('lastSummary');
  });
}
