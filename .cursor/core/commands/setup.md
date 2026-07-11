---
description: "/setup — run the always-first project setup phase: pin a clean up-to-date stack + minimal v0 catalog, pick the apps, and ship a visible first page."
---

# /setup — project setup (always first)

Establishes the foundation every feature depends on. Governed by `.cursor/core/rules/05-project-setup.mdc`. This is the `setup` pipeline step.

## When

- At project bootstrap (before any `/feature-area` / `/implement` work).
- Whenever the `setup` step is `todo`. Feature steps stay gated until `setup` is `complete`.

## Steps

1. **Read** `docs/project.config.md` (identity, stack overrides, **Apps** selection, v0 boundary) and `40-architecture-baseline.mdc`.
2. **Stack.** Fork `.cursor/core/templates/starter-monorepo/`. Resolve the pnpm **catalog** to the latest stable releases (review breaking changes; don't blind-bump). Keep the catalog **minimal** — only what v0 needs.
3. **Pick apps.** Scaffold only the apps listed under `## Apps` in `docs/project.config.md` (see `apps/CATALOG.md`). Delete unused `apps/<name>` folders. Keep the monorepo.
4. **Clean code on.** Confirm `50/51/52` code rules load and `quality` (typecheck + lint + test + build) is green.
5. **Local infra.** `docker compose up` + `.env` from `.env.example` runs the stack.
6. **First page.** Ship a deployable, semantic, mobile-first home page that renders with an empty DB. Wire the deploy target so it is actually reachable.
7. **Finish.** `status-log.ts set "setup" complete`, update `HANDOFF.md`, open/ready the tracking PR.

## Done criteria

- pnpm catalog pinned to current stable; only targeted apps present; `quality` green.
- `docker compose up` + `.env.example` is enough to run locally.
- A visible first page is deployed/reachable.
- `setup` recorded `complete` in the append-only status log.

If a setup decision needs a human (deploy creds, which apps, a stack deviation) → `blocked` + `NEED_HUMAN:`; do not guess.
