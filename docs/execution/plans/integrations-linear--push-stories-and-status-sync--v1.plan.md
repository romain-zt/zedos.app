# Implementation Plan: integrations-linear--push-stories-and-status-sync (v1)

## Parent User Story

[integrations-linear--push-stories-and-status-sync (v1)](../user-stories/integrations-linear--push-stories-and-status-sync--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

> **Governance note (2026-06-05):** Plan flipped from `draft` → `approved` and the parent Scope Slice was promoted from `exploratory` → `ready-for-user-stories` by **explicit user override** of `GATE-LINEAR-001` (the ≥3 founding-builder demand gate documented in `integrations-linear-brief.md`). This v1 ships scaffold only — the Linear API client is a **stub** that returns 501 even when `LINEAR_API_KEY` is set. The architect must re-approve before the stub is replaced with real GraphQL calls.

---

## Approach

Three thin surfaces:

1. **Connect Linear** — `POST /api/projects/[id]/linear` with `(teamId, linearProjectId?)`. v1 uses a single workspace-wide `LINEAR_API_KEY` env (not OAuth) — single tenant. The persisted row records which Linear team this project pushes to.
2. **Push story** — `POST /api/projects/[id]/linear/push-story` with `{ userStoryLineId }`. Owner-only. Resolves the line via `user_story_corpora.project_id = projectId`; idempotent on `user_story_lines.id` (returns existing link if already pushed). Calls `ILinearApiPort.createIssue` which today returns 501 stub.
3. **Status sync webhook** — `POST /api/projects/[id]/linear/webhook`. Verifies `Linear-Signature` HMAC, looks up the link by `linear_issue_id`, maps Linear state type to our status enum, updates `last_synced_at`.

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
| `apps/web/.env.example` | edit (shared) | `LINEAR_API_KEY`, `LINEAR_WEBHOOK_SECRET` |
| `packages/db/src/schema/linear-connections.ts` | new | one connection per project |
| `packages/db/src/schema/linear-issue-links.ts` | new | one link per user story line |
| `packages/db/src/schema/index.ts` | edit | re-export |
| `packages/db/src/types.ts` | edit | `New*Row`, `*Update` interfaces |
| `packages/db/src/migrations/0016_prd_drift_github_and_linear.sql` | shared | DDL |
| `packages/contracts/src/linear/connection.ts` | new | `ConnectLinearRequest`, `LinearConnectionDTO` |
| `packages/contracts/src/linear/push.ts` | new | `PushStoryToLinearRequest/Response`, `LinearIssueLinkDTO` |
| `packages/contracts/src/linear/webhook.ts` | new | envelope + ack |
| `packages/contracts/src/linear/index.ts` | new | barrel |
| `packages/contracts/src/index.ts` | edit | re-export |
| `packages/contracts/package.json` | edit | `./linear` subpath exports |
| `apps/web/src/domain/linear/linear-connection.ts` | new | entity |
| `apps/web/src/domain/linear/linear-connection-repository.ts` | new | port |
| `apps/web/src/domain/linear/linear-issue-link.ts` | new | entity |
| `apps/web/src/domain/linear/linear-issue-link-repository.ts` | new | port (incl. `findUserStoryLineForProject` join helper) |
| `apps/web/src/domain/linear/linear-api-port.ts` | new | vendor-agnostic API port |
| `apps/web/src/domain/linear/index.ts` | new | barrel |
| `apps/web/src/application/linear/connect-linear-usecase.ts` | new | owner-only upsert |
| `apps/web/src/application/linear/disconnect-linear-usecase.ts` | new | owner-only soft disconnect |
| `apps/web/src/application/linear/get-linear-connection-usecase.ts` | new | auth + read |
| `apps/web/src/application/linear/push-user-story-to-linear-usecase.ts` | new | full flow with idempotency |
| `apps/web/src/application/linear/ingest-linear-webhook-event-usecase.ts` | new | tolerant envelope → status update |
| `apps/web/src/infrastructure/linear/linear-config.ts` | new | env reader |
| `apps/web/src/infrastructure/linear/linear-api-client.ts` | new | v1 stub (503 when no env, 501 when env present) |
| `apps/web/src/infrastructure/linear/linear-webhook-verify.ts` | new | HMAC via `node:crypto` |
| `apps/web/src/infrastructure/persistence/linear-connection-repository.ts` | new | Drizzle adapter |
| `apps/web/src/infrastructure/persistence/linear-issue-link-repository.ts` | new | Drizzle adapter + corpus join helper |
| `apps/web/src/infrastructure/persistence/index.ts` | edit | re-export |
| `apps/web/app/api/projects/[id]/linear/route.ts` | new | GET / POST / DELETE |
| `apps/web/app/api/projects/[id]/linear/push-story/route.ts` | new | POST |
| `apps/web/app/api/projects/[id]/linear/webhook/route.ts` | new | POST |

---

## Out of Scope (v1)

- Real Linear GraphQL `issueCreate` call (stub returns 501 when env present).
- Linear OAuth + per-tenant API key storage. Single env-key only.
- Comment sync, epic automation, bi-directional description edits (excluded by slice).
- Org-wide demand-gate enforcement re-instatement (user override on `GATE-LINEAR-001`).

---

## Dependencies Added

None. No `@linear/sdk` import; webhook HMAC via `node:crypto`.

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm test` — follow-up
- [ ] Manual: POST `/linear/push-story` without env → expect 503; with env present → expect 501 (stub gate)

---

## Tests (follow-up)

| Layer | Test | Status |
|---|---|---|
| infrastructure | `LinearApiClient.createIssue` returns 503 without env, 501 with env | planned |
| application | `PushUserStoryToLinearUseCase` idempotency + cross-project line forbidden | planned |
| application | `IngestLinearWebhookEventUseCase` status mapping for each Linear state type | planned |
| route | `/linear/webhook` returns 401 on bad signature | planned |

---

## Rollback

Shared migration. See connect-repo plan's Rollback.

---

## Risks

- The slice was promoted past `GATE-LINEAR-001` by user override; if real Linear demand stays under 3 founding builders, this surface remains code-but-dark. Acceptable per user decision recorded in the slice changelog.
- The single-env API key model means **all projects share one operator-controlled Linear API key**. Acceptable for v1 because the stub does not actually push; **must change** before the 501 branch is removed.
- `findUserStoryLineForProject` is an inner join. If `user_story_corpora.project_id` ever desyncs from the line's true owner, we leak. Mitigated by `ON DELETE CASCADE` on the corpus FK.

---

## Blueprint

Generated 2026-06-04. Populated and approved 2026-06-05 via single-turn implementer override.
