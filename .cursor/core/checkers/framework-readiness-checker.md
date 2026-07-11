# Framework Readiness Checker

Path: `.cursor/core/checkers/framework-readiness-checker.md`

Governed by: the append-only invariant in `framework.manifest.json` and the `framework-audit.yml` workflow.

Run via `/framework-audit` (interactive) or `tsx .github/scripts/core/framework-audit.ts` (CI).
Output: `READY | GAP` with a structured gap list.

---

## Checks (FR-NN)

Answer each **PASS / FAIL / SKIP (reason)**. FAIL = gap entry in the report.

### FR-01..FR-N — Manifest Presence

For every entry `E` in `framework.manifest.json`:

- **FR-01(E):** `existsSync(E.path)` — the declared file exists on disk.
- Severity of failure: `core-broken` (missing file) or `project-missing` (entry only in project/ not core/).

### FR-N+1..FR-2N — Orphan Detection

For every file under `.cursor/core/{rules,skills,commands,agents,checkers,hooks}/` and `.github/scripts/core/*.ts` and `.github/workflows/*.yml`:

- **FR-N+1(file):** the file has a corresponding entry in `framework.manifest.json`.
- Severity of failure: `optional` — orphans are not automatically broken, but they should be declared or removed.

### FR-2N+1 — Stage Coverage

Each workflow stage must have at least one active entry per kind in the manifest:

| Stage | Required kinds |
|---|---|
| `intake` | rule, command, skill, agent |
| `prd` | rule, command, skill, agent |
| `feature-area` | rule, command, skill, agent, checker |
| `scope-slice` | checker |
| `user-story` | rule, command, skill, agent |
| `spec` | command, skill, agent |
| `task` | command, skill |
| `implement` | rule, command, skill, agent |
| `domain` (any) | skill, agent |

- Severity: `core-broken` if a required kind is missing for a stage.

### FR-2N+2 — dependsOn Resolution

For every entry `E` with non-empty `dependsOn`:

- **FR-2N+2(E):** every ID in `E.dependsOn` resolves to another manifest entry with `status: active`.
- Severity: `core-broken` (dangling dependency).

### FR-2N+3 — Vision Agent Traceability

For every entry with `tier: "vision"` and `kind: "agent"`:

- **FR-2N+3(agent):** at least one `kind: "command"` or `kind: "rule"` entry in the manifest references this agent's ID in its `dependsOn`.
- Severity: `optional` — vision agents with no orchestrator reference may be stale.

### FR-2N+4 — Dead Commands

For every entry with `kind: "command"`:

- **FR-2N+4(cmd):** at least one rule or skill entry lists this command in its `dependsOn`, OR the command's ID appears in a rule/skill file's body text.
- Severity: `optional`.

### FR-2N+5 — Append-Only Invariant

Compare manifest against `main` branch:

- **FR-2N+5:** no entry present on `main` is absent in the working copy (i.e., no deletions or ID renames without a Framework Decision).
- A Framework Decision (FD-NNN) in `docs/framework-decisions/` referencing the affected entry ID is required to pass this check.
- Severity: `core-broken` — PRs that delete manifest entries without an FD fail CI.

### FR-2N+6 — Tier Compliance Share

Read `.cursor/observability/turns.jsonl` (or the audit script output):

- **FR-2N+6:** Executor share of typing-heavy turns ≥ threshold (default 60%; overridable via `TIER_COMPLIANCE_THRESHOLD` env var or manifest `meta.tierComplianceThreshold`).
- Severity: `tier-violation` (does not trigger framework-improver, only issue).
- Skip if `turns.jsonl` has < 20 entries (insufficient data).

---

## Gap severities

| Severity | Action |
|---|---|
| `core-broken` | Fail CI; open issue; if `OPEN_IMPROVER_PR=true`, fire `framework-improver` |
| `project-missing` | Log warning; no CI fail |
| `tier-violation` | Open issue `[framework-audit] tier compliance`; never fires improver |
| `optional` | Log info; no CI fail |

---

## Output format

```txt
Framework Readiness Check
=========================
Manifest entries: <N>
Files scanned:   <M>

| Check      | Result | Gap kind       | Detail                     |
|------------|--------|----------------|----------------------------|
| FR-01(x)   | FAIL   | core-broken    | Missing: &lt;entry.path&gt;    |
| FR-N+1(y)  | FAIL   | optional       | y has no manifest entry    |
| FR-2N+5    | PASS   |                |                            |
| FR-2N+6    | WARN   | tier-violation | Executor share: 45%        |
| ...        |        |                |                            |

Framework verdict: READY | GAP
Gaps:
- [core-broken] Missing: .cursor/core/commands/framework-audit.md — proposed path: .cursor/core/commands/framework-audit.md
- [tier-violation] Executor share 45% < 60% threshold
```

---

## When to run

- **CI:** on every PR that touches `.cursor/core/**` or `framework.manifest.json` (via `framework-audit.yml`).
- **Nightly:** cron 02:00 UTC for drift detection.
- **Interactive:** `/framework-audit` in Cursor IDE.
