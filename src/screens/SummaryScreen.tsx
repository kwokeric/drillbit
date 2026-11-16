import { useLiveQuery } from 'dexie-react-hooks';
import { go } from '../app/nav';
import { CARD_BY_ID, CARDS } from '../content/index';
import { getMeta, reviewMap } from '../db/progress';
import { Meter } from '../lib/ui';
import { dueCards } from '../session/session';
import { addDays } from '../srs/schedule';
import type { Summary } from './SessionScreen';

export function SummaryScreen() {
  const data = useLiveQuery(async () => ({ s: await getMeta<Summary>('lastSummary'), reviews: await reviewMap() }));
  if (!data) return null;
  const { s, reviews } = data;
  if (!s) {
    go('/');
    return null;
  }

  const results = s.results;
  const unique = new Set(results.map((r) => r.cardId)).size;
  const checked = results.filter((r) => r.outcome !== 'self');
  const right = checked.filter((r) => r.outcome === 'correct').length;
  const hints = results.filter((r) => r.hinted).length;
  const mins = Math.max(1, Math.round((s.finishedAt - s.startedAt) / 60000));
  const missed = [...new Set(results.filter((r) => r.grade === 'again').map((r) => r.cardId))].map((id) => CARD_BY_ID.get(id)).filter(Boolean);
  const tomorrow = dueCards(CARDS, reviews, addDays(Date.now(), 1)).length;

  return (
    <div className="page summary">
      <header className="sum-head">
        <span className="eyebrow">{s.label} · done</span>
        <h1>
          {unique} card{unique === 1 ? '' : 's'} in {mins} min
        </h1>
        {!s.schedule && <p className="muted">Practice session: your schedule didn't change.</p>}
      </header>

      <div className="stat-tiles">
        <div>
          <b>{checked.length ? `${right}/${checked.length}` : '–'}</b>
          <span>auto-checked right</span>
        </div>
        <div>
          <b>{hints}</b>
          <span>hint{hints === 1 ? '' : 's'} used</span>
        </div>
        <div>
          <b>{tomorrow}</b>
          <span>due tomorrow</span>
        </div>
      </div>

      <section className="panel">
        <h2>How it went</h2>
        {(
          [
            ['Okay', results.filter((r) => r.grade !== 'again').length, 'var(--ok)'],
            ['Repeat', results.filter((r) => r.grade === 'again').length, 'var(--bad)'],
          ] as const
        ).map(([label, n, color]) => (
          <div key={label} className="grade-row">
            <span>{label}</span>
            <Meter value={results.length ? n / results.length : 0} color={color} />
            <b>{n}</b>
          </div>
        ))}
      </section>

      {missed.length > 0 && (
        <section className="panel">
          <h2>Marked repeat</h2>
          <ul className="plain">
            {missed.map((c) => (
              <li key={c!.id}>{c!.title}</li>
            ))}
          </ul>
          {s.schedule && <p className="muted small">They'll be back tomorrow.</p>}
        </section>
      )}

      <button type="button" className="btn" onClick={() => go('/')}>
        Done
      </button>
    </div>
  );
}
