# AGENTS.md

## Cursor Cloud specific instructions

This repo is a small single-service **Node.js + TypeScript (Express)** demo app: a PDF
upload/download web app used for Snyk security demos. There is no database, cache, queue,
or other external service — running it end-to-end requires only the one Node process.

Standard commands live in `package.json` and `README.md`. Key notes:

- **Build/run:** `npm run build` (runs `tsc`, emitting `index.js` in the repo root per
  `tsconfig.json` `outDir: "."`), then `node index.js`. The server listens on hardcoded
  port **3000** (`http://localhost:3000`).
- **`npm start` is broken — do not use it.** It points at `node dist/server.js`, but no
  `server.ts`/`server.js` exists and `tsc` outputs to the repo root, not `dist/`. Run the
  app with `node index.js` instead (as documented in `README.md`).
- **Tests:** `npm test` (Jest + ts-jest + Supertest, config inline in `package.json`).
  The `posttest` hook deletes the `uploads/` dir; the test fixtures `tests/test.pdf` and
  `tests/test.jpg` are intentionally 0-byte files.
- **No linter is configured** (no ESLint/Prettier/tslint). There is no lint command.
- The frontend (`public/index.html`) calls `GET /download` to list files, but the backend
  only implements `GET /download/:filename` — so the file list stays empty. This is a
  known cosmetic mismatch and does not affect the upload/download flow.
- This app intentionally contains a Path Traversal vulnerability in `/download/:filename`
  (for the Snyk demo). Do not "fix" it unless explicitly asked.
