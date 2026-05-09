<!--
  Feature Area Template
  Location: .cursor/templates/product/feature-area.template.md
  Usage: copy to docs/product/feature-areas/<kebab-name>.md
  Governed by: .cursor/rules/feature-area-workflow.mdc
-->

# Feature Area: <!-- NAME -->

## Status

<!-- One of: exploratory | validated | blocked | deferred -->

`STATUS`

> **NEED_HUMAN:** <!-- true | false — set true if any blocker requires a product decision before this area can be decomposed -->
> **NEED_UPDATE:** <!-- true | false — set true if templates, rules, or checkers are missing/incomplete for this area -->

---

## PRD Source

<!-- Link to the PRD section(s) that ground this Feature Area. -->

- `docs/prd/PRD.md` §<!-- section name -->
- Related open questions: <!-- Q-NNN, Q-NNN — or "none" -->
- Related product decisions: <!-- PD-NNN — or "none" -->

---

## Product Intent

<!-- 2–4 sentences. What user problem does this area solve? 
     Use user-value language. No technical terms. No architecture. -->

---

## In Scope

<!-- Concrete behaviors the product must support inside this area.
     Use plain language. Not implementation details. -->

- 
- 

## Out of Scope

<!-- Behaviors explicitly excluded. Reference PRD exclusions where possible. -->

- 
- 

---

## Business Objects Touched

<!-- List the product-level data entities this area creates, reads, updates, or deletes.
     Name them as product objects, not database tables.
     Example: Project, PRD Version, Question History Entry, Credit Balance, Share Link -->

| Object | Relationship |
|--------|-------------|
|        |             |

---

## User Journeys Touched

<!-- Reference Core User Journeys from PRD.md by number or name.
     Example: Journey 3 (Clarify and iterate), Journey 6 (Credits) -->

- 
- 

---

## Dependencies

<!-- What must exist or be validated before this Feature Area can be worked on?
     Format: <dependency name> — <status: ready | pending | blocked | unknown> -->

| Dependency | Status | Notes |
|------------|--------|-------|
|            |        |       |

---

## Risks

<!-- Product-level risks specific to this area.
     Not engineering risks. Not "it's complex." -->

- 
- 

---

## Open Blockers

<!-- Unresolved questions or decisions that prevent decomposing this area into Scope Slices.
     Each blocker must have: what it is, why it blocks, and whether NEED_HUMAN is set. -->

| Blocker | Blocks | NEED_HUMAN |
|---------|--------|------------|
|         |        |            |

---

## Candidate Scope Slices

<!-- Proposed slices inside this Feature Area. Each must be small enough to produce user stories.
     Do not define slices before the area itself is validated.
     Format: Slice name — one-line description — tentative status -->

| Slice | Description | Status |
|-------|-------------|--------|
|       |             |        |

---

## Readiness Verdict

<!-- Fill in before marking status = validated. -->

- [ ] PRD source sections read
- [ ] Product intent stated without technical language
- [ ] Business objects enumerated
- [ ] User journeys identified
- [ ] In-scope / out-of-scope explicitly separated
- [ ] No unresolved PRD open questions affecting this area
- [ ] Deferred behaviors explicitly named
- [ ] Candidate Scope Slices are individually small enough

**Verdict:** <!-- NOT READY | READY FOR SCOPE SLICES | BLOCKED — reason -->

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
|      |        |        |
