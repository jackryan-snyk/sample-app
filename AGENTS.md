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

### Snyk MCP server
- The Snyk MCP server is configured in `.cursor/mcp.json` (`snyk mcp -t stdio`). Cursor reads this file at startup, so adding/changing it requires reloading Cursor before the `Snyk` server and its tools (`snyk_code_scan`, `snyk_sca_scan`, `snyk_auth`, etc.) appear.
- It relies on the Snyk CLI being on `PATH`. The startup script installs it to `/usr/local/bin/snyk`. The usual `npx -y snyk@latest mcp -t stdio` does NOT work here: the `snyk` npm wrapper downloads its binary from `static.snyk.io`, which is blocked by this environment's network egress. The binary is instead fetched from GitHub release assets (`github.com/snyk/cli/releases`, which is reachable).
- The MCP server boots and lists tools without authentication, but actually running scans needs both a Snyk token (e.g. `SNYK_TOKEN`) and network access to Snyk hosts. `api.snyk.io` / `static.snyk.io` are currently blocked by network egress, so live scans fail with `SNYK-CLI-0022` network errors until those hosts are allowlisted in the cloud agent Network Access settings.
