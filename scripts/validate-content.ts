import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ContentFile } from '../src/content/schema';

const root = join(import.meta.dirname, '..', 'content');
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : [];
  });

let errors = 0;
let count = 0;
const ids = new Map<string, string>();
const kinds: Record<string, number> = {};
const noHint: string[] = [];

for (const file of walk(root)) {
  const rel = relative(root, file);
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`x ${rel}: invalid JSON (${(e as Error).message})`);
    errors++;
    continue;
  }
  const res = ContentFile.safeParse(json);
  if (!res.success) {
    for (const issue of res.error.issues) console.error(`x ${rel} -> ${issue.path.join('.')}: ${issue.message}`);
    errors += res.error.issues.length;
    continue;
  }
  for (const card of Array.isArray(res.data) ? res.data : [res.data]) {
    count++;
    kinds[card.kind] = (kinds[card.kind] ?? 0) + 1;
    if (ids.has(card.id)) {
      console.error(`x ${rel}: duplicate id "${card.id}" (also in ${ids.get(card.id)})`);
      errors++;
    }
    ids.set(card.id, rel);
    if (!card.hint) noHint.push(card.id);
  }
}

if (noHint.length) console.warn(`! ${noHint.length} card(s) have no written hint and will get an automatic one: ${noHint.join(', ')}`);
if (errors) {
  console.error(`\n${errors} problem(s). Fix them before building.`);
  process.exit(1);
}
console.log(`ok: ${count} cards ${JSON.stringify(kinds)}`);
