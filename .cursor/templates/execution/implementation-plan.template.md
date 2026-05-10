<!--
  Implementation Plan Template
  Location: .cursor/templates/execution/implementation-plan.template.md
  Usage:    copy to docs/execution/plans/<fa-kebab>--<slice-kebab>--<story-kebab>.plan.md
  Governed by: .cursor/rules/70-execution-bridge.mdc, 71-monorepo-context.mdc, 72-hexagonal-boundaries.mdc
  Authored by: architect agent (`.cursor/agents/execution/architect.md`)
  Approved by: user — only an approved Plan grants implementer authority.
-->

# Implementation Plan: {{STORY_NAME}}

## Parent User Story

[{{STORY_NAME}}](../user-stories/{{FA_KEBAB}}--{{SLICE_KEBAB}}--{{STORY_KEBAB}}.md)

## Status

<!-- One of: proposed | proposed-with-open-surface | approved | executed | superseded -->

`{{STATUS}}`

> **Layout in effect:** {{LAYOUT}} <!-- pre-migration (zedos/nextjs_space/) | post-migration (apps/web/ + packages/) -->
> **Architecture Surface:** {{SURFACE_STATUS}} <!-- resolved | open — list any UNKNOWN load-bearing fields below -->
> **NEED_HUMAN:** {{NEED_HUMAN}}
> **NEED_UPDATE:** {{NEED_UPDATE}}

---

## Approach

<!--
  3–8 sentences. The architectural shape of the change.
  Name the layers crossed, the ports introduced or extended, the contracts updated.
  Do not paste code. Cite rules: 72-hexagonal-boundaries, 73-result-rop, 74-contracts-zod, 75-drizzle, 76-better-auth, 77-nextjs.
-->

---

## Architecture Surface Block

<!--
  Required by .cursor/rules/70-execution-bridge.mdc §8. Resolve or mark UNKNOWN.
  UNKNOWN on a load-bearing field downgrades status to proposed-with-open-surface and blocks /implement.
-->

| Field | Decision |
|-------|----------|
| Source-of-truth (data) | <Postgres via Prisma (today) | Postgres via Drizzle (post-Phase 3)> |
| Auth source-of-truth | <NextAuth (transitional) | better-auth (post-Phase 2)> |
| Async/sync boundary | <synchronous per request | …> |
| Transaction boundary | <per use-case via $transaction | …> |
| External dependencies | <list of vendor SDKs touched> |
| Payment shape (if money) | <Stripe Checkout + Webhook + Idempotency-Key | n/a> |

### Surface Blockers

- {{SURFACE_BLOCKERS_OR_NONE}}

---

## Layers Affected

<!-- Cite each layer touched. Use names, not paths. The Touched Files section names paths. -->

- [ ] `domain` — {{DOMAIN_CHANGES_OR_NONE}}
- [ ] `application` — {{APPLICATION_CHANGES_OR_NONE}}
- [ ] `contracts` — {{CONTRACTS_CHANGES_OR_NONE}}
- [ ] `infrastructure` — {{INFRA_CHANGES_OR_NONE}}
- [ ] `app` (routes, server actions, server components) — {{APP_CHANGES_OR_NONE}}
- [ ] `ui` — {{UI_CHANGES_OR_NONE}}
- [ ] `shared` — {{SHARED_CHANGES_OR_NONE}}

---

## Touched Files (exact paths)

<!--
  Authoritative allow-list for the implementer. Paths use the layout in effect (see Status block above).
  Anything not on this list is out of scope. Plan revision required to expand.
-->

| Path | Operation | Rationale |
|------|-----------|-----------|
|      |           |           |

---

## Contracts Changed

<!--
  zod schemas added, modified, or removed in `contracts/`.
  Each row gates on .cursor/rules/74-contracts-zod.mdc — including the contract test.
-->

| Schema | Operation | Test fixture |
|--------|-----------|--------------|
|        |           |              |

---

## Migrations

<!--
  Schema migrations. Required when persistence touched.
  One logical change per row; one Plan ships at most one migration (per .cursor/rules/79-pr-sizing.mdc §2).
  Pre-migration: `prisma migrate` step. Post-migration: `drizzle-kit generate`.
-->

| Migration name | Tables touched | Backwards-compatible? |
|----------------|----------------|------------------------|
|                |                |                        |

---

## Tests

<!--
  Test files added or updated. Every change ships with at least one test row.
  Concurrency-critical work (credit / payment / quota) ships with at least one concurrent integration test.
-->

| Path | Type | Asserts |
|------|------|---------|
|      | unit / integration / contract / e2e |  |

---

## Dependencies Added

<!--
  Packages introduced. Plans that omit this section are not allowed to install dependencies.
  Cite `package.json` location explicitly (per-package post-migration).
-->

- {{PACKAGE_NAME_AND_REASON_OR_NONE}}

---

## Rollback

<!--
  How to undo this change cleanly if it fails after merge.
  - Forward-only schema migrations: revert via inverse migration in a follow-up.
  - Idempotency-keyed side effects: replay the same key to no-op.
  - Feature flags: list the flag and default state.
-->

---

## Risks

<!--
  Concrete risks, not platitudes. Each risk gets a mitigation or an explicit "accepted".
-->

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
|      |            |        |            |

---

## Out of Scope (deliberate)

<!-- Behavior the Plan deliberately excludes. Anything here belongs to a follow-up Plan. -->

- 
- 

---

## Adversarial Review

<!--
  Filled by domain-guardian + scope-critic before status moves to `approved`.
  Architect drafts the Plan; adversaries grade it.
-->

| Reviewer | Verdict | Findings |
|----------|---------|----------|
| domain-guardian | PASS / REVISE / BLOCK | |
| scope-critic | PASS / REVISE / BLOCK | |

---

## Approval

<!--
  No /implement runs without an `approved` checkbox here AND a Patch Intent Summary
  in the immediately preceding chat turn.
-->

- [ ] User reviewed and approved this Plan
- [ ] Patch Intent Summary will be produced before any code edit
- [ ] Verification steps (typecheck / lint / test / build) defined in §Tests above

**Approval status:** {{APPROVAL_STATUS}} <!-- pending | approved | revoked -->
**Approval date:** {{APPROVAL_DATE}}

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
|      |        |        |
