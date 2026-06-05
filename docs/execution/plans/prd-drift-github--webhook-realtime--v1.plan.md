# Implementation Plan: prd-drift-github--webhook-realtime (v1)

## Parent User Story

[prd-drift-github--webhook-realtime (v1)](../user-stories/prd-drift-github--webhook-realtime--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

> **Governance note (2026-06-05):** Plan flipped from `draft` → `approved` by user override; architect step skipped. Real GitHub event evaluation deferred — webhook ingest currently maps every event 1:1 to a `DriftSignal` stub. Re-route through architect before adding event-type-specific evaluation logic.

---

## Approach

Project-scoped webhook URL `/api/projects/[id]/github/webhook` accepting GitHub deliveries. The handler verifies `X-Hub-Signature-256` via HMAC-SHA256 against `GITHUB_WEBHOOK_SECRET`, then calls `IngestGithubWebhookEventUseCase`. Idempotency is enforced by the `(project_id, external_delivery_id)` unique index — duplicate deliveries return `duplicate: true` without creating a second signal. The signal table is shared with the evaluate slice (single inbox).

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
| `apps/web/.env.example` | edit (shared) | `GITHUB_WEBHOOK_SECRET` |
| `packages/db/src/schema/drift-signals.ts` | new | unique on `(project_id, external_delivery_id)` for idempotency |
| `packages/db/src/schema/index.ts` | edit | re-export |
| `packages/db/src/types.ts` | edit | `NewDriftSignalRow`, `DriftSignalUpdate` |
| `packages/db/src/migrations/0016_prd_drift_github_and_linear.sql` | shared | DDL + indexes |
| `packages/contracts/src/github/drift.ts` | new | `DriftSignalDTO`, `ListDriftSignalsResponse`, `ResolveDriftSignalRequest` |
| `packages/contracts/src/github/webhook.ts` | new | header constants + tolerant envelope schema + ack response |
| `packages/contracts/src/github/index.ts` | new | barrel |
| `apps/web/src/domain/github/drift-signal.ts` | new | entity + draft |
| `apps/web/src/domain/github/drift-signal-repository.ts` | new | port |
| `apps/web/src/application/github/ingest-github-webhook-event-usecase.ts` | new | parse envelope → idempotent insert |
| `apps/web/src/infrastructure/github/github-webhook-verify.ts` | new | HMAC-SHA256 via `node:crypto`, `timingSafeEqual` |
| `apps/web/src/infrastructure/persistence/drift-signal-repository.ts` | new | `insertIfAbsent` via `onConflictDoNothing` on `(project_id, external_delivery_id)` |
| `apps/web/app/api/projects/[id]/github/webhook/route.ts` | new | thin: text body → verify → parse → ingest → ack |

---

## Out of Scope (v1)

- Per-event-type evaluation (push vs release vs issues). All map to placeholder kinds today.
- Replay attack mitigation (we accept any signed body until we add a delivery-id window).
- WebSocket / SSE notification for the owner UI.
- GitHub App installation lifecycle webhooks.

---

## Dependencies Added

None. HMAC verification via `node:crypto`.

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm test` — follow-up
- [ ] Manual: replay a recorded GitHub delivery with `curl` + a forged signature → expect 401

---

## Tests (follow-up)

| Layer | Test | Status |
|---|---|---|
| infrastructure | `verifyGithubWebhookSignature` happy path + bad signature + missing header + missing secret | planned |
| application | `IngestGithubWebhookEventUseCase` idempotency: second call with same `deliveryId` returns `created: false` | planned |
| application | `IngestGithubWebhookEventUseCase` returns `NotFoundError` when no active connection | planned |
| route | webhook returns 401 on bad signature, 200 + `duplicate: true` on replay | planned |

---

## Rollback

Same shared migration as the connect-repo slice — see that plan's Rollback section.

---

## Risks

- The webhook URL is project-scoped, which means operators must register one webhook per project on GitHub. Acceptable for v1; switch to a single `/api/github/webhook` URL + repo→project lookup before scaling.
- The envelope schema uses `.passthrough()` so unknown payload fields are persisted as-is in `payload` JSON. Audit before the evaluate slice consumes those fields directly.

---

## Blueprint

Generated 2026-06-04. Populated and approved 2026-06-05 via single-turn implementer override.
