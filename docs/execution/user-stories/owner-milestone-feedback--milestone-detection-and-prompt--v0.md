# User Story: Owner milestone detection and feedback prompt (v0)

## Parent Scope Slice

[Milestone detection and prompt](../../product/scope-slices/owner-milestone-feedback--milestone-detection-and-prompt.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder working on my project, I want a short, skippable feedback prompt when I hit key PRD milestones so that I can share quick input without being forced to, and only on those moments—not on every click.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I have no prior PRD versions in the project | I complete **Generate PRD** from clarification for the first time | I see a prompt for the **first PRD created** milestone (`prd_created`) and can dismiss it without submitting |
| AC-2 | I already have at least one PRD version | I complete **Generate PRD** again after clarification | I see a prompt for the **updated after clarification** milestone (`prd_updated_after_clarification`) and can dismiss it without submitting |
| AC-3 | I am on the PRD tab as the owner and at least one version exists | I switch to the PRD tab from another tab (not already on PRD) | I may see a **reopened / viewed** milestone prompt (`prd_reopened`) at most once per browser session for that project, and I can dismiss it without submitting |
| AC-4 | I just finished Generate PRD and the UI moves me to the PRD tab | — | I am not immediately hit with a **reopened** prompt on top of the create/update prompt |
| AC-5 | I mint a new read-only share link for a PRD version | The link is created successfully | I see a **PRD shared** milestone prompt (`prd_shared`) and can dismiss it without submitting |
| AC-6 | I am a visitor on an anonymous share URL | Any milestone would have fired for an owner | I never see owner milestone prompts |
| AC-7 | I dismiss or close the prompt without rating or comment | — | I continue using the product with no required follow-up |
| AC-8 | I submit a rating and optional comment | The request succeeds | I get success feedback and the prompt closes |
| AC-9 | I submit feedback for a milestone I already submitted for (same scope the API de-duplicates) | — | I get a non-blocking outcome consistent with the API (e.g. duplicate message) without a hard error loop |
| AC-10 | The feedback request fails (network or server error) | — | I see a recoverable error and can retry or dismiss |

---

## Test Plan

- [ ] Unit: `packages/contracts` — milestone feedback Zod schemas accept valid payloads and reject invalid milestone types / bodies (unit)
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch (integration)

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `packages/contracts/src/feedback/` | new | Zod contracts for owner milestone types, POST body, and response shapes |
| `apps/web/app/api/feedback/route.ts` | modify | Validate request/response with contracts; auth-gated owner POST |
| `apps/web/components/milestone-feedback-modal.tsx` | modify | Owner-only modal; typed milestone; validate POST response |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | Milestone choice after PRD generation from existing version count |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Tab-change `prd_reopened` detection, session suppression, pass version count |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | `prd_shared` prompt after successful share mint |

---

## Out of Scope

- Feedback prompts for anonymous share viewers
- Collaboration / invited-editor feedback loops
- Prompts on arbitrary actions outside the four defined milestones
- Full **feedback capture and attribution** product slice (admin views, extended metadata, non-owner surfaces)

---

## Open Questions

| ID | Question | Blocks | Next action |
|----|----------|--------|-------------|
| — | — | — | None |

---

## Decision References

- None

---

## Readiness for Implementation Plan

- [x] Story expressed in user-value terms (no implementation language)
- [x] Acceptance Criteria cover at least one row per UX state from the parent Scope Slice
- [x] Test plan names test type for each item (unit / integration / contract / e2e)
- [x] Touched Files (predicted) is non-empty
- [x] Out of Scope is non-empty
- [x] All Open Questions either answered or carry an explicit next action
- [x] Decision references resolved (or `none` stated explicitly)

**Verdict:** READY FOR IMPLEMENTATION PLAN

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored from promoted scope slice for orchestrator phase | cloud-agent |
