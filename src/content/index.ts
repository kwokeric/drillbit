import type { Card } from './schema';

// Every JSON file under /content is bundled at build time. A file holds one card or an array of cards.
// scripts/validate-content.ts checks them against the zod schema before every build.
const files = import.meta.glob<Card | Card[]>('/content/**/*.json', { eager: true, import: 'default' });

export const CARDS: Card[] = Object.keys(files)
  .sort()
  .flatMap((k) => files[k]);

export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export const ALL_TAGS = [...new Set(CARDS.flatMap((c) => c.tags))].sort();
