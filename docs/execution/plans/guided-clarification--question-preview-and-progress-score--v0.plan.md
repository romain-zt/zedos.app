# Implementation Plan: Question preview and progress score (v0)

## Parent User Story

[Question preview and progress score (v0)](../user-stories/guided-clarification--question-preview-and-progress-score--v0.md)

## Status

`executed`

> **Layout in effect:** post-migration (`apps/web/` + `packages/`)
> **Architecture Surface:** resolved
> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

**Two independent changes stitched together:**

1. **"Coming up" chips in `ClarificationChat`** — computed client-side from the question history already loaded on mount. No new API call. Derive `coveredSections` from `messages[].parsed.prd_section_affected` (assistant messages). Subtract from `PRD_SECTIONS` constant. Render first 2–3 uncovered as badge chips above the input area.

2. **Readiness score formula swap** — replace the Prisma-backed `ReadinessScoreUseCase` in `readiness-score/route.ts` with a Drizzle query on `questionHistory`. Compute `answered` (rows with `founderAnswer IS NOT NULL`) and `remaining` (8 − distinct covered `prdImpact` values). Cap score at 95 % unless a PRD version exists (query `prdVersions` table). Add `ReadinessScoreResponseSchema` to `packages/contracts/src/questions/history.ts`; validate outbound DTO before sending.

The `PRD_SECTIONS` constant (8 values) is defined once in `packages/contracts/src/questions/history.ts` and imported in both the route and the client component.

Rules followed: `74-contracts-zod.mdc` (outbound DTO validated), `72-hexagonal-boundaries.mdc` (thin route: query → compute → validate → respond; no business logic in route), `77-nextjs.mdc`.

---

## Architecture Surface Block

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | Postgres via Drizzle (`@repo/db`) — `questionHistory` + `prdVersions` tables |
| Auth source-of-truth | better-auth (`requireUser`) — unchanged |
| Async/sync boundary | Synchronous per HTTP request |
| Transaction boundary | Read-only; no transaction needed |
| External dependencies | None |
| Payment shape | n/a |

### Surface Blockers

- None

---

## Layers Affected

- [x] `ui` — `ClarificationChat` (coming up chips), `ReadinessScoreBadge` (display)
- [x] `app` (routes) — `readiness-score/route.ts` (formula replacement)
- [x] `contracts` — `packages/contracts/src/questions/history.ts` (new schema + constant)
- [ ] `application` — no changes (use case removed from this route; no new use case needed for a read-only aggregation)
- [ ] `infrastructure` — no changes
- [ ] `domain` — no changes

> **Note on use-case removal:** `ReadinessScoreUseCase` was the sole consumer of `PrismaProjectRepository`, `PrismaPrdRepository`, and `PrismaAdrRepository` in this route. Removing it from here does not delete those classes — it just removes one call-site. The ADR-based score logic is intentionally discarded in favour of the question-coverage formula approved in this slice.

---

## Touched Files (exact paths)

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/contracts/src/questions/history.ts` | modify | Add `ReadinessScoreResponseSchema`, `PRD_SECTIONS` constant export |
| `packages/contracts/src/questions/index.ts` | modify | Re-export `ReadinessScoreResponseSchema`, `PRD_SECTIONS` |
| `apps/web/app/api/projects/[id]/readiness-score/route.ts` | modify | Replace Prisma use-case with Drizzle query; validate outbound with `ReadinessScoreResponseSchema` |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | Add "Coming up" chips row above input using `PRD_SECTIONS` and loaded message history |
| `apps/web/app/dashboard/projects/[id]/_components/readiness-score-badge.tsx` | modify | Display `score` from updated endpoint; add `X/8` label |

---

## `ReadinessScoreResponseSchema` design

```typescript
// packages/contracts/src/questions/history.ts

export const PRD_SECTIONS = [
  'Product Vision',
  'Target Users',
  'Core Features',
  'User Journeys',
  'Technical Constraints',
  'Success Metrics',
  'Out of Scope',
  'Open Questions',
] as const satisfies readonly string[]

export const ReadinessScoreResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  answered: z.number().int().min(0),
  remaining: z.number().int().min(0),
  coveredSections: z.array(z.string()),
  remainingSections: z.array(z.string()),
})

export type ReadinessScoreResponse = z.infer<typeof ReadinessScoreResponseSchema>
```

---

## Readiness score route logic (pseudo-code)

```
1. requireUser → 401 on error
2. Verify project ownership (db.select from projects where id + userId) → 404 on miss
3. SELECT founderAnswer, prdImpact FROM questionHistory WHERE projectId = id
4. answered = rows where founderAnswer IS NOT NULL
5. coveredSections = distinct prdImpact values from answered rows, filtered to PRD_SECTIONS
6. remaining = PRD_SECTIONS.length - coveredSections.length  (min 0)
7. rawScore = answered.length + remaining > 0
     ? Math.round(answered.length / (answered.length + remaining) * 100)
     : 0
8. hasPrd = SELECT COUNT(*) FROM prdVersions WHERE projectId = id > 0
9. score = hasPrd ? rawScore : Math.min(rawScore, 95)
10. Validate outbound with ReadinessScoreResponseSchema.safeParse(...)
    → 500 on validation failure
11. Return 200 JSON
```

---

## Contracts Changed

| Schema | Operation | Test |
|--------|-----------|------|
| `ReadinessScoreResponseSchema` (new) | add to `packages/contracts/src/questions/history.ts` | `packages/contracts/src/questions/history.contract.test.ts` (new test cases) |
| `PRD_SECTIONS` constant (new) | add to same file | same test file |

---

## Migrations

None.

---

## Tests

| Path | Type | Asserts |
|------|------|---------|
| `packages/contracts/src/questions/history.contract.test.ts` | contract | `ReadinessScoreResponseSchema` parses valid; rejects missing fields |
| `apps/web/app/api/projects/[id]/readiness-score/route.test.ts` | unit | 0 answered → 0 %; 4 covered → correct ratio; all 8 covered + no PRD → 95 % cap; all 8 + PRD → 100 % |
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.test.tsx` | unit | "Coming up" chips render for partial coverage; empty when all covered |

---

## Dependencies Added

None.

---

## Rollback

Revert the PR; no schema or data changes. The removed `ReadinessScoreUseCase` reference in the route is not destructive — the class itself is not deleted.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `prdImpact` values in history don't exactly match `PRD_SECTIONS` strings | Medium | Low | Covered-section detection does a string-inclusion check against `PRD_SECTIONS`; partial matches are ignored (conservative — only exact canonical matches count) |
| Removing ADR-based score surprises other call-sites | Low | Low | `readiness-score` route has exactly one consumer (`ReadinessScoreBadge`); no other component calls this endpoint |

---

## Out of Scope (deliberate)

- Real-time score update within session (refresh on reload only)
- AI prediction of specific upcoming question text
- Changes to `ClarifyAiResponseSchema`
- Deletion of `ReadinessScoreUseCase` class (only the call-site in the route is removed)

---

## Adversarial Review

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS | Route remains thin (query + compute + validate); no business logic; outbound validated with contract schema; no `as any`; no cross-layer imports in UI |
| scope-critic | PASS | Formula change is exactly scoped; "coming up" chips use zero new API calls |

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
| 2026-05-11 | Initial plan for question preview and progress score slice | — |
