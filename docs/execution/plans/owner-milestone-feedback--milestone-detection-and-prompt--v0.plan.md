# Implementation Plan: Owner milestone detection and prompt (v0)

## Parent User Story

[owner-milestone-feedback--milestone-detection-and-prompt--v0.md](../user-stories/owner-milestone-feedback--milestone-detection-and-prompt--v0.md)

## Status

`approved` — persisted under orchestrator tracking PR workflow (2026-05-12).

---

## Approach

1. **Contracts:** Add `OwnerMilestoneDetectedPayloadSchema` (project id, milestone type, optional PRD version id) reusing `OwnerMilestoneTypeSchema` so server actions and client providers share one validated shape.
2. **UI (follow-up layer):** Add a client `OwnerMilestonePromptProvider` mounted under the signed-in dashboard project shell. It consumes validated payloads (from router search params or explicit React callbacks), shows a dismissible banner/toast with Skip, and uses `sessionStorage` to suppress repeats until full reload.
3. **Wiring (follow-up layer):** After successful PRD version capture/update, share mint, and owner PRD view-after-generation entry points, invoke the provider callback or navigate with a short-lived validated query/hash payload derived from `OwnerMilestoneDetectedPayloadSchema`.
4. **Ownership gate:** Only render the provider subtree when session user matches `project.ownerId` (passed from server layout).

---

## Touched Files (exact paths)

| Path | Change |
|------|--------|
| `packages/contracts/src/feedback/milestone-prompt.ts` | **new** — Zod payload schema + inferred types |
| `packages/contracts/src/feedback/milestone-prompt.contract.test.ts` | **new** — contract tests |
| `packages/contracts/src/feedback/index.ts` | **modify** — re-export milestone prompt schemas |
| `packages/contracts/package.json` | **modify** — export subpath `./feedback/milestone-prompt` |
| `apps/web/app/dashboard/projects/[id]/layout.tsx` | **modify** — wrap children with prompt provider + owner check |
| `apps/web/app/dashboard/projects/[id]/_components/owner-milestone-prompt.tsx` | **new** — client UI + session dedupe |
| PRD version / share / PRD page callsites (determined during UI layer; e.g. routes under `apps/web/app/dashboard/projects/[id]/`) | **modify** — emit milestone payload |

---

## Layers Affected

- `contracts`
- `app/` (layouts, client components — adapters)

Domain and application layers are **not** required for v0 (no new persistence in this slice).

---

## Contracts Changed

- `OwnerMilestoneDetectedPayloadSchema`, type `OwnerMilestoneDetectedPayload` in `packages/contracts/src/feedback/milestone-prompt.ts`

---

## Migrations

None — client-only suppression per Scope Slice.

---

## Dependencies Added

None.

---

## Tests

| Test file | Coverage |
|-----------|----------|
| `packages/contracts/src/feedback/milestone-prompt.contract.test.ts` | Payload validation |
| Vitest/unit around dedupe helper (optional, co-located with provider) | Session suppression |

---

## Rollback

Revert provider mount and milestone emits; contracts file removal is safe if unused.

---

## Risks

- **Missed callsites:** Milestone may not fire if a flow bypasses the instrumented path — mitigate with manual checklist per AC.
- **Query-param leakage:** Prefer in-memory/React context over durable URLs where possible; if search params are used, strip after read.
