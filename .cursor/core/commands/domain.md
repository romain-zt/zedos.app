# /domain — Domain Specialist Dispatcher

> **Tier note:** domain specialists plan and review in their native tier. Architecture/business = Vision; backend/http/event/websocket = Manager plans, Executor implements. All code output fires `Task(subagent_type: "executor")`. See `.cursor/core/skills/tier-enforcement/SKILL.md`.

## Usage

```txt
/domain <name> [request]
```

Routes a request to a domain specialist skill + agent. Use when work needs focused
expertise in one domain (architecture, backend, an API surface, async/events,
real-time, UI, copy, marketing, or business reasoning).

## Domains

| Name | Skill | Agent | Tier |
|------|-------|-------|------|
| `architecture` | `.cursor/core/skills/domains/architecture/SKILL.md` | `architecture-specialist` | Vision (`claude-opus-4-6`) |
| `backend` | `.cursor/core/skills/domains/backend/SKILL.md` | `backend-specialist` | Manager (`claude-4.6-sonnet`) |
| `http` | `.cursor/core/skills/domains/http/SKILL.md` | `http-specialist` | Manager |
| `event` | `.cursor/core/skills/domains/event/SKILL.md` | `event-specialist` | Manager |
| `websocket` | `.cursor/core/skills/domains/websocket/SKILL.md` | `websocket-specialist` | Manager |
| `design` | `.cursor/core/skills/domains/design/SKILL.md` | `design-specialist` | Manager |
| `copywriter` | `.cursor/core/skills/domains/copywriter/SKILL.md` | `copywriter-specialist` | Manager |
| `marketing` | `.cursor/core/skills/domains/marketing/SKILL.md` | `marketing-specialist` | Manager |
| `business` | `.cursor/core/skills/domains/business/SKILL.md` | `business-specialist` | Vision (`claude-opus-4-6`) |

## Behavior

1. Resolve `<name>` to a row above. If unknown, list the domains and stop.
2. Load that domain's **skill** and adopt its doctrine.
3. Run as the matching **agent** at its model tier (`.cursor/core/rules/20-model-routing.mdc`). For a heavy/parallel task, delegate to the specialist as a subagent.
4. Produce the skill's output format. Specialists **plan and review**; they do not write application code — implementation goes through `/implement` with an Executor.

## Routing notes

- Multiple domains in one request? Run them in sequence (e.g. `architecture` → `backend` → `http`), or fan out specialists in parallel, then reconcile.
- A specialist's output feeds the relevant Spec section (Data Model, Contract, Async, UI Surface) or the PRD (business/marketing).
- Don't use `/domain` to bypass the product chain — product scope still flows PRD → Feature Area → … → Spec.

## Hard rules

- No code writes from `/domain` — specialists produce plans, designs, contracts, copy, or analysis.
- Respect the model tier per domain. Architecture and business are Vision-tier.
- Surface unresolved product/architecture trade-offs as `NEED_HUMAN`.
