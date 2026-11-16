import { useState } from 'react';
import { startSession } from '../app/nav';
import { BackHeader } from '../app/Shell';
import { ALL_TAGS, CARDS } from '../content/index';
import { buildCram } from '../session/session';

export function Cram() {
  const [tags, setTags] = useState<string[]>([]);
  const count = CARDS.filter((c) => c.tags.some((t) => tags.includes(t))).length;
  const toggle = (t: string) => setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <div className="page">
      <BackHeader title="Cram" />
      <p className="muted">Pick topics. You'll get every card with any of those tags, shuffled. Cramming doesn't change your schedule.</p>
      <div className="chips">
        {ALL_TAGS.map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>
            {t} <small>{CARDS.filter((c) => c.tags.includes(t)).length}</small>
          </button>
        ))}
      </div>
      <div className="sticky-cta">
        <button type="button" className="btn" disabled={!count} onClick={() => startSession(buildCram(CARDS, tags, Date.now()))}>
          {count ? `Start · ${count} card${count === 1 ? '' : 's'}` : 'Pick at least one tag'}
        </button>
      </div>
    </div>
  );
}
