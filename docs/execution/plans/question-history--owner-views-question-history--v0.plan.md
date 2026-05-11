# Implementation Plan: Owner views question history (v0)

## Parent User Story

[Owner views question history (v0)](../user-stories/question-history--owner-views-question-history--v0.md)

## Status

`executed`

> Layout in effect: `apps/web/` + `packages/**`  
> **Approval:** Orchestrator cloud task (2026-05-11) authorizes execution on `orchestrator/tracking-fa-question-history--owner-views-question-history-1778523883291` (PR #49).

---

## Approach

Ship the slice entirely in the **private workspace** History tab: enhance `QuestionHistoryPanel` to parse the existing GET response with `QuestionHistoryListResponseSchema`, surface loading / empty / error / retry, render all six structured fields plus **available options** from `ClarifyDecisionUi`, and show **PRD version context** by resolving `prdVersionId` against the workspace’s loaded PRD version list. Refetch when the History tab becomes active so new decisions appear after clarification. No new API, contracts, or migrations.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Data | Existing question-history rows via current route |
| Auth | Session + project ownership (unchanged on route) |
| Contracts | Reuse `QuestionHistoryListResponseSchema` on the client |

---

## Layers Affected

- [ ] `domain`
- [ ] `application`
- [ ] `infrastructure`
- [ ] `contracts`
- [x] `app` (client components under `apps/web/app/.../_components/`)
- [ ] `shared`

---

## Touched Files (exact paths)

| Path | Operation |
|------|-----------|
| `apps/web/app/dashboard/projects/[id]/_components/question-history.tsx` | modify |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify |
| `docs/product/scope-slices/question-history--owner-views-question-history.md` | modify |
| `docs/product/feature-areas/question-history.md` | modify |
| `docs/execution/user-stories/question-history--owner-views-question-history--v0.md` | add |
| `docs/execution/plans/question-history--owner-views-question-history--v0.plan.md` | add |
| `docs/state/status.json` | modify |
| `docs/state/HANDOFF.md` | modify |

---

## Contracts Changed

None (client consumes existing schema).

---

## Migrations

None.

---

## Tests

| Path | Type |
|------|------|
| `pnpm typecheck` | repo |
| `pnpm build` | repo |

---

## Dependencies Added

None.

---

## Rollback

Revert commits on the tracking branch.

---

## Risks

- Low: tab refetch adds one extra GET per History visit; acceptable for v0.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-11 | Initial plan |
