# Tier Enforcement Skill

**When to load:** Read this skill at the start of any command that may produce file edits. It is the authoritative gate on WHEN to delegate to `composer-2.5-fast` vs staying in Manager/Vision context.

---

## Decision matrix

| Work shape | Tier | Delegation required? |
|---|---|---|
| Planning, strategy, product thinking | Vision / Manager | No — stay in context |
| PRD discovery, feature-area maps, scope slices | Manager | No |
| Authoring governance docs (`.md`, `.mdc` in `core/`) | Manager | No — doc authoring stays in-context |
| Writing/editing **application code** (`.ts`, `.tsx`, `.js`, `.py`, `.go`, etc.) | **Executor** | **YES — fire `Task`** |
| Scaffolding files from an approved spec | **Executor** | **YES — fire `Task`** |
| Mechanical refactors (rename, search-replace across code) | **Executor** | **YES — fire `Task`** |
| Single-file config edits closely tied to planning | Manager | No (but prefer Executor if > 5 lines) |
| Mixed turn (plan + code) | Split | Plan here; fire `Task` for each code brick |

**Hard rule:** if the next tool call would be `StrReplace`, `Write`, or `EditNotebook` on a non-markdown file, you MUST fire a `Task(subagent_type: "executor")` instead.

---

## Hard rules

1. **Never write application code inline.** Any file ending in `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rb`, `.rs`, `.java`, `.kt`, `.swift`, etc. → Executor Task, not inline edit.
2. **Never scaffold a directory of code inline.** Multi-file scaffolds = one Executor Task per coherent brick.
3. **Governance docs are Manager.** Files in `.cursor/core/**`, `docs/prd/**`, `docs/product/**` are doctrine or product artifacts — Manager authoring is appropriate. No Task needed.
4. **One brick = one Task.** Never bundle a "backend + frontend + migration + test" into a single Task brief. Split first (Manager), delegate each brick (Executor).
5. **Inline override.** The user may say "just do it inline this once" — that is a valid waiver. Log it; don't nag.
6. **If unsure, delegate.** A false positive (delegating something Manager could handle) is cheap. A false negative (Manager writes 300 lines of code) is expensive.

---

## When SISO applies

Per `00-siso.mdc` §"Failure Signals" — **Tier Mismatch** is an ORANGE signal:

> Executor-shaped work attempted in Manager/Vision context without `Task` delegation.

If you catch yourself about to call `StrReplace`/`Write` on application code without having first fired a `Task`:
1. Stop.
2. Either fire the Task, or ask the user for an explicit inline waiver.

---

## Task invocation — copy-paste snippets

### Standard Executor brick

```typescript
Task({
  subagent_type: "executor",
  description: "<3–5 word summary of the brick>",
  prompt: `
## Brick brief

**Parent spec/task:** <link or inline spec section>
**Files to create/edit:**
- \`<path>\`

**What to implement:**
<exact behavioral description — no architecture decisions; those were made above>

**Tests required:**
<list tests the spec demands for this brick>

**Acceptance:**
- [ ] <observable check 1>
- [ ] <observable check 2>

Do NOT touch files outside the list above. Do NOT introduce new dependencies without noting them.
`
})
```

### Multi-brick delegation pattern (Manager → multiple Executors)

```
1. Decompose the spec into atomic bricks (Manager — in this conversation).
2. For each brick in order:
   a. Fire Task(subagent_type: "executor", ...) with the brick brief above.
   b. Wait for it to complete.
   c. Verify the output satisfies the brick's acceptance criteria.
   d. If a brick fails, diagnose here (Manager), patch the brief, re-fire.
3. After all bricks: run the full test suite (via Task) and confirm green.
```

---

## Anti-patterns (DO NOT DO)

```typescript
// ❌ WRONG — Manager writing code inline
StrReplace({
  path: "src/app/api/payment/route.ts",
  old_string: "// TODO",
  new_string: "export async function POST(req: Request) { ... }",
})

// ✅ CORRECT — Delegate to Executor
Task({
  subagent_type: "executor",
  description: "Add POST handler to payment route",
  prompt: "...<brick brief>...",
})
```

```typescript
// ❌ WRONG — Giant multi-surface brick
Task({
  subagent_type: "executor",
  prompt: "Implement the full payment system: stripe integration, webhook handler, database schema, frontend checkout UI, email notifications..."
})

// ✅ CORRECT — One brick per surface
Task({ subagent_type: "executor", description: "Stripe webhook handler", ... })
// wait → complete
Task({ subagent_type: "executor", description: "Payment DB schema migration", ... })
// wait → complete
// etc.
```

---

## Observability

When you successfully delegate to an Executor Task, log it to `.cursor/observability/turns.jsonl` (gitignored):

```json
{"ts": "<ISO>", "parent_model": "<current model>", "action": "task_delegated", "subagent": "executor", "description": "<brick name>"}
```

This is consumed by `audit-tier-compliance.ts` to track Executor-share. If the `after-tool-call` hook is active, it logs automatically — you don't need to do this manually.

---

## Task tool parity — IDE vs CI

**In Cursor IDE (interactive):**
- `Task(subagent_type: "executor", model: "composer-2.5-fast", ...)` works exactly as documented. `composer-2.5-fast` is the correct IDE slug for the Executor tier.
- Do NOT omit the `model` arg — if omitted, the Task inherits the parent agent's model (Sonnet/Opus), defeating the purpose.

**In CI cloud agents (`.github/scripts/core/`):**
- The `cursor-subagents.config.ts` file registers an `executor` subagent entry with the correct cloud API model ID. Cloud agents use this config; they do NOT need the `model` arg.
- The model mapping is: `composer-2.5-fast` (IDE slug) ↔ `composer-2.5` + `{fast: true}` (Cloud API params).

**Contract:**
```typescript
// IDE (in-conversation Task tool call)
Task({
  subagent_type: "executor",
  model: "composer-2.5-fast",  // REQUIRED in IDE
  description: "...",
  prompt: "...",
})

// CI cloud agent (via @cursor/sdk Task)
agent.task({
  subagentType: "executor",
  // model determined by cursor-subagents.config.ts
  prompt: "...",
})
```
