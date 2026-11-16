import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { go } from '../app/nav';
import { CardView } from '../cards/CardView';
import { GradeBar } from '../cards/GradeBar';
import { CARD_BY_ID } from '../content/index';
import type { Card } from '../content/schema';
import { db, getMeta, recordAnswer, setMeta } from '../db/progress';
import { advance, isFinished, type Outcome, type Session } from '../session/session';
import { newState, type Grade, type SrsState } from '../srs/schedule';
import { Retry, ThumbsUp } from '../lib/icons';

export interface Summary extends Session {
  finishedAt: number;
}

export function SessionScreen() {
  const [session, setSession] = useState<Session | null>();
  const [toast, setToast] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    getMeta<Session>('session').then((s) => {
      if (!s) go('/');
      setSession(s ?? null);
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!session) return <div className="session" />;

  const card = CARD_BY_ID.get(session.queue[session.pos]);

  async function finish(s: Session) {
    await setMeta('lastSummary', { ...s, finishedAt: Date.now() } satisfies Summary);
    await db.meta.delete('session');
    go('/summary');
  }

  async function grade(g: Grade, hinted: boolean, outcome: Outcome) {
    if (!session || !card || busy.current) return;
    busy.current = true;
    try {
      await recordAnswer(card.id, g, hinted, session.schedule);
      const next = advance(session, { cardId: card.id, grade: g, hinted, outcome });
      if (isFinished(next)) return finish(next);
      await setMeta('session', next);
      setSession(next);
      if (g === 'again' && next.queue.length > session.queue.length) setToast('Back in the rotation, a few cards from now');
    } finally {
      busy.current = false;
    }
  }

  // A card removed from the content since the session was saved: skip it.
  if (!card) {
    const skipped = { ...session, pos: session.pos + 1 };
    if (isFinished(skipped)) finish(skipped);
    else setMeta('session', skipped).then(() => setSession(skipped));
    return <div className="session" />;
  }

  const progress = session.pos / session.queue.length;

  return (
    <div className="session">
      <div className="topbar">
        <button type="button" className="iconbtn" aria-label="Close session (progress is saved)" onClick={() => go('/')}>
          ✕
        </button>
        <div className="pbar" role="progressbar" aria-valuenow={session.pos} aria-valuemax={session.queue.length}>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="count">
          {session.pos + 1}/{session.queue.length}
        </span>
      </div>
      {!session.schedule && <p className="practice-tag">{session.label} · practice, schedule unchanged</p>}
      <CardRunner key={`${session.pos}-${card.id}`} card={card} schedule={session.schedule} onGrade={grade} />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

const SWIPE = 90;

/** One card's lifecycle: answer → reveal → grade. Remounted for every card so local state resets. */
function CardRunner({ card, schedule, onGrade }: { card: Card; schedule: boolean; onGrade: (g: Grade, hinted: boolean, o: Outcome) => void }) {
  const [hinted, setHinted] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [state, setState] = useState<SrsState>(() => newState(Date.now()));
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const answered = outcome !== null;

  useEffect(() => {
    db.reviews.get(card.id).then((r) => r && setState(r));
  }, [card.id]);

  const grade = (g: Grade) => onGrade(g, hinted, outcome ?? 'self');

  // Swipe right = Good, left = Again, once the answer is showing.
  const onDown = (e: PointerEvent) => {
    if (!answered || (e.target as HTMLElement).closest('.code, input, a, details')) return;
    drag.current = { x: e.clientX, y: e.clientY, active: false };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x;
    const my = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(my) > 12 && Math.abs(my) > Math.abs(mx)) return void (drag.current = null);
      if (Math.abs(mx) > 12) d.active = true;
    }
    if (d.active) setDx(mx);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.active && dx > SWIPE) grade('good');
    else if (d?.active && dx < -SWIPE) grade('again');
    setDx(0);
  };

  // Stamps fade in as you drag, fully visible at the commit threshold.
  const stampOpacity = Math.min(1, Math.abs(dx) / SWIPE);

  return (
    <div
      className={`stage ${dx ? 'dragging' : ''}`}
      style={dx ? { transform: `translateX(${dx}px) rotate(${dx / 40}deg)` } : undefined}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {dx > 0 && (
        <div className="stamp stamp-ok" style={{ opacity: stampOpacity }} aria-hidden>
          <ThumbsUp size={26} />
          OKAY
        </div>
      )}
      {dx < 0 && (
        <div className="stamp stamp-repeat" style={{ opacity: stampOpacity }} aria-hidden>
          <Retry size={26} />
          REPEAT
        </div>
      )}
      <CardView
        card={card}
        ctx={{
          hinted,
          onHint: () => setHinted(true),
          answered,
          onAnswer: setOutcome,
          gradeBar: <GradeBar state={state} schedule={schedule} onGrade={grade} />,
        }}
      />
    </div>
  );
}
