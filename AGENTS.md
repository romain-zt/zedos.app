# AGENTS.md

## Cursor Cloud specific instructions

### Services Overview

| Service | How to Start | Port |
|---------|-------------|------|
| PostgreSQL 16 | `sudo docker compose -f apps/web/docker-compose.yml up -d postgres` | 5433 |
| Next.js dev server | `pnpm dev` (from workspace root, runs via Turborepo) | 3000 |

### Prerequisites (already handled by the update script)

- Node.js 22+ (pre-installed)
- pnpm 10.33.3 (`packageManager` field in root `package.json`)
- Docker (for PostgreSQL)

### Starting the dev environment

1. Start Docker if not running: `sudo dockerd &>/dev/null &`
2. Start PostgreSQL: `docker compose -f apps/web/docker-compose.yml up -d postgres --wait`
3. Run migrations (idempotent, Drizzle CLI only): `cd packages/db && pnpm db:migrate`
   - Do not hand-write migration SQL; use `pnpm generate` after schema edits (see `.cursor/rules/75-drizzle.mdc` §4).
5. Start dev server: `pnpm dev` (from workspace root)

### Environment files

- `apps/web/.env` — main app config (DATABASE_URL, auth secrets, Stripe, AI keys)
- `packages/db/.env` — DATABASE_URL for Drizzle migrations
- Both point to: `postgresql://zedos_test:zedos_test@localhost:5433/zedos_test`

### Key commands (reference `package.json` scripts)

- **Lint**: `pnpm lint` (workspace root)
- **Typecheck**: `pnpm typecheck` (workspace root)
- **Unit tests**: `pnpm test` (workspace root — runs Vitest across all packages)
- **Integration tests**: `pnpm --filter @repo/web test:integration` (needs running DB)
- **E2E tests**: `pnpm --filter @repo/web test:e2e` (needs Playwright browsers + running app)
- **DB migrations**: `cd packages/db && pnpm db:migrate`
- **DB studio**: `cd packages/db && pnpm db:studio`

### Non-obvious gotchas

- The `pnpm-workspace.yaml` uses `allowBuilds` for `es5-ext`, `esbuild`, and `unrs-resolver`. Other packages (like `@prisma/client`) have blocked build scripts — this is intentional and does not break anything.
- Docker must use `fuse-overlayfs` storage driver and `iptables-legacy` in Cloud Agent VMs (nested container environment).
- The `docker-compose.yml` has an obsolete `version` attribute that produces a warning — ignore it.
- The dev database uses port **5433** (not default 5432) to avoid conflicts.
- External API keys (Stripe, AbacusAI, Resend) can be placeholders for local dev — the app starts fine without valid keys but AI/payment features will fail at runtime.
- `E2E_MODE=true` enables deterministic stubs for Stripe and AI in Playwright tests.
