# Setup Readiness Checker

Governed by: `.cursor/core/rules/intake-flow.mdc`.

Run at the start of `/intake` (and any time the workflow itself may be stale) to
decide whether the `.cursor/**` setup can handle the incoming request **before**
doing the work. Answer each **PASS / FAIL / SKIP (reason)**. A FAIL means a
**setup gap** — propose the missing rule/skill/command/agent/template before (or
alongside) routing the request.

---

## Part A — Inventory present

The canonical list of framework artifacts is `framework.manifest.json` (`.cursor/core/framework.manifest.json`). For each check below, the manifest is the source of truth; the checker is the runtime probe.

- **SR-01 · Workflow spine exists.** `.cursor/core/rules/` has the governance rules (`00-siso`, `10-prd-discovery`, `feature-area-workflow`, `user-story-workflow`, `execution-loop`, `20-model-routing`, `30-test-strategy`, `40-architecture-baseline`, `implementation-workflow`). Verify against manifest entries with `kind: "rule"` and `status: "active"`.
- **SR-02 · Commands cover the stage** the request needs (`/prd`, `/feature-area`, `/user-story`, `/spec`, `/task`, `/implement`, `/domain`, `/execute-prd`, `/framework-audit`). Verify against manifest entries with `kind: "command"`.
- **SR-03 · A skill exists** for the work type the request implies. Verify against manifest entries with `kind: "skill"`.
- **SR-04 · An agent at the right tier exists** for any delegation the request needs (`20-model-routing.mdc`). Verify against manifest entries with `kind: "agent"`.
- **SR-05 · Templates exist** for any artifact the request will create. Verify against manifest entries with `kind: "template"`.
- **SR-06 → SR-11:** see below (unchanged).

## Part B — Project config & freshness

- **SR-06 · `docs/project.config.md` exists and is filled** (name, priority bands, v0 boundary, implementation-phase flag). If missing → create from `.cursor/core/templates/project/project.config.template.md`.
- **SR-07 · Implementation gate is consistent.** If the request implies writing code, the implementation phase is enabled (config + approved PD) per `implementation-workflow.mdc` §2; else routing must stop before code.
- **SR-08 · No open `NEED_UPDATE`** in `docs/POINTS_OF_ATTENTION.md` that blocks the request's stage.
- **SR-09 · PRD exists** when the request assumes product context (`docs/prd/PRD.md` non-empty); else route to `/prd init` first.

## Part C — Coverage of THIS request

- **SR-10 · The request maps to a known stage** (idea/PRD, scope, story, spec, implement, domain task, bug). If it maps to nothing, it is a setup gap.
- **SR-11 · No rule/skill/command/agent would need to be invented mid-flight** to honor the request. If yes, author it first (or surface it as a tracked gap).
- **SR-12 · `core/` layer is intact.** `.cursor/core/rules/`, `.cursor/core/skills/`, `.cursor/core/commands/`, `.cursor/core/agents/`, `.cursor/core/checkers/` all exist and are non-empty. If any are missing, the framework has been corrupted — stop and alert.
- **SR-13 · `project/` overlay is valid (if present).** `.cursor/project/` exists (it may be empty). No file in `project/` shadows a `core/` path in a way that would break governance (e.g. overriding `00-siso.mdc` or `20-model-routing.mdc` without a Framework Decision). Log `NEED_UPDATE` if suspicious shadows are detected.

---

## Verdict

```txt
Setup Readiness — <request one-liner>

| Check | Result | Note |
|-------|--------|------|
| SR-01 | PASS   |      |
| ...   |        |      |

Setup verdict: READY | GAP
Gaps (if any):
- <missing rule/skill/command/agent/template> — proposed path + one-line purpose
Routing: <which workflow/command handles the request next>
```

A **GAP** verdict means: propose the missing piece (using `create-rule` / `create-skill` conventions) and, for anything load-bearing, get user approval before routing. Minor gaps may be noted and routed around with `NEED_UPDATE` logged.
