# /framework-audit — Framework Completeness Audit

> **Tier:** Vision (`claude-opus-4-6`) — framework changes are irreversible and load-bearing.
>
> **Agent:** `.cursor/core/agents/framework/framework-improver.md` (drafts only, never merges)
>
> **Checker:** `.cursor/core/checkers/framework-readiness-checker.md`

## Usage

```txt
/framework-audit               # run checker, print report
/framework-audit propose       # run checker, then draft PRs for core-broken gaps
/framework-audit dry-run       # read-only, no agent invocation
```

## Modes

### `/framework-audit` (report)

1. Load `.cursor/core/framework.manifest.json` and verify it is valid against `framework.manifest.schema.json`.
2. Run all FR-NN checks defined in `framework-readiness-checker.md`.
3. Print the gap report (READY or GAP + structured gap list).
4. Do NOT invoke the improver. Do NOT open PRs.

### `/framework-audit propose`

1. Run report (as above).
2. For each gap with severity `core-broken`:
   a. Identify the manifest entry's `kind`, `path`, `purpose`, and template.
   b. Fire a `Task(subagent_type: "framework-improver")` with a gap brief:
      - The gap entry (id, kind, path, purpose, dependsOn).
      - The matching template from `.cursor/core/templates/`.
      - Constraint: draft only at the declared path, append manifest entry, open PR on `framework/improver/<id>` branch.
3. Cap at 3 improver invocations per run (to avoid PR spam).
4. `tier-violation` gaps → open/update issue only; never fire improver.
5. `optional` gaps → log only.

### `/framework-audit dry-run`

1. Run the checker (FR-NN checks).
2. Print what would happen in `propose` mode (which gaps, which improver briefs).
3. No file writes, no Tasks, no PRs.

## Append-only invariant

The manifest is **append-only**. To delete or rename a manifest entry:
1. Create a Framework Decision doc: `docs/framework-decisions/FD-NNN-<slug>.md` (from `.cursor/core/templates/framework-decisions/FD.template.md`).
2. The FD must be merged to `main` BEFORE the manifest entry is removed.
3. The `framework-audit.yml` CI check enforces this (FR-2N+5).

NEVER edit the manifest to remove an entry without a corresponding FD. This is a hard invariant.

## Outputs

On completion, print:
- Framework readiness verdict (READY / GAP)
- Count of gaps by severity
- Links to any PRs opened by the improver
- Next recommended action
