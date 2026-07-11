---
name: backend
description: Backend doctrine for Payload + Next.js + Postgres — collections/globals, access control, hooks, server actions/route handlers, migrations, validation, i18n localization, S3 media. Use when implementing data models, business logic, persistence, or server-side endpoints. Manager/Executor-tier.
disable-model-invocation: true
---

# Backend

Use for data models, persistence, access control, and server-side logic on the
baseline stack. Read first: `.cursor/core/rules/40-architecture-baseline.mdc`,
`.cursor/core/rules/30-test-strategy.mdc`.

## Payload data layer

- **One collection/global per concept.** Name fields explicitly; type via generated Payload types shared across the monorepo.
- **Localization (i18n always on):** mark user-facing text fields `localized: true`. Decide per field; don't localize identifiers/enums.
- **Access control is mandatory** on every collection (`read`/`create`/`update`/`delete`). Default deny; widen deliberately. Never rely on the UI to enforce access.
- **Hooks** (`beforeChange`, `afterChange`, etc.) for derived data and side effects — keep them pure and idempotent; push slow/external work to a job (don't block the request).
- **Migrations:** schema changes via Payload/Postgres migrations, forward-safe and reversible. Never mutate prod data destructively by default.

## Server endpoints

- Prefer **server actions / route handlers**; validate input at the boundary (zod or Payload validation) before touching data.
- Map errors to the Spec Contract `Errors` table — stable codes, user-safe messages, no internal leakage.
- **Slow/external/callback work** → stream or background job or webhook (see `event` / `http` skills), never a blocking sync POST > ~2s.
- **Media** always goes through the S3 adapter (MinIO local) — never local disk.

## Testing (test-first)

- **Unit:** validation, access rules, hook logic, error mapping.
- **Contract:** the endpoint/action request↔response shape and each error row.
- **Integration:** vertical slice against the local docker-compose Postgres + MinIO.
- E2E only if a Spec names a journey.

## Output

```txt
Backend plan — <feature>

Collections/globals: <name> — fields (localized?) — access rules
Endpoints: <action/route> — input validation — error rows
Hooks/jobs: <hook | job> — idempotency
Migration: <forward-safe steps | none>
Tests: unit / contract / integration list (traced to ACs)
```

## Anti-patterns

- Collections without access control.
- Business logic in the client; trusting client input.
- Blocking the request for slow/external work.
- Localizing the wrong fields, or forgetting i18n entirely.
- Writing uploads to local disk instead of S3.
- Destructive migrations without a reversible path.
