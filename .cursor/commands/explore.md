# /explore — Read-only codebase exploration

## Usage

```txt
/explore <question>
```

Lead agent: `monorepo-explorer` (`.cursor/agents/execution/monorepo-explorer.md`) for narrow questions; `monorepo-analyst` (`.cursor/agents/execution/monorepo-analyst.md`) for graph/metric questions.
Operational skill: `.cursor/skills/execution/explore-monorepo/SKILL.md`

---

## Purpose

`/explore` answers narrow factual questions ("where does X live?", "what calls Y?", "what tests cover Z?") and structural questions ("how do these layers depend on each other?", "how many `as any` casts have been added since Phase 1?") without writing files.

`/explore` is the read-only entry point. It produces no Plans, no PRs, no edits.

---

## Pre-flight

1. Read `.cursor/rules/71-monorepo-context.mdc` to confirm the layout in effect.
2. Read `.cursor/rules/72-hexagonal-boundaries.mdc` §3 for the import matrix when the question touches layers.
3. **SISO classification:** EXECUTION (read-only). `/explore` does not require ORANGE/RED clearance, but classifies as EXECUTION for audit purposes.

---

## Routing

| Question shape | Agent | Output |
|----------------|-------|--------|
| "where is X defined?" | `monorepo-explorer` | path:line citations |
| "what calls Y?" | `monorepo-explorer` | path:line list |
| "what does this file do?" | `monorepo-explorer` | summary + citations |
| "how do `application/` and `infrastructure/` depend on each other?" | `monorepo-analyst` | dependency table or canvas |
| "how many `as any` casts since Phase 1?" | `monorepo-analyst` | metric + drift report |
| "which routes exceed 30 lines?" | `monorepo-analyst` | list with citations |
| "which packages are below coverage floor?" | `monorepo-analyst` | per-package delta table |

---

## Output formats

### Narrow question

```txt
Question: <user's question>

Answer:
- <fact 1> — <path>:<line>
- <fact 2> — <path>:<line>

Related rules:
- .cursor/rules/<rule>.mdc — <one-line relevance>

Recommended follow-up:
- <next /explore question or routing>
```

### Structural question (canvas-shaped)

When the answer is graph- or table-shaped (≥ 5 rows, dependency-graph, drift-trend), produce a Cursor canvas under `.cursor/canvases/<topic>.canvas.tsx`. Markdown tables don't render at scale; canvases do.

For one-off lookups, plain markdown is fine.

---

## Hard rules

- No file writes (read-only).
- No proposing code changes (use `/plan`).
- No running `verifier`.
- No reading `tree.md` (26603 lines) without a clear, explicit reason — default to targeted `Glob` + `Read`.
- Cite every claim. Uncited answers are not answers.
- Stay in the question — don't drift into "and you should also know Y".

---

→ /plan → /implement → /review → /commit → /pr → /babysit
