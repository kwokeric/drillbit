import { useLiveQuery } from 'dexie-react-hooks';
import { go, startSession } from '../app/nav';
import { Shell } from '../app/Shell';
import { CARDS } from '../content/index';
import { DECKS, deckOf } from '../content/schema';
import { db, dayKey, getMeta, getSettings, reviewMap, streak } from '../db/progress';
import { Meter } from '../lib/ui';
import { Gear } from '../lib/icons';
import { buildDaily, buildExtra, buildWeak, dailyPlan, estimateMinutes, weakCards, type Session } from '../session/session';

/** A card counts as known once its interval reaches a week. */
export const KNOWN_DAYS = 7;

export function Today() {
  const data = useLiveQuery(async () => {
    const now = Date.now();
    const [reviews, settings, today, logs, active] = await Promise.all([
      reviewMap(),
      getSettings(),
      db.log.get(dayKey(now)),
      db.log.toArray(),
      getMeta<Session>('session'),
    ]);
    return { now, reviews, settings, newToday: today?.newCards ?? 0, reviewedToday: today?.reviews ?? 0, days: new Set(logs.filter((l) => l.reviews).map((l) => l.day)), active };
  });
  if (!data) return <Shell tab="">{null}</Shell>;

  const { now, reviews, settings, newToday, active } = data;
  const { due, fresh } = dailyPlan(CARDS, reviews, now, settings.newPerDay, newToday);
  const total = due.length + fresh.length;
  const weak = weakCards(CARDS, reviews);
  const weakTags = topTags(weak.flatMap((c) => c.tags), 2);
  const days = streak(data.days, now);
  const unseen = CARDS.filter((c) => !reviews.has(c.id)).length;

  return (
    <Shell tab="">
      <div className="hello">
        <h1>Today</h1>
        <div className="hello-right">
          {days > 0 && <span className="streak">{days}-day streak</span>}
          <button type="button" className="iconbtn" aria-label="Settings" onClick={() => go('/settings')}>
            <Gear />
          </button>
        </div>
      </div>

      {active && active.pos < active.queue.length && (
        <div className="resume">
          <div>
            <b>{active.label}</b>
            <span>
              {active.pos} of {active.queue.length} done
            </span>
          </div>
          <button type="button" className="btn small" onClick={() => go('/session')}>
            Resume
          </button>
        </div>
      )}

      <section className="today">
        {total > 0 ? (
          <>
            <div className="nums">
              <div>
                <b>{due.length}</b>
                <span>due</span>
              </div>
              <div>
                <b>{fresh.length}</b>
                <span>new</span>
              </div>
              <div>
                <b>~{estimateMinutes(total)}</b>
                <span>min</span>
              </div>
            </div>
            <button type="button" className="go" onClick={() => startSession(buildDaily(CARDS, reviews, Date.now(), settings.newPerDay, newToday))}>
              Start session
            </button>
          </>
        ) : (
          <>
            <p className="done-msg">
              <b>All caught up.</b> {data.reviewedToday ? `${data.reviewedToday} reviews today. ` : ''}Come back tomorrow.
            </p>
            {unseen > 0 && (
              <button type="button" className="go" onClick={() => startSession(buildExtra(CARDS, reviews, Date.now(), 5))}>
                Learn {Math.min(5, unseen)} more new cards
              </button>
            )}
          </>
        )}
      </section>

      <div className="decks">
        {DECKS.map((d) => {
          const cards = CARDS.filter((c) => deckOf(c) === d.id);
          const known = cards.filter((c) => (reviews.get(c.id)?.interval ?? 0) >= KNOWN_DAYS).length;
          return (
            <button key={d.id} type="button" className="deck" onClick={() => go('/deck/' + d.id)}>
              <div className="deck-top">
                <b>{d.name}</b>
                <span>
                  {known} / {cards.length} known
                </span>
              </div>
              <Meter value={cards.length ? known / cards.length : 0} color={d.color} />
            </button>
          );
        })}
      </div>

      <div className="minis">
        <button type="button" className="mini" disabled={!weak.length} onClick={() => startSession(buildWeak(CARDS, reviews, Date.now()))}>
          <b>Weak spots</b>
          {weak.length ? `${weak.length} cards · ${weakTags.join(', ')}` : 'Cards you miss or need hints on show up here'}
        </button>
        <button type="button" className="mini" onClick={() => go('/cram')}>
          <b>Cram</b>
          Pick tags, ignore the schedule
        </button>
      </div>
    </Shell>
  );
}

export function topTags(tags: string[], n: number): string[] {
  const count = new Map<string, number>();
  for (const t of tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t);
}
