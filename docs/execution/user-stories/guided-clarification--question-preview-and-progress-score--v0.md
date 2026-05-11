# User Story: Question preview and progress score (v0)

## Parent Scope Slice

[Question preview and progress score](../../product/scope-slices/guided-clarification--question-preview-and-progress-score.md)

## Status

`ready-for-implementation`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in founder in the clarification workspace, I want to see which PRD areas are coming up next and have a readiness score that reflects how many areas I've covered versus how many remain, so I can understand where I am in the journey without guessing.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I open the Clarify tab with no question history | Page loads | "Coming up" row shows the first 3 canonical PRD sections; readiness badge shows 0 % |
| AC-2 | I have answered questions covering some PRD sections | Page loads | "Coming up" row shows only uncovered sections (up to 3); covered ones are absent |
| AC-3 | All 8 canonical sections are covered, no PRD generated | — | "Coming up" is empty or shows a "Ready to generate PRD" hint; score is capped at 95 % |
| AC-4 | All 8 sections covered and at least one PRD version exists | — | Score reaches 100 %; "Coming up" is empty |
| AC-5 | The workspace loads | Readiness score badge fetches | The score shown equals `Math.round(answered / (answered + remaining) * 100)`, capped per AC-3/AC-4 |
| AC-6 | The readiness score API is unreachable | Fetch fails | Badge shows "—" gracefully; no crash |
| AC-7 | I view the readiness score details | Response is consumed | `coveredSections` and `remainingSections` are available in the response payload |

---

## Test Plan

- [ ] Unit: `ReadinessScoreResponseSchema` parses valid and invalid payloads
- [ ] Unit: readiness-score route returns correct formula for 0 / 4 / 8 covered sections
- [ ] Unit: 95 % cap applies when no PRD version exists; 100 % allowed when PRD version exists
- [ ] Unit: "Coming up" chips render correctly in `ClarificationChat` for partial coverage
- [ ] `pnpm typecheck` and `pnpm build` on the tracking branch

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/projects/[id]/_components/clarification-chat.tsx` | modify | Add "Coming up" chips computed from loaded question history |
| `apps/web/app/dashboard/projects/[id]/_components/readiness-score-badge.tsx` | modify | Update to display new score formula; show `X/8 sections` label |
| `apps/web/app/api/projects/[id]/readiness-score/route.ts` | modify | Replace Prisma use-case with Drizzle query; compute new formula; validate outbound DTO |
| `packages/contracts/src/questions/history.ts` | modify | Add `ReadinessScoreResponseSchema` |
| `packages/contracts/src/questions/index.ts` | modify | Re-export new schema |

---

## Out-of-Scope

- Real-time score updates within a session (score refreshes on page reload)
- AI inference to predict specific upcoming question text
- Changes to `questionHistory` storage or credit deduction
- Changes to the PRD generation or Architecture panel

---

## Open Questions

- None

---

## Decision References

- None

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Authored for `fa-guided-clarification--question-preview-and-progress-score` | — |
