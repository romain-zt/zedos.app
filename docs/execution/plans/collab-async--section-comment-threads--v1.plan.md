# Implementation Plan: collab-async--section-comment-threads (v1)

## Parent User Story

[collab-async--section-comment-threads (v1)](../user-stories/collab-async--section-comment-threads--v1.md)

## Status

`executed`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Add a minimal per-section thread surface tied to PRD canonical sections
(`PRD_SECTIONS` from `@repo/contracts/questions/history`). Two new tables:

- `project_comment_threads` — one open or resolved thread per (project, prd_version,
  section); tracks `created_by_user_id`, `status` (`open|resolved`), `resolved_at`,
  and `owner_last_read_at` so the owner can compute "unread" without a separate
  notifications table.
- `project_comment_messages` — append-only messages with `author_user_id` + `body`.

Access is gated by the existing `requireUser` + `userHasProjectAccess` pipeline:
owners (project.userId === user.id) and active project members (incl. `commenter`
from the parent slice) can read and post. Only the owner can resolve / re-open and
only the owner sees the `unreadByOwner` flag.

Hexagonal boundaries:

- **contracts**: thread + message DTOs, request/response schemas, status enum.
- **domain**: `CommentThread`, `CommentMessage` entities + repository port.
- **application**: list-threads-for-version, post-message (creates thread on first
  message for a section), resolve, reopen, mark-read use cases.
- **infrastructure**: `DrizzleCommentThreadRepository`.
- **app**: thin Next.js route handlers under
  `/api/projects/[id]/threads/...`.
- **ui**: collapsible `SectionCommentsPanel` rendered per section in `prd-viewer.tsx`
  with thread count badge derived from `unreadByOwner`.

Share-page surface is untouched — there is no comment API mounted under `/share/**`.

---

## Layers Affected

- [x] `domain`
- [x] `application`
- [x] `contracts`
- [x] `infrastructure`
- [x] `app`
- [x] `ui`

---

## Touched Files

| Path | Operation | Rationale |
|------|-----------|-----------|
| `packages/db/src/migrations/0015_collab_comment_threads.sql` | NEW | create `project_comment_threads` + `project_comment_messages` + FKs/indexes |
| `packages/db/src/migrations/meta/_journal.json` | EDIT | append `0015_collab_comment_threads` entry |
| `packages/db/src/schema/comment-threads.ts` | NEW | Drizzle table defs |
| `packages/db/src/schema/index.ts` | EDIT | export comment-threads schema |
| `packages/db/src/types.ts` | EDIT | `NewCommentThreadRow`, `NewCommentMessageRow`, updates |
| `packages/contracts/src/collab/comment-threads.ts` | NEW | DTOs + request/response schemas |
| `packages/contracts/src/collab/index.ts` | NEW | re-exports |
| `packages/contracts/src/index.ts` | EDIT | export `./collab` |
| `apps/web/src/domain/collab/comment-thread.ts` | NEW | domain entities |
| `apps/web/src/domain/collab/comment-thread-repository.ts` | NEW | port |
| `apps/web/src/domain/collab/index.ts` | NEW | re-exports |
| `apps/web/src/application/collab/list-section-threads-usecase.ts` | NEW | list with access guard |
| `apps/web/src/application/collab/post-comment-message-usecase.ts` | NEW | create thread + first message OR append |
| `apps/web/src/application/collab/resolve-thread-usecase.ts` | NEW | owner-only resolve / reopen |
| `apps/web/src/application/collab/mark-thread-read-usecase.ts` | NEW | owner-only mark-read |
| `apps/web/src/application/collab/index.ts` | EDIT | add new exports (shared with invite slice) |
| `apps/web/src/infrastructure/persistence/comment-thread-repository.ts` | NEW | Drizzle adapter |
| `apps/web/app/api/projects/[id]/threads/route.ts` | NEW | GET list / POST message (creates thread if missing) |
| `apps/web/app/api/projects/[id]/threads/[threadId]/messages/route.ts` | NEW | POST append message |
| `apps/web/app/api/projects/[id]/threads/[threadId]/resolve/route.ts` | NEW | POST resolve/reopen (owner) |
| `apps/web/app/api/projects/[id]/threads/[threadId]/read/route.ts` | NEW | POST mark-read (owner) |
| `apps/web/app/dashboard/projects/[id]/_components/section-comments-panel.tsx` | NEW | per-section thread UI |
| `apps/web/app/dashboard/projects/[id]/_components/prd-viewer.tsx` | EDIT | mount per-section comments panel |
| `apps/web/public/messages/en/common.json` | EDIT | comments.* keys |
| `apps/web/public/messages/fr/common.json` | EDIT | comments.* keys |
| `apps/web/src/infrastructure/analytics/analytics-events.ts` | EDIT | `SECTION_COMMENT_CREATED`, `THREAD_RESOLVED` |

---

## Verification

- [x] `pnpm --filter @repo/web typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

---

## Blueprint

Generated 2026-06-04 · Filled & executed 2026-06-05.
