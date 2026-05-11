<!--
  Scope Slice — services-feature-split — prd-to-feature-split
-->

# Scope Slice: PRD to feature split

## Parent Feature Area

[Services / feature split](../feature-areas/services-feature-split.md)

## Status

`ready-for-user-stories`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## User Value

A founder turns a stable, versioned PRD into named feature clusters they can tweak and confirm before any user-story work begins.

---

## Exact Boundary

### Included Behavior

- Choosing which PRD version is the source for the split (must be reachable from the workspace the founder already uses for PRD versioning).
- Generating or surfacing an initial proposal of clusters: each cluster has a short label and a one-line description of user value plus an explicit boundary from neighboring clusters.
- Letting the founder rename clusters, rewrite one-line descriptions, merge or split clusters, and reorder clusters for execution priority—without rewriting the underlying PRD text.
- Persisting the confirmed split so downstream areas can treat it as the single handoff artifact for story generation.

### Excluded Behavior

- Generating user stories, implementation tasks, or Cursor prompts (owned by downstream Feature Areas).
- Choosing runtime architecture, services, schemas, repos, APIs, deployment boundaries, or technology stack.
- Multi-user collaborative editing or inviting others to edit the split (PRD solo-founder model).
- Changing core PRD clarification or versioning rules (those remain FG-PRD-V0 concerns).

---

## UX States

| State | When | What the user sees / experiences |
|-------|------|----------------------------------|
| Empty / gated | Selected project has no PRD versions ready as split input yet | Guided message to complete or capture a PRD version first |
| Choosing input | Versions exist but none explicitly selected for split | List or picker of versions plus short guidance that only stable drafts should be chosen |
| Loading / in-progress | Split proposal is generating or saving | Busy state with cancel-safe expectation that partial saves are prevented or reconciled clearly |
| Review | Proposal returned | Structured list of clusters with labels, one-line descriptions, and boundary cues; affordances to edit, merge, split, reorder |
| Error recoverable | Network or transient generation failure | Clear error summary and retry without losing manual edits |
| Error blocked | Irrecoverable upstream state (missing version payload) | Blocked messaging with correction path toward PRD versioning |
| Success confirmed | Founder confirms split | Confirmation state and unobstructed navigation toward user-story generation downstream |
| Partially constrained | Credits required for AI-assisted flows | Explanation of prepaid credit requirement and recharge path per global credit behavior |

---

## Data Touched

| Object | Operation | Notes |
|--------|-----------|-------|
| PRD version | read | Input snapshot for clustering |
| Feature group / cluster | create, update, delete via merge-split | Outputs of founder adjustments |
| Feature split artifact | create, update | Handoff aggregate linking clusters to chosen PRD version |

---

## Credit / Payment Impact

Assumes FG-POST-PRD-V1 assisted generation may debit the internal prepaid credit ledger if it uses AI. Exact burn tier is operator-config/TBD until a dedicated matrix row exists; founders see gating messaging consistent with FG-PRD-V0 policies (blocked at insufficient balance except where global grace/auto-reload rules apply).

---

## Sharing / Privacy Impact

None — split work remains owner-private inside the authenticated workspace until sharing rules from other Feature Areas explicitly publish something else.

---

## Feedback / Instrumentation Impact

None — FG-PRD-V0 milestone feedback prompts are not asserted for FG-POST-PRD-V1 steps in PRD.md; revisit if product attaches milestone prompts later.

---

## Dependencies

| Dependency | Type | Status | Notes |
|------------|------|--------|-------|
| PRD versioning Feature Area — stable browse/select version flows | Feature Area | pending | Founder must reliably open the PRD slice used as clustering input |

---

## Blockers

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
| None | — | false |

---

## Acceptance-Level Outcome

A founder can select a qualifying PRD version, receive or refresh a clustered proposal, materially adjust cluster names and descriptions, persist those edits, and confirm a split artifact that downstream user-story generation can consume without ambiguity.

---

## Readiness for User Stories

- [x] User value stated without implementation language
- [x] Exact boundary defined (included + excluded)
- [x] UX states enumerated (including error and empty states)
- [x] Business objects named
- [x] Credit / payment impact assessed
- [x] Sharing / privacy surface assessed
- [x] Feedback / instrumentation impact assessed
- [x] All dependencies named and their status known
- [x] All blockers resolved or NEED_HUMAN=true explicitly set
- [x] Acceptance-level outcome is behavioral (not a test or code spec)

**Verdict:** READY FOR USER STORIES

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-05-11 | Scaffolded from approved `/feature-area slice services-feature-split` proposal via `/feature-area scaffold-slices` | — |
| 2026-05-11 | Promoted to ready-for-user-stories after CLEAR readiness check (`/feature-area promote-slice`) | — |
