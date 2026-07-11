# Cursor Workflow

Idea → PRD → scope → architecture → spec → test → implementation, governed end to end.

## Layered layout

```
.cursor/
├── core/       ← framework source of truth (committed; treat as read-only in projects)
│   ├── rules/        commands/    agents/    skills/
│   ├── templates/    checkers/    hooks/
│   └── framework.manifest.json   (M3: self-evolving verifier index)
└── project/    ← per-project additions (gitignored on this framework repo)
    ├── rules/  commands/  agents/  skills/  templates/  hooks/
    └── README.md
```

The Cursor IDE loads `.cursor/rules/**/*.mdc` and `.cursor/skills/**/SKILL.md` recursively, so `core/` and `project/` both load automatically.

**Rule:** never edit `core/` inside a downstream project. Put project-specific additions in `project/`. If a `core/` artifact needs to change, propose a Framework Decision (FD-NNN) back to this repo.

Project specifics live in **`docs/project.config.md`** — nothing project-specific is hardcoded in `core/`.

## The flow

```
/intake  ── classify · SISO · setup-readiness · route ──────────────┐
                                                                     │
  idea ───────▶ /prd            (discover → converge → update)       │
  scope ──────▶ /feature-area   (map → validate → slice)             │
              ▶ /user-story      (propose → refine → promote)        │ each step
              ▶ /spec            (propose → refine → promote)        │ gated by the
  architecture ▶ /domain architecture  + 40-architecture-baseline   │ scope-readiness
  build ──────▶ /implement      (plan → test → run → verify → review)│ checker
  expertise ──▶ /domain <name>  (backend/http/event/websocket/…)     │
                                                                     ┘
```

Start anything you're unsure about with **`/intake`** — it routes you to the right command and checks the setup can handle the request first.

Other entry points: **`/setup`** (always-first project setup), **`/btw "…" pN`** (queue an input with priority 0–5), **`/quality-sweep`** (periodic code-health pass).

## Model tiers (`rules/20-model-routing.mdc`)

| Tier | Model | Owns |
|------|-------|------|
| **Vision** | `claude-opus-4-6` | big plans, strategy, architecture & business decisions, high-risk review, triage/delegation |
| **Manager** | `claude-4.6-sonnet` | planning, scoping, splitting into bricks, routine review |
| **Executor** | `composer-2.5-fast` | one brick — one Task / one commit, test-first code |

## Doctrine rules

| Rule | Enforces |
|------|----------|
| `00-siso.mdc` | input quality before execution |
| `05-project-setup.mdc` | setup is always first: clean stack pinned latest, minimal v0 catalog, pickable apps, visible first page |
| `10-prd-discovery.mdc` · `11-prd-question-loop.mdc` | PRD discovery |
| `feature-area-workflow.mdc` · `user-story-workflow.mdc` | product decomposition chain |
| `20-model-routing.mdc` | model tier per action |
| `30-test-strategy.mdc` | test-first; contract/integration/unit over e2e |
| `40-architecture-baseline.mdc` | monorepo · Payload (i18n+S3) · Postgres · MinIO |
| `50-code-quality.mdc` | thin boundaries · extract core logic · single-item handlers · tooling-first |
| `51-backend-code.mdc` | server layering (boundary→domain→data) · validate at edge · typed errors |
| `52-frontend-code.mdc` | thin components · logic in hooks · design tokens · mobile-first a11y |
| `implementation-workflow.mdc` | spec → test → implementation gates |
| `execution-loop.mdc` | autonomous queue orchestration |
| `intake-flow.mdc` | the front-door router |
| `60-status-lifecycle.mdc` | status lifecycle (todo→in-progress→in-review→validated→complete, +to-qa-human/blocked) + append-only status log |
| `61-input-queue.mdc` | `/btw` priority input queue + 0–5 step scheduling (priority 0 = next, absolutely) |
| `62-feature-decomposition.mdc` | split features on pickup; each part built by its specialist (design/backend/frontend/http/copy) |
| `63-two-model-challenge.mdc` | every plan/decomposition challenged by a second, different model before converging |

## Domain specialists (`/domain <name>`)

Engineering: `architecture` (Vision) · `backend` · `http` · `event` · `websocket`.
Product/brand: `design` · `copywriter` · `marketing` · `business` (Vision).
Each has a skill (`skills/domains/<name>`) + a specialist agent (`agents/domains/`).

## Architecture & starter template

Default stack is fixed (`40-architecture-baseline.mdc`). Don't re-litigate it per
feature. Fork the clonable skeleton to start:

```
.cursor/core/templates/starter-monorepo/   # next-forge direction + Payload(i18n+S3) + docker-compose(Postgres+MinIO)
```

## Enabling implementation

Implementation is **off by default**. To turn it on for a project:

1. Copy `.cursor/core/templates/product-decisions/PD-implementation-phase.template.md` → `docs/product-decisions/PD-NNN-implementation-phase.md`, set `status: approved`.
2. In `docs/project.config.md` set **Implementation governance enabled: yes** and the forbidden-paths default.

Then `/implement` (spec → test → run → verify → review) is unlocked for `delivery-ready` Feature Areas.

## New project bootstrap

1. `/prd init` — scaffold the PRD workspace.
2. Create `docs/project.config.md` from `.cursor/core/templates/project/project.config.template.md` (name, priority bands, v0 boundary).
3. Fork `.cursor/core/templates/starter-monorepo/` for the code.
4. `/intake "<your idea>"` and follow the route.
