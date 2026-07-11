# /db-migrate — Apply Drizzle migrations (local or target env)

## Usage

```txt
/db-migrate              # local: compose Postgres + migrate
/db-migrate production   # reminder: set DATABASE_URL, then migrate
```

Operational rule: `.cursor/rules/75-drizzle.mdc` §4.3  
Skill: `.cursor/skills/execution/add-drizzle-migration/SKILL.md`

---

## Purpose

Apply pending migrations with **Drizzle Kit only** (`pnpm db:migrate` in `packages/db`). Never run raw SQL against the database for schema changes.

---

## Local (default)

Uses `apps/web/docker-compose.yml` — same as CI and `AGENTS.md`.

```bash
docker compose -f apps/web/docker-compose.yml up -d postgres --wait
cd packages/db && pnpm db:migrate
```

`DATABASE_URL` must be `postgresql://zedos_test:zedos_test@127.0.0.1:5433/zedos_test` (from `apps/web/.env` or `packages/db/.env`).

---

## Production / staging

```bash
cd packages/db
DATABASE_URL='<env-url>' pnpm db:migrate
```

Run **before** deploy when the release includes new `packages/db/src/migrations/*.sql` files. Symptom if skipped: `relation "<table>" does not exist` at runtime.

---

## Authoring new migrations (not this command)

1. Edit `packages/db/src/schema/*.ts`
2. `cd packages/db && pnpm generate` — never hand-write SQL
3. `/db-migrate` locally to verify

Prisma (legacy tree only): `prisma migrate dev` — see `75-drizzle.mdc` §7.
