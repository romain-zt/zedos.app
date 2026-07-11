# Apps catalog — pick only what you need

This is a **monorepo template**. Keep the monorepo shape, but only scaffold the
apps your project actually targets (see `05-project-setup.mdc` and the
`## Apps` section of `docs/project.config.md`). Dropping an unused app is just
`rm -rf apps/<name>` — the pnpm workspace glob (`apps/*`) and CI adapt.

| App | Folder | Pick it when… | Skip it when… |
|-----|--------|---------------|---------------|
| **web** | `apps/web` | You have any buyer/visitor-facing surface (storefront, marketing, app UI). | Headless/API-only product. |
| **cms** | `apps/cms` | Content or catalog is edited by humans and stored in Payload (products, pages, media). | No editable content; data comes only from external systems. |
| **api** (optional, add when needed) | `apps/api` | You need a standalone backend/service surface separate from `web`/`cms` (webhooks, integrations, jobs). | `web` route handlers + `cms` cover all server needs. |

## Rules

- **Default to the fewest apps.** A single-surface product is often just `apps/web`
  (with route handlers for the little server logic it needs) — you do **not** need
  `cms` or a separate `api` "just in case".
- **Add, don't pre-build.** When a slice needs a new surface, add the app then,
  reuse the shared `packages/*`, and record it in `docs/project.config.md`
  (and a PD if it's a cross-cutting decision).
- **Shared code lives in `packages/*`**, not duplicated per app.
- Whatever you pick, the **first delivered slice still ships a visible page**
  (`05-project-setup.mdc` §2).
