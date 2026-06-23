# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single small product: `foo-bar-app`, an Express + TypeScript web app for uploading PDFs and downloading them later. Uploaded files are stored on the local filesystem under `uploads/` (created at runtime) — there is no database or external service.

### Build / run (non-obvious gotchas)
- The build output path is **not** `dist/`. `tsconfig.json` sets `outDir: "."`, so `npm run build` (`tsc`) compiles `index.ts` into `index.js` in the repo root.
- The `start` script in `package.json` (`node dist/server.js`) and `main` (`dist/index.js`) are **stale/incorrect** — `dist/server.js` does not exist. Run the app the way the README documents instead: `npm run build` then `node index.js`. It listens on http://localhost:3000 (port is hardcoded).
- After editing `index.ts`, you must re-run `npm run build` (`tsc`) before `node index.js` picks up changes; there is no watch/hot-reload script.

### Test
- `npm test` runs Jest (via `ts-jest`). A `posttest` step deletes the `uploads/` directory.
- The fixture `tests/test.pdf` is an empty (0-byte) file, so a curl upload/download round-trip with it trivially "matches". For meaningful manual verification, upload a real non-empty PDF.

### Lint
- No linter is configured (no ESLint/Prettier, no `lint` script).

### Note
- The app intentionally contains a path-traversal vulnerability in `GET /download/:filename` (it's a Snyk demo app). Do not treat that as a bug to fix unless asked.
