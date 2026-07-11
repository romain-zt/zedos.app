# Framework Decision NNN — [Short Title]

**FD-NNN** · Status: `draft | proposed | approved | rejected | superseded`
Date: YYYY-MM-DD
Author: [name or "framework-team"]
Supersedes: *(FD-NNN if applicable)*

---

## Context

What situation or gap led to this decision? Why does a change to the framework governance layer need to be recorded here?

---

## Decision

**One clear, present-tense statement of what is being decided.**

> Example: "The manifest entry `command.prd-init` is renamed to `command.prd-init-scaffold` and its path changes from `commands/prd-init.md` to `commands/prd-init-scaffold.md`."

---

## Rationale

Why this choice over the alternatives?

---

## Alternatives considered

| Option | Why rejected |
|--------|-------------|
| Keep as-is | ... |
| ... | ... |

---

## Impact

- **Affected manifest entries:** [list entry IDs]
- **Files deleted / renamed:** [list paths]
- **Downstream projects must:** [migration step or "no action required"]

---

## Append-only invariant

This FD satisfies the append-only invariant check (FR-2N+5) for the following manifest entry deletions/renames:

- `<entry.id>` — [deleted | renamed to `<new-id>`]

The PR that removes/renames these entries MUST reference this FD number in its description.

---

## Status history

| Date | Status | Note |
|------|--------|------|
| YYYY-MM-DD | draft | Created |
