---
name: explore-monorepo
description: Read-only exploration recipe — symbol lookup, dependency tracing, drift checks, layer-graph queries. Use when /explore is invoked or when an agent needs codebase context before authoring a Plan.
disable-model-invocation: true
---

# Explore Monorepo

Use when `/explore` runs, when the Architect needs codebase context for a Plan, or when the Reviewer needs to confirm a dependency hypothesis.

This skill is paired with the `monorepo-explorer` and `monorepo-analyst` agents — explorer for narrow questions, analyst for graph-shaped or metric-shaped questions.

## When to use

- The user asks a "where does X live?" or "what calls Y?" question.
- The Architect needs to confirm what already exists before drafting `Touched Files`.
- The Reviewer needs to confirm a code path before flagging a finding.

## Read first

- `.cursor/rules/71-monorepo-context.mdc` (which layout is in effect)
- `.cursor/rules/72-hexagonal-boundaries.mdc` §3 (the import matrix to validate hypotheses)

## Recipe — narrow question (use `monorepo-explorer`)

### Step 1 — Pick the right tool

| Goal | Tool |
|------|------|
| Find a file by name | `Glob` |
| Find text by content | `Grep` |
| Read a known file | `Read` |
| Trace "who calls this function?" | `Grep` for the function name |
| Trace "what does this import?" | `Read` the file |
| Trace transitive imports | `monorepo-analyst` (agent) |

Never use `Task` / subagent for narrow lookups — it costs more than it returns.

### Step 2 — Cite paths and line numbers

Every answer references files by `<path>:<start>-<end>` or `<path>:<line>`. Hand-waved answers are wrong even when they're right.

### Step 3 — Cross-reference governing rules

When a question touches a layer, mention the governing rule (`72-hexagonal-boundaries.mdc`, `73-result-rop.mdc`, etc.) so the consumer knows what's allowed.

### Step 4 — Output

```txt
Question: <user's question>

Answer:
- <fact 1> — <path>:<line>
- <fact 2> — <path>:<line>

Related rules:
- .cursor/rules/<rule>.mdc — <one-line relevance>

Recommended follow-up:
- <next /explore question or routing to architect / specialist>
```

## Recipe — structural / drift question (use `monorepo-analyst`)

### Step 1 — Identify the analysis type

| Question | Analysis |
|----------|----------|
| "How do these two layers actually depend on each other?" | Dependency graph subset |
| "How many `as any` casts have been added since Phase 1?" | Frozen-violation accounting |
| "Which routes exceed 30 lines?" | Drift report against `77-nextjs.mdc` |
| "Which packages have coverage below floor?" | Coverage delta per package |

### Step 2 — Choose the output format

- Graph or table data → Cursor canvas (`.cursor/canvases/<topic>.canvas.tsx`)
- Drift report → structured markdown
- One-off lookup → same shape as narrow question

### Step 3 — Run the analysis

Use `Glob` + `Grep` + `Read` against the layout in effect. For coverage analysis, run `pnpm test:coverage` and parse the report.

### Step 4 — Cite every claim

Every metric has a number and a citation. Every drift claim points at a rule and a file. No "feels like" findings.

## What you do NOT do

- Write files (read-only).
- Propose specific code changes (use `architect`).
- Run `verifier` (read-only).
- Read entire massive files (`tree.md` — 26603 lines) without a clear reason; default to targeted `Glob` + `Read`.

## Hard rules

- Read-only.
- No speculation. If a symbol doesn't exist where you expected, say so explicitly.
- Cite every claim.
- Stay within the question — don't drift into "and you should also know Y".
