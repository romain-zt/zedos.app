<!--
  Feature Area — PRD Drift + Living PRD via GitHub (blueprint moat T1)
-->

# Feature Area: PRD drift (GitHub)

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- Blueprint ROI #9–#10 — `docs/product/prd-drift-github-v1-spec.md`, `docs/product/living-prd-github-webhook-brief.md`
- `docs/product/prd-repo-sync-mvp-spec.md` (optional DRIFT-04)

---

## Product Intent

When the **GitHub repo** diverges from the in-app PRD, the founder is alerted — reason to return to Zedos and update product truth.

---

## In Scope

- Connect **GitHub repo** to project (OAuth read-only).
- Evaluate drift signals DRIFT-01..04 on schedule (weekly email) and via **webhooks** (push, issues, release).
- Owner **drift inbox** + resolve/dismiss.
- Tie-in **next action banner** state when drift open (coordination UX spec).

## Out of Scope

- GitLab / Bitbucket v1.
- Auto-edit PRD from code.
- Full code AST analysis.

---

## Business Objects Touched

| Object | Relationship |
|--------|--------------|
| GitHub connection | Project ↔ repository linkage |
| DriftSignal | Detected mismatch signals |
| PRD version | Comparison baseline |

---

## Open Blockers

| Blocker | NEED_HUMAN |
|---------|------------|
| _(none)_ | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `prd-drift-github--connect-repo` | OAuth + store repo on project | ready-for-user-stories |
| `prd-drift-github--evaluate-and-weekly-digest` | Signals + email + inbox UI | ready-for-user-stories |
| `prd-drift-github--webhook-realtime` | GitHub webhook → DriftSignal | ready-for-user-stories |

---

## Readiness Verdict

**Verdict:** READY FOR SCOPE SLICES
