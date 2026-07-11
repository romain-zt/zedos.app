# Starter Monorepo — next-forge direction + Payload (i18n + S3)

A clonable skeleton that encodes the architecture baseline
(`.cursor/core/rules/40-architecture-baseline.mdc`). Fork it to start a project fast.

## What's wired

- **Monorepo** — pnpm workspaces + Turborepo (next-forge structure & quality direction).
- **`apps/cms`** — Next.js + **Payload 3** (Next-native), with:
  - **Postgres** adapter (`@payloadcms/db-postgres`)
  - **S3 media** (`@payloadcms/storage-s3`) → MinIO locally, real S3 in prod
  - **i18n always on** — Payload localization (`en` default + `fr`) + admin i18n
- **`apps/web`** — Next.js front-end placeholder that reads from the CMS. Base/static
  assets (logo, favicon, placeholders) are committed in **`apps/web/public/`** so the app
  renders real assets with an empty media bucket (see `05-project-setup.mdc` §2.5).
- **`packages/typescript-config`** — shared tsconfig.
- **`docker-compose.yml`** — Postgres + MinIO + a one-shot bucket creator.
- **Seed** — add a seed script (`pnpm --filter cms seed`) that populates Payload with
  starter content so the first page renders meaningfully with an empty DB.

## Quick start

```bash
# 1. fork/copy this folder to your new repo root
cp -R .cursor/core/templates/starter-monorepo my-project && cd my-project

# 2. local infra (Postgres + MinIO)
cp .env.example .env
docker compose up -d

# 3. install & generate Payload types
pnpm install
pnpm --filter cms generate:types

# 4. run
pnpm dev
# cms admin → http://localhost:3000/admin
# web       → http://localhost:3001
# minio console → http://localhost:9001  (user/pass from .env)
```

## Notes

- Pin dependency versions with `pnpm install` (the versions here are a starting point — run `pnpm up --latest` deliberately, not blindly).
- Media never writes to local disk — uploads go to S3/MinIO via the storage adapter.
- Add a secondary locale by editing `localization.locales` in `apps/cms/src/payload.config.ts` and the `i18n` routing in `apps/web`.
- Integration tests run against this docker-compose stack (see `.cursor/core/rules/30-test-strategy.mdc`).
