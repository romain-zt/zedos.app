# User Story: Owner views question history (v0)

## Parent Scope Slice

[Owner views question history](../../product/scope-slices/question-history--owner-views-question-history.md)

## Status

`done`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a signed-in product owner, I want to open a dedicated history view in my private project workspace so that I can see every structured clarification decision (question, options, answer, comment, interpretation, PRD impact, and PRD version link) without exposing that log on the share surface.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I am signed in and I own the project | I open the project workspace History tab | I see a list of decision entries for that project in chronological order |
| AC-2 | The API returns valid rows | Each entry renders | All six PRD fields are visible when present: structured question, available options (decision UI), founder answer, optional comment, AI interpretation, PRD impact |
| AC-3 | A row has a `prdVersionId` | I view that entry | I can tell which PRD version it belongs to (label resolved when version list is loaded) |
| AC-4 | No rows exist yet | I open History | I see an empty state that explains decisions will appear after clarification |
| AC-5 | The list is loading | — | I see a loading skeleton |
| AC-6 | Fetch fails or the payload fails contract validation | — | I see an error state with a way to retry |
| AC-7 | I return to History after making a new decision | — | The list refetches so new entries show without a full reload |

---

## Test Plan

- [ ] `pnpm typecheck` (repo)
- [ ] `pnpm build` (repo)
- [ ] Manual: open History with 0 / N entries; verify six fields + version label; toggle tab and confirm refresh

---

## Touched Files (predicted)

| Path or layer | Change type | Reason |
|---------------|-------------|--------|
| `apps/web/app/dashboard/projects/[id]/_components/question-history.tsx` | modify | Full history UI + client-side validation |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | modify | Pass PRD version list + tab visibility for refetch |

---

## Out-of-Scope

- Search, filters, export, editing or deleting entries
- Anonymous share surface
- New API routes or persistence (GET already exists)

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
| 2026-05-11 | Authored for orchestrator phase `fa-question-history--owner-views-question-history` | — |
