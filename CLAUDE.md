# CLAUDE.md

bb plugin (`boat-sandbox`) that runs bb threads and machines on Boat (boat.dev)
sandboxes. TypeScript, ESM, Node 26. See README.md for user-facing behavior.

## Commands

```sh
npm ci
npm run typecheck   # tsc --noEmit, strict
npm test            # vitest; in-memory fake Boat API, no network
bb plugin build .   # rebuilds dist/ (needs the bb CLI)
```

CI (`.github/workflows/test.yml`) runs typecheck and tests on every PR.

## Layout

| Path | Role |
| --- | --- |
| `server.ts` | Plugin entry: settings, idle/auto-stop check (every minute), ACP agent registration |
| `src/backend.ts` | create, suspend, resume, remove, reconcile cleanup |
| `src/boat-client.ts` | Boat REST client; drops addresses and URLs at parse time |
| `src/executor.ts` | bb command executor on Boat's detached command API |
| `src/configuration.ts` | Setting descriptors and `resolveSettings` |
| `src/acp-agents.ts` | Kimi Code and Mistral Vibe entries for bb's ACP providers plugin |
| `src/register.ts`, `src/sandbox-backend.ts` | Adapted from bb's Modal sandbox plugin (keep the MIT notice) |
| `skills/boat-sandboxes/SKILL.md` | Skill shipped with the plugin for bb agents |
| `test/fake-boat.ts` | In-memory Boat API used by all tests |

## Rules

- `dist/` is committed because `bb plugin install git:…` runs it. Rebuild with
  `bb plugin build .` and commit `dist/` with every source change.
- Tests never touch the network: extend `test/fake-boat.ts` for new endpoints.
  Inject `fetch`, `now` and `sleep` through deps instead of using globals.
- Never log or put the Boat `apiKey` in a command line; stdin goes through a
  mode-600 temp file (see `src/executor.ts`).
- Keep README.md, the settings table and `skills/boat-sandboxes/SKILL.md` in
  sync when behavior or settings change.
- Imports use `.js` extensions (ESM, `moduleResolution: bundler`).
