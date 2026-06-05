# Implementation Plan: prd-drift-github--evaluate-and-weekly-digest (v1)

## Parent User Story

[prd-drift-github--evaluate-and-weekly-digest (v1)](../user-stories/prd-drift-github--evaluate-and-weekly-digest--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

> **Governance note (2026-06-05):** Plan flipped from `draft` → `approved` by user override; architect step skipped. v1 ships only the **inbox surfaces** (list + resolve/dismiss) and a **default-off digest endpoint stub** — the actual evaluation logic (DRIFT-01..04) and the email send are deferred. Architect must approve any expansion beyond inbox + flag-gated job before next iteration.

---

## Approach

Two surfaces:

1. **Drift inbox** — `GET /api/projects/[id]/drift?status=open` + `PATCH /api/projects/[id]/drift/[signalId]` for resolve/dismiss/reopen. Owner-only. Reads the `drift_signals` table populated by the webhook slice.
2. **Weekly digest job** — `POST /api/jobs/drift-weekly-digest` gated by `DRIFT_WEEKLY_DIGEST_ENABLED=true` + `X-Cron-Secret` header matching `CRON_SHARED_SECRET`. v1 returns a no-op summary; the real cross-project scan + email render + Resend send is the v2 milestone.

---

## Layers Affected

- [x] `domain` (status enums + repo port methods)
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [ ] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/.env.example` | edit (shared) | `DRIFT_WEEKLY_DIGEST_ENABLED`, `CRON_SHARED_SECRET` |
| `packages/contracts/src/github/drift.ts` | shared | adds `ResolveDriftSignalRequest`, `ListDriftSignalsResponse` |
| `apps/web/src/domain/github/drift-signal-repository.ts` | shared | `findByProjectId`, `findByIdForProject`, `updateStatus` |
| `apps/web/src/application/github/list-drift-signals-usecase.ts` | new | owner read |
| `apps/web/src/application/github/resolve-drift-signal-usecase.ts` | new | owner-only state machine: resolve, dismiss, reopen |
| `apps/web/src/application/github/run-weekly-drift-digest-usecase.ts` | new | env + secret gate; returns 503 when disabled |
| `apps/web/src/infrastructure/github/github-config.ts` | edit | `readWeeklyDigestEnv` |
| `apps/web/app/api/projects/[id]/drift/route.ts` | new | GET with `status` query param |
| `apps/web/app/api/projects/[id]/drift/[signalId]/route.ts` | new | PATCH with action |
| `apps/web/app/api/jobs/drift-weekly-digest/route.ts` | new | POST job entrypoint |

---

## Out of Scope (v1)

- Actual DRIFT-01..04 evaluation logic (PRD ↔ GitHub diffing).
- Email rendering + send via Resend.
- Per-user digest opt-out preference.
- Next-action banner coordination flag (mentioned in slice; consumer slice will read drift status directly).

---

## Dependencies Added

None.

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm test` — follow-up
- [ ] Manual: `curl -X POST localhost:3000/api/jobs/drift-weekly-digest` without env → expect 503; with env + secret → expect `{ enabled: true, skipped: true }`

---

## Tests (follow-up)

| Layer | Test | Status |
|---|---|---|
| application | `RunWeeklyDriftDigestUseCase` returns 503 when disabled; 401 on wrong secret; ok stub when enabled | planned |
| application | `ResolveDriftSignalUseCase` non-owner forbidden; happy path moves status | planned |
| application | `ListDriftSignalsUseCase` returns project signals filtered by status | planned |
| route | drift inbox GET returns 401 unauth; 200 with payload when authed | planned |

---

## Rollback

Shares migration `0016_prd_drift_github_and_linear.sql` with the other slices.

---

## Risks

- The digest endpoint is dark by default but the surface exists — any operator can set the env var without a code change. Acceptable because the v1 body is a no-op; tighten when the real send lands.
- Reopen + dismiss share the same handler; if we later need a separate audit trail per transition, the route + use case will need to grow. Tracked.

---

## Blueprint

Generated 2026-06-04. Populated and approved 2026-06-05 via single-turn implementer override.
