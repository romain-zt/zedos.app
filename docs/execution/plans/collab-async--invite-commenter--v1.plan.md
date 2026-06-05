# Implementation Plan: collab-async--invite-commenter (v1)

## Parent User Story

[collab-async--invite-commenter (v1)](../user-stories/collab-async--invite-commenter--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Extend the existing `project_members` table with a new `commenter` role (TS-only — the
existing `role` column is unconstrained `text`). The current invite repository accepts
`editor | viewer`; we widen it to `editor | viewer | commenter` and add a dedicated
application use case `InviteCommenterUseCase` that enforces the 3-active-commenter
cap and delegates persistence to the existing `DrizzleProjectMemberRepository.invite`.
A new `DELETE` endpoint exposes revoke semantics. Commenter access is interpreted by
the existing `requireUser` + `userHasProjectAccess` pipeline (already-built for
read-only project visibility for `status = active` members) — no new auth surface is
required.

The legacy editor/viewer affordances in `ProjectMembersPanel` are replaced by a
commenter-only invite UI (per Scope Slice "hide legacy Team members / editor-viewer
invite UI"). The panel is mounted from the project workspace Settings dialog as a
"Collaborators" section.

Hexagonal boundaries preserved:

- **contracts**: `commenter` added to `ProjectMemberRoleSchema`; new invite-commenter
  request body.
- **application**: `InviteCommenterUseCase` (owner assert + cap check + invite).
- **infrastructure**: `DrizzleProjectMemberRepository` widened with `countActiveCommenters`
  and `revoke`; invite already returns existing rows when present.
- **app**: thin route handler `POST/DELETE /api/projects/[id]/members/...`.

---

## Layers Affected

- [ ] `domain`
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [x] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/schema/project-members.ts` | EDIT | add `commenter` to `projectMemberRoles` |
| `packages/contracts/src/project/members.ts` | EDIT | extend role enum; add `InviteCommenterRequestSchema`; tighten invite role union |
| `apps/web/src/application/collab/invite-commenter-usecase.ts` | NEW | owner check + 3-cap + invite |
| `apps/web/src/application/collab/revoke-member-usecase.ts` | NEW | owner-only delete by member id |
| `apps/web/src/application/collab/index.ts` | NEW | re-exports |
| `apps/web/src/infrastructure/persistence/project-member-repository.ts` | EDIT | widen invite role; add `countActiveCommenters` + `revoke` + `findById` |
| `apps/web/app/api/projects/[id]/members/route.ts` | EDIT | branch invite body on `role === 'commenter'` to use case |
| `apps/web/app/api/projects/[id]/members/[memberId]/route.ts` | NEW | DELETE = owner revoke |
| `apps/web/app/dashboard/projects/[id]/_components/project-members-panel.tsx` | EDIT | swap to commenter-only invite + revoke + cap state |
| `apps/web/app/dashboard/projects/[id]/_components/project-workspace.tsx` | EDIT | mount `ProjectMembersPanel` in Settings dialog |
| `apps/web/public/messages/en/common.json` | EDIT | `members.cap*`, `members.commenter`, `members.revoke` keys |
| `apps/web/public/messages/fr/common.json` | EDIT | same in FR |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | EDIT | `COMMENTER_INVITED`, `COMMENTER_REVOKED` |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm test` (existing suite unaffected — no new tests added in this slice)
- [ ] `pnpm build`

---

## Blueprint

Generated 2026-06-04 · Filled & executed 2026-06-05.
