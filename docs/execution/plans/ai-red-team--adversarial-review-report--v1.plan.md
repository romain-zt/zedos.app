# Implementation Plan: ai-red-team--adversarial-review-report (v1)

## Parent User Story

[ai-red-team--adversarial-review-report (v1)](../user-stories/ai-red-team--adversarial-review-report--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Owner with `planTier in ('pro','builder','team')` (default policy — Q-018 burn) requests a red-team review on a PRD version. The use case:

1. Verifies tier eligibility (defaults free-tier to credit-burn fallback when configured)
2. Reserves credits at the `prd_challenge` rate (existing `CREDIT_COST_PRD_CHALLENGE`)
3. Calls the AI red-team generator adapter (synchronous, request-scoped — async job out of v0)
4. Persists findings into `red_team_reports` + `red_team_findings`
5. Returns a structured findings panel response (DTO)

Findings shape mirrors `docs/product/ai-red-team-prd-spec.md`: `{ id, category, severity, sectionId | null, title, evidence, suggestion }`.

Hexagonal layout:

- `domain/red-team/red-team-report.ts` — entity + `RedTeamFinding`
- `domain/red-team/red-team-report-repository.ts` — port
- `domain/red-team/red-team-generator-port.ts` — port for AI adapter
- `application/red-team/generate-red-team-report-usecase.ts` — orchestrator (credit reservation + AI + persist)
- `application/red-team/list-red-team-reports-usecase.ts` — list by project
- `application/red-team/get-red-team-report-usecase.ts` — fetch single report with findings
- `infrastructure/ai/red-team-report-generator-adapter.ts` — wraps `callAI` + JSON schema-constrained prompt
- `infrastructure/persistence/red-team-report-repository.ts` — Drizzle adapter
- `app/api/projects/[id]/red-team/route.ts` — POST start review, GET list
- `app/api/projects/[id]/red-team/[reportId]/route.ts` — GET details

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
| `packages/db/src/schema/red-team.ts` | new | `red_team_reports`, `red_team_findings` |
| `packages/db/src/schema/index.ts` | edit (covered) | Re-export |
| `packages/contracts/src/ai/red-team.ts` | new | Request/response zod + finding schema |
| `packages/contracts/src/ai/index.ts` | edit | Re-export |
| `apps/web/src/domain/red-team/red-team-report.ts` | new | Entity + finding |
| `apps/web/src/domain/red-team/red-team-report-repository.ts` | new | Port |
| `apps/web/src/domain/red-team/red-team-generator-port.ts` | new | Port |
| `apps/web/src/domain/red-team/index.ts` | new | Re-exports |
| `apps/web/src/application/red-team/generate-red-team-report-usecase.ts` | new | Orchestrator |
| `apps/web/src/application/red-team/list-red-team-reports-usecase.ts` | new | List |
| `apps/web/src/application/red-team/get-red-team-report-usecase.ts` | new | Get one |
| `apps/web/src/application/red-team/index.ts` | new | Re-exports |
| `apps/web/src/infrastructure/ai/red-team-report-generator-adapter.ts` | new | Wraps `callAI` |
| `apps/web/src/infrastructure/persistence/red-team-report-repository.ts` | new | Drizzle adapter |
| `apps/web/app/api/projects/[id]/red-team/route.ts` | new | POST + GET (< 30 LOC each) |
| `apps/web/app/api/projects/[id]/red-team/[reportId]/route.ts` | new | GET details |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | edit | `RED_TEAM_REVIEW_STARTED`, `RED_TEAM_REVIEW_COMPLETED` |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm --filter @repo/web test`
- [ ] `pnpm --filter @repo/web build`

---

## Out of Scope

- Anonymous share surface (per slice §Excluded)
- Auto-editing PRD to apply suggestions
- Async / background job (sync request only in v0)

---

## Blueprint

Generated 2026-06-04. Approved + filled 2026-06-05.
