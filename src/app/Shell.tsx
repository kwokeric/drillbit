import type { ReactNode } from 'react';
import { go } from './nav';

const TABS = [
  ['', 'Today'],
  ['decks', 'Decks'],
  ['stats', 'Stats'],
] as const;

/** Page layout with the bottom tab bar. */
export function Shell({ tab, children }: { tab: string; children: ReactNode }) {
  return (
    <div className="shell">
      <main className="page">{children}</main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map(([path, label]) => (
          <button key={path} type="button" className={tab === path ? 'on' : ''} aria-current={tab === path ? 'page' : undefined} onClick={() => go('/' + path)}>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function BackHeader({ title, to = '/' }: { title: string; to?: string }) {
  return (
    <header className="backhead">
      <button type="button" className="iconbtn" aria-label="Back" onClick={() => (history.length > 1 ? history.back() : go(to))}>
        ←
      </button>
      <h1>{title}</h1>
    </header>
  );
}
