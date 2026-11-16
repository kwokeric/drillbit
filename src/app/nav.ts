import { useEffect, useState } from 'react';
import { getMeta, setMeta } from '../db/progress';
import type { Session } from '../session/session';

/** Hash routes, so the Android back button and refresh work on a static host: #/, #/decks, #/deck/bug, #/session … */
export function useRoute(): string[] {
  const read = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => {
  location.hash = path;
};

/** Saves the session and opens it. Asks first if it would replace a session that's partly done. */
export async function startSession(s: Session): Promise<void> {
  if (!s.queue.length) return;
  const active = await getMeta<Session>('session');
  if (active && active.results.length && !confirm(`Discard your ${active.label} session in progress?`)) return;
  await setMeta('session', s);
  go('/session');
}
