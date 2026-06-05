# Implementation Plan: prd-drift-github--connect-repo (v1)

## Parent User Story

[prd-drift-github--connect-repo (v1)](../user-stories/prd-drift-github--connect-repo--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

> **Governance note (2026-06-05):** Plan flipped from `draft` → `approved` by user override (single message `/implement` of all three drift slices + Linear). Architect step was skipped; the implementer populated the Touched Files allow-list during the same turn the PIS was approved. Re-route through architect before scaling this slice beyond the v1 stub.

---

## Approach

Add a project-scoped GitHub connection record that the future drift evaluation + webhook slices read. v1 is intentionally an OAuth stub: the owner manually supplies `(ownerLogin, repoName)` via `POST /api/projects/:id/github`; the real OAuth dance (redirect → callback → token exchange → installation id) is out of scope. The persisted row is the contract the other two slices consume.

---

## Layers Affected

- [x] `domain`
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [ ] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/.env.example` | edit | GitHub OAuth + webhook env shape (`GITHUB_APP_CLIENT_ID/SECRET`, `GITHUB_WEBHOOK_SECRET`, `GITHUB_OAUTH_REDIRECT_BASE_URL`) |
| `packages/db/src/schema/github-connections.ts` | new | Drizzle table `github_connections` (one per project, unique on `project_id`) |
| `packages/db/src/schema/index.ts` | edit | re-export |
| `packages/db/src/types.ts` | edit | `NewGithubConnectionRow`, `GithubConnectionUpdate` |
| `packages/db/src/migrations/0016_prd_drift_github_and_linear.sql` | new (shared with webhook + Linear slices) | DDL for `github_connections` + FKs |
| `packages/db/src/migrations/meta/_journal.json` | edit | append entry 16 |
| `packages/contracts/src/github/connection.ts` | new | `ConnectGithubRepoRequest`, `GithubConnectionDTO`, response schema |
| `packages/contracts/src/github/index.ts` | new | barrel |
| `packages/contracts/src/index.ts` | edit | re-export |
| `packages/contracts/package.json` | edit | `./github`, `./github/connection` subpath exports |
| `apps/web/src/domain/github/github-connection.ts` | new | entity + draft |
| `apps/web/src/domain/github/github-connection-repository.ts` | new | port |
| `apps/web/src/domain/github/index.ts` | new | barrel |
| `apps/web/src/application/github/connect-github-repo-usecase.ts` | new | parses request, asserts owner, upserts |
| `apps/web/src/application/github/disconnect-github-repo-usecase.ts` | new | owner-only soft disconnect |
| `apps/web/src/application/github/get-github-connection-usecase.ts` | new | auth + read |
| `apps/web/src/application/github/index.ts` | new | barrel |
| `apps/web/src/infrastructure/github/github-config.ts` | new | env reader |
| `apps/web/src/infrastructure/github/index.ts` | new | barrel |
| `apps/web/src/infrastructure/persistence/github-connection-repository.ts` | new | Drizzle adapter (upsert/find/disconnect) |
| `apps/web/src/infrastructure/persistence/index.ts` | edit | re-export |
| `apps/web/app/api/projects/[id]/github/route.ts` | new | GET / POST / DELETE |

---

## Out of Scope (v1)

- Real GitHub OAuth dance (authorize → callback → token storage). The stub accepts a manual `(ownerLogin, repoName)` POST today.
- Token refresh + revocation detection.
- UI in `apps/web/app/dashboard` — backend only this iteration.
- Cross-project repo collision rules (one repo can be linked to multiple projects in v1).

---

## Dependencies Added

None. Webhook verification uses `node:crypto`; no `@octokit/*` package was introduced.

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm test` — not run in this iteration; covered by follow-up story
- [ ] `pnpm build` — not run in this iteration
- [ ] DB migration applied — `pnpm --filter @repo/db drizzle:push` against a dev DB to confirm `github_connections` is created

---

## Tests (follow-up)

| Layer | Test | Status |
|---|---|---|
| application | `ConnectGithubRepoUseCase` owner happy path + non-owner forbidden | planned |
| application | `DisconnectGithubRepoUseCase` non-owner forbidden | planned |
| contracts | `ConnectGithubRepoRequestSchema` owner/repo regex rejection | planned |
| route | `GET /api/projects/[id]/github` 401 when no session | planned |

---

## Rollback

Single migration `0016_prd_drift_github_and_linear.sql` covers the four new tables. Rolling back this slice alone is not safe — the other two PRD-drift slices and the Linear slice share this migration. Either revert all four slices together or surgically `DROP TABLE github_connections` after confirming no rows reference it.

---

## Risks

- The manual `(ownerLogin, repoName)` form bypasses installation-id verification — an owner can claim any public repo path. Acceptable for v1 (no privileged data is read yet), unacceptable once the real evaluation slice ships. Tracked as a blocker for `prd-drift-github--evaluate-and-weekly-digest` going beyond stub.
- No rate limiting on `POST /api/projects/:id/github`. Acceptable while feature is dark.

---

## Blueprint

Generated 2026-06-04. Populated and approved 2026-06-05 via single-turn implementer override.
