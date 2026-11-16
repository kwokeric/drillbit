# Drillbit

Phone-first PWA of interview-prep cards: spot the bug, JS/TS fundamentals, algorithm patterns, one-liners. Static site with no backend. The design plan is `design/drillbit-plan.html`.

## Commands

- `npm run dev`: local dev server
- `npm test`: vitest (scheduler, session builders, hint/one-liner checks over all seed content)
- `npm run validate`: zod check of every file in `content/` (also runs as the first step of `npm run build`)
- `npm run build`: validate, type-check, then build to `dist/`

## Layout

- `content/<deck>/*.json`: the cards. A file holds one card or an array of cards. Schema: `src/content/schema.ts`.
- `src/srs/schedule.ts`: pure SM-2 scheduler, `next(state, grade, now)`.
- `src/session/session.ts`: pure session builders (daily, deck, weak, cram) and `advance()`.
- `src/db/progress.ts`: Dexie (IndexedDB). Progress only, never content.
- `src/cards/`: one component per card kind, sharing `CardFrame` (header, hint, reveal, dock).
- `src/screens/`: Today, Session, Summary, Decks, Stats, Settings, Cram. Hash routing in `src/app/nav.ts`.

## Writing cards

When asked to draft cards, write them straight into `content/` and run `npm run validate` and `npm test`.

- `id`: kebab-case and unique. Prefixes: `bug-`, `js-`, `ts-`, `lc-<number>-`, `one-`.
- `prompt` and `explanation` may use inline HTML: `<code>`, `<b>`, `<i>`, `<br>`. Code fields (`code`, `fix`, `accept`) are plain text.
- Always write a `hint`. It should point at the idea without naming the answer. Card types without one get an automatic hint, which is weaker.
- **bug**: 5–10 lines with exactly one real bug. `bugLines` are 1-indexed and the first one is the root cause. Optional `symptomLines` are where the symptom shows (tapping one gives "close"). The prompt states the symptom, not the cause.
- **mcq**: 3–4 choices, each plausible. Explain why the wrong ones are wrong.
- **flip**: an open question answered from memory. Keep the explanation to 2–3 sentences.
- **pattern**: summarize the LeetCode problem in 1–2 sentences in your own words. Never copy the problem statement. `patterns` must come from `PATTERNS` in the schema. 2–4 `steps`.
- **oneliner**: list every common correct spelling in `accept` (matching ignores whitespace, quote style, a trailing `;`, and `(x) =>` vs `x =>`). Put common wrong answers in `traps` with a `why`.
- Check every code claim by actually running it in Node when there's any doubt.
