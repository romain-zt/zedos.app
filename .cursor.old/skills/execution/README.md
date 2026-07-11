# Execution Skills

Skills are repeatable transformations the agent applies during `/implement`, `/fix`, and the constructive iteration loop. Each skill is a directory with a `SKILL.md` (≤ 500 lines per Cursor's `create-skill` convention).

A skill teaches the agent **how** to perform one well-defined transformation: "how do I add a Next.js route handler that obeys our rules?". The rules say what is allowed; the skill says how to do it correctly the first time.

## Available skills

### Composing the application surface

| Skill | What it does |
|-------|--------------|
| [`add-route-handler/`](./add-route-handler/SKILL.md) | Next.js App Router route handler that obeys `73-result-rop` + `74-contracts-zod` + `77-nextjs` |
| [`add-server-action/`](./add-server-action/SKILL.md) | Server action with discriminated `{ ok, ... }` return shape and `revalidatePath` discipline |
| [`add-page-route/`](./add-page-route/SKILL.md) | `app/.../page.tsx` with `loading.tsx`, `error.tsx`, `not-found.tsx`, and metadata |

### Composing the application core

| Skill | What it does |
|-------|--------------|
| [`add-usecase/`](./add-usecase/SKILL.md) | Domain use case in the application layer with injected ports and `Result<T, E>` |
| [`add-driving-endpoint/`](./add-driving-endpoint/SKILL.md) | Adapter that calls a use case from a route or action — the seam between `app/` and `application/` |
| [`add-driven-adapter/`](./add-driven-adapter/SKILL.md) | Outbound adapter (DB / HTTP / vendor SDK) implementing a domain port |
| [`add-zod-contract/`](./add-zod-contract/SKILL.md) | New zod schema in `contracts/` with contract test fixtures |

### Persistence

| Skill | What it does |
|-------|--------------|
| [`add-drizzle-migration/`](./add-drizzle-migration/SKILL.md) | Drizzle schema change + migration generation (post-migration) |

### Auth

| Skill | What it does |
|-------|--------------|
| [`add-better-auth-flow/`](./add-better-auth-flow/SKILL.md) | sign-in / sign-up / session / protected-route flow with better-auth |

### Testing

| Skill | What it does |
|-------|--------------|
| [`add-test/`](./add-test/SKILL.md) | Vitest unit / integration / contract test, or Playwright e2e — colocated per `78-testing.mdc` |

### Read-only research

| Skill | What it does |
|-------|--------------|
| [`explore-monorepo/`](./explore-monorepo/SKILL.md) | Read-only exploration recipe — symbol lookup, dependency tracing, drift checks |

### Improvement loops

| Skill | What it does |
|-------|--------------|
| [`improve-from-review/`](./improve-from-review/SKILL.md) | Apply Reviewer findings back to the code via `/fix`-style iterations |
| [`improve-config/`](./improve-config/SKILL.md) | Improvements to the `.cursor/` system itself (rules, agents, skills, templates, checkers, hooks) |
| [`split-technical-story/`](./split-technical-story/SKILL.md) | Split an oversized scope into reviewable units when `/split` runs |

## Intentionally NOT included

The following ZedOS skills are NOT mirrored to zedos:

| Skill | Why not |
|-------|---------|
| `add-eventbridge-dispatch` | zedos has no AWS EventBridge usage. The `EventBus` in `zedos/nextjs_space/src/shared/events/event-bus.ts` is dead code (per `docs/retro/zedos-monorepo-retro.md` finding #22) and is slated for deletion or activation in Phase 1. v0 does not justify async dispatch. |
| `add-sqs-consumer` | Same as above — no SQS in zedos. v0 is synchronous-per-request (per `.cursor/rules/70-execution-bridge.mdc` §8 Architecture Surface defaults). |

If queues / events / async runtime are introduced post-v0, mirror these from ZedOS then.

## Activation

Skills are not auto-applied. They are loaded by name when the Implementer / specialist agent declares it needs the recipe. Each skill's `disable-model-invocation: true` frontmatter enforces this.

## Hard rules

- Every skill is ≤ 500 lines (Cursor cap, per `~/.cursor/skills-cursor/create-skill/SKILL.md`).
- Every skill states purpose, inputs, outputs, failure modes, and references the rules it enforces.
- Skills do not duplicate rule content — they cite the rule and demonstrate the application.
- A skill that cannot be applied without a Plan revision says so explicitly (and routes back to `/plan`).
