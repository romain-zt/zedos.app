# Implementation Plan: Contextual tab refinement (v0)

## Parent User Story

[Contextual tab refinement (v0)](../user-stories/guided-clarification--contextual-tab-refinement--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add a new `ContextualRefinementPanel` client component (drawer/sheet) that accepts a `contextLabel` string, renders a minimal single-turn chat UI, and delegates to the existing `POST /api/projects/[id]/clarify` endpoint with the label prepended to the founder's message. Wire refinement-trigger icon buttons into `PrdViewer`, `ArchitecturePanel`, and `QuestionHistoryPanel`. Lift the panel's open-state into `ProjectWorkspace` via a `refinementContext` state and an `onOpenRefinement(label)` callback prop.

No new API routes. No contract schema changes. No migration. Credits flow through the existing clarify route without modification.

Rules followed: `72-hexagonal-boundaries.mdc` (UI layer only — no direct domain/application imports), `77-nextjs.mdc` (`'use client'` at leaf), `73-result-rop.mdc` (error surfaces via toast, not throw).

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | n/a — no new DB writes from this plan; existing clarify route persists question history |
| Auth source-of-truth | better-auth (`requireUser`) — handled by clarify route, unchanged |
| Async/sync boundary | Streaming SSE — same pattern as existing clarify tab |
| Transaction boundary | n/a |
| External dependencies | AI inference via existing `callAI` path — no new dependency |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `ui` — `ContextualRefinementPanel` (new), `ProjectWorkspace`, `PrdViewer`, `ArchitecturePanel`, `QuestionHistoryPanel` (modified trigger buttons only)
- [ ] `app` (routes) — no changes; reuses existing clarify route
- [ ] `application` — no changes
- [ ] `infrastructure` — no changes
- [ ] `contracts` — no changes
- [ ] `domain` — no changes

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `apps/web/app/dashboard/projects/[id]/_components/contextual-refinement-panel.tsx` | create | New compact drawer component |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Add `refinementContext` state `{ isOpen: boolean, label: string, prdVersionId: string \| null }`; pass `onOpenRefinement` to child tab components |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | modify | Add `onOpenRefinement?: (label: string) => void` prop; add `MessageSquare` icon button near each section heading |
| `apps/web/app/dashboard/projects/[id]/_components/architecture-panel.tsx` | modify | Add `onOpenRefinement?: (label: string) => void` prop; add trigger buttons on ADR / decision items |
| `apps/web/app/dashboard/projects/[id]/_components/question-history.tsx` | modify | Add `onOpenRefinement?: (label: string) => void` prop; add "Revise" button on each question row |

---

## `ContextualRefinementPanel` design

```
Props:
  projectId: string
  prdVersionId: string | null
  contextLabel: string          // e.g. "Target Users section of my PRD"
  isOpen: boolean
  onClose: () => void

Internal state:
  input: string
  messages: { role: 'user' | 'assistant', content: string, reasoning?: string }[]
  streaming: boolean

Behavior:
  - On send: calls POST /api/projects/[id]/clarify with
      { message: `Refine [contextLabel]: ${input}`, prdVersionId }
  - Streams response via same SSE parse logic as ClarificationChat
  - On 402: toast.error(data.message); streaming = false
  - On error: toast.error('Failed to get AI response')
  - Close button + Esc key dismisses
```

---

## Contracts Changed

None.

---

## Migrations

None.

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `apps/web/app/dashboard/projects/[id]/_components/contextual-refinement-panel.test.tsx` | unit | Renders with label; sends correct prefixed message; shows streaming response; closes on done; 402 shows toast |

---

## Dependencies Added

| Package | Scope | Reason |
|---------|--------|--------|
| `happy-dom` | `apps/web` devDependency | Vitest DOM environment for `contextual-refinement-panel.test.tsx` (plan Tests section). |
| `@vitejs/plugin-react` | `apps/web` devDependency | Transforms JSX in imported `.tsx` modules during Vitest (Rolldown/Vite pipeline). |
| `@testing-library/react` | `apps/web` devDependency | `fireEvent` for controlled textarea updates in `contextual-refinement-panel.test.tsx`. |

---

## Rollback

Revert the PR; no schema or data changes.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SSE streaming parse logic duplicated between `ClarificationChat` and `ContextualRefinementPanel` | Medium | Low | Extract shared `useStreamingClarify` hook in follow-up; v0 accepts the duplication |
| PRD / Architecture content stale after refinement | Low | Low | Out of scope per slice boundary; user regenerates PRD explicitly |

---

## Out of Scope (deliberate)

- Changes to `/api/projects/[id]/clarify` route
- Multi-turn panel conversation
- Auto-refresh of PRD or Architecture content after refinement
- Shared `useStreamingClarify` hook extraction (fast-follow)

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | UI-only changes; no cross-layer imports; clarify route untouched |
| scope-critic | PASS | Strict UI surface addition matching slice boundary |

---

## Approval

- [x] User approved via `/plan` approval reply (2026-05-11)
- [x] Patch Intent Summary will be produced before any code edit
- [x] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** approved
**Approval date:** 2026-05-11

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Initial plan for contextual tab refinement slice | — |
