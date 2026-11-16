import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { go, startSession } from '../app/nav';
import { BackHeader, Shell } from '../app/Shell';
import { CARDS } from '../content/index';
import { DECKS, deckOf, type DeckId } from '../content/schema';
import { reviewMap, type ReviewRow } from '../db/progress';
import { Meter } from '../lib/ui';
import { buildDeck, buildSingle, isDue } from '../session/session';
import { addDays } from '../srs/schedule';
import { KNOWN_DAYS } from './Today';

export function Decks() {
  const reviews = useLiveQuery(reviewMap);
  if (!reviews) return <Shell tab="decks">{null}</Shell>;
  const now = Date.now();
  return (
    <Shell tab="decks">
      <h1 className="page-title">Decks</h1>
      <div className="decks">
        {DECKS.map((d) => {
          const cards = CARDS.filter((c) => deckOf(c) === d.id);
          const seen = cards.filter((c) => reviews.has(c.id)).length;
          const due = cards.filter((c) => reviews.has(c.id) && isDue(reviews.get(c.id)!, now)).length;
          const known = cards.filter((c) => (reviews.get(c.id)?.interval ?? 0) >= KNOWN_DAYS).length;
          return (
            <button key={d.id} type="button" className="deck" onClick={() => go('/deck/' + d.id)}>
              <div className="deck-top">
                <b>{d.name}</b>
                <span>{cards.length} cards</span>
              </div>
              <Meter value={cards.length ? known / cards.length : 0} color={d.color} />
              <div className="deck-sub">
                {due} due · {cards.length - seen} new · {known} known
              </div>
            </button>
          );
        })}
      </div>
      <p className="muted small">A card counts as known once it's scheduled a week or more out.</p>
    </Shell>
  );
}

function status(r: ReviewRow | undefined, now: number): [string, string] {
  if (!r) return ['new', 'st-new'];
  if (isDue(r, now)) return ['due', 'st-due'];
  const days = Math.round((r.due - addDays(now, 0)) / 86_400_000);
  return [`in ${days}d`, r.interval >= KNOWN_DAYS ? 'st-known' : ''];
}

export function DeckDetail({ id }: { id: DeckId }) {
  const reviews = useLiveQuery(reviewMap);
  const [q, setQ] = useState('');
  const deck = DECKS.find((d) => d.id === id);
  if (!deck) {
    go('/decks');
    return null;
  }
  if (!reviews) return null;
  const now = Date.now();
  const cards = CARDS.filter((c) => deckOf(c) === id);
  const needle = q.trim().toLowerCase();
  const shown = needle ? cards.filter((c) => (c.title + ' ' + c.tags.join(' ')).toLowerCase().includes(needle)) : cards;

  return (
    <div className="page">
      <BackHeader title={deck.name} to="/decks" />
      <button type="button" className="btn" onClick={() => startSession(buildDeck(CARDS, reviews, Date.now(), id, deck.name))}>
        Drill this deck
      </button>
      <input className="search" type="search" placeholder="Filter by title or tag" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter cards" />
      <ul className="cardlist">
        {shown.map((c) => {
          const [label, cls] = status(reviews.get(c.id), now);
          return (
            <li key={c.id}>
              <button type="button" onClick={() => startSession(buildSingle(c, Date.now()))}>
                <span className="cl-title">{c.title}</span>
                <span className="cl-tags">{c.tags.join(' · ')}</span>
                <span className={`cl-status ${cls}`}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="muted small">Tap a card to try it. A new card counts as learned the first time you answer it. Cards you've already seen keep their schedule.</p>
    </div>
  );
}
