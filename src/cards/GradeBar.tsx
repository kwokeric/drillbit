import { useEffect } from 'react';
import { Retry, ThumbsUp } from '../lib/icons';
import { formatInterval, intervalFor, type Grade, type SrsState } from '../srs/schedule';

interface Props {
  state: SrsState;
  /** false in practice sessions: grades don't change the schedule. */
  schedule: boolean;
  onGrade: (g: Grade) => void;
}

/**
 * Two choices. Repeat = put it back in this session's rotation (and see it again tomorrow).
 * Okay = done for now; the scheduler pushes it out further.
 */
export function GradeBar({ state, schedule, onGrade }: Props) {
  // Desktop: ← or 1 = Repeat, → or 2 = Okay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      if (e.key === 'ArrowLeft' || e.key === '1') onGrade('again');
      if (e.key === 'ArrowRight' || e.key === '2') onGrade('good');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const okSub = schedule ? `next in ${formatInterval(intervalFor(state, 'good'))}` : "won't come back";
  return (
    <div className="gradebar">
      <div className="grades">
        <button type="button" className="grade again" onClick={() => onGrade('again')}>
          <Retry />
          <span>
            Repeat<small>shows again soon</small>
          </span>
        </button>
        <button type="button" className="grade good" onClick={() => onGrade('good')}>
          <ThumbsUp />
          <span>
            Okay<small>{okSub}</small>
          </span>
        </button>
      </div>
      <p className="hint">or swipe: left to repeat, right if okay</p>
    </div>
  );
}
