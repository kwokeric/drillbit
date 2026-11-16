# Drillbit

Interview-prep cue cards for your phone: spot the bug, JS/TS fundamentals, LeetCode patterns and one-liners, scheduled with spaced repetition. Works offline. No accounts, no backend.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm test
npm run build      # validates content, type-checks, builds dist/
```

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel, choose **Add New → Project**, import the repo, and keep the detected Vite settings (build `npm run build`, output `dist`).
3. Open the URL on your phone and choose **Add to Home Screen**. On iPhone this also stops Safari from clearing your progress after 7 days without a visit.

Every push to `main` redeploys.

## Adding cards

Cards are JSON files in `content/`. The schema is in `src/content/schema.ts`, and the authoring rules are in `CLAUDE.md`. Either:

- edit a file on GitHub (the mobile web editor works) and commit, or
- ask Claude Code, on your computer or at claude.ai/code from your phone, something like "draft 6 sliding-window pattern cards with hints". It writes the files and runs the checks, then you review and merge.

A malformed card fails `npm run validate`, so it never reaches the deployed app.

## Your progress

Progress is stored in IndexedDB on the device. Use **Settings → Export** now and then. **Import** restores a backup on any device.
