import { useLiveQuery } from 'dexie-react-hooks';
import { Shell } from '../app/Shell';
import { CARDS } from '../content/index';
import { DECKS, deckOf, type Pattern } from '../content/schema';
import { db, dayKey, reviewMap, streak } from '../db/progress';
import { Meter } from '../lib/ui';
import { weakCards, weakness } from '../session/session';
import { addDays } from '../srs/schedule';
import { KNOWN_DAYS, topTags } from './Today';

export function Stats() {
  const data = useLiveQuery(async () => ({ reviews: await reviewMap(), logs: await db.log.toArray() }));
  if (!data) return <Shell tab="stats">{null}</Shell>;
  const { reviews, logs } = data;
  const now = Date.now();
  const days = streak(new Set(logs.filter((l) => l.reviews).map((l) => l.day)), now);
  const week = new Set(Array.from({ length: 7 }, (_, i) => dayKey(addDays(now, -i))));
  const thisWeek = logs.filter((l) => week.has(l.day));
  const weekReviews = thisWeek.reduce((n, l) => n + l.reviews, 0);
  const weekAgain = thisWeek.reduce((n, l) => n + l.again, 0);
  const weekHints = thisWeek.reduce((n, l) => n + l.hints, 0);
  const total = logs.reduce((n, l) => n + l.reviews, 0);

  // Which patterns cost you the most: lapses and hints on pattern cards, per pattern.
  const byPattern = new Map<Pattern, number>();
  for (const c of CARDS) {
    const r = reviews.get(c.id);
    if (c.kind !== 'pattern' || !r) continue;
    for (const p of c.patterns) byPattern.set(p, (byPattern.get(p) ?? 0) + weakness(r));
  }
  const weakPatterns = [...byPattern.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const weakTags = topTags(weakCards(CARDS, reviews, 50).flatMap((c) => c.tags), 6);

  return (
    <Shell tab="stats">
      <h1 className="page-title">Stats</h1>
      <div className="stat-tiles">
        <div>
          <b>{days}</b>
          <span>day streak</span>
        </div>
        <div>
          <b>{weekReviews}</b>
          <span>reviews, 7 days</span>
        </div>
        <div>
          <b>{weekReviews ? Math.round(((weekReviews - weekAgain) / weekReviews) * 100) + '%' : '–'}</b>
          <span>not Again, 7 days</span>
        </div>
      </div>
      <p className="muted small">
        {total} reviews all time · {weekHints} hint{weekHints === 1 ? '' : 's'} this week · {reviews.size} of {CARDS.length} cards seen
      </p>

      <section className="panel">
        <h2>By deck</h2>
        {DECKS.map((d) => {
          const cards = CARDS.filter((c) => deckOf(c) === d.id);
          const known = cards.filter((c) => (reviews.get(c.id)?.interval ?? 0) >= KNOWN_DAYS).length;
          const learning = cards.filter((c) => reviews.has(c.id)).length - known;
          return (
            <div key={d.id} className="deck-stat">
              <div className="deck-top">
                <b>{d.name}</b>
                <span>
                  {known} known · {learning} learning · {cards.length - known - learning} new
                </span>
              </div>
              <Meter value={cards.length ? known / cards.length : 0} color={d.color} />
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h2>Weakest patterns</h2>
        {weakPatterns.length ? (
          <ol className="plain ranked">
            {weakPatterns.map(([p, n]) => (
              <li key={p}>
                <span>{p}</span>
                <span className="muted small">score {n}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted small">Nothing yet. Patterns you miss or need hints for will show up here.</p>
        )}
      </section>

      {weakTags.length > 0 && (
        <section className="panel">
          <h2>Weak topics</h2>
          <div className="chips">
            {weakTags.map((t) => (
              <span key={t} className="pill">
                {t}
              </span>
            ))}
          </div>
          <p className="muted small">Weak spots on the Today screen drills these.</p>
        </section>
      )}
    </Shell>
  );
}
