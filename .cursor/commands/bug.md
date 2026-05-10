# /bug — Bug intake and routing

## Usage

```txt
/bug <description>                  (with observed vs expected behaviour)
/bug <description> --repro <steps>  (explicit reproducer)
/bug <url>                          (Sentry event, error log URL, or issue link)
```

---

## Purpose

`/bug` is the intake gate for **broken behaviour** — things that should work but don't. It triages the bug, classifies its scope and severity, and routes it to the right place in the workflow.

Use `/bug` when:
- Something is visually broken or crashing
- A feature returns wrong data or wrong state
- A regression was introduced
- An edge case causes unexpected behaviour

Use `/evol` for **improvements** to working behaviour.  
Use `/fix` directly when you already have a clear diagnosis and file target.

---

## Triage

### Step 1 — Classify

| Class | Criteria | Examples |
|---|---|---|
| `ui-defect` | Visual breakage, layout bug, interaction glitch | "button overlaps text on mobile" |
| `logic-bug` | Wrong computation, wrong state, incorrect flow | "PRD generation skips questions" |
| `data-integrity` | Incorrect persistence, silent data loss | "credit deduction applied twice" |
| `performance` | Timeout, infinite loop, UI freeze | "chat hangs after 10 messages" |
| `security` | Auth bypass, data leak, privilege escalation | "project accessible without login" |

### Step 2 — Severity

| Severity | Criteria |
|---|---|
| `minor` | Cosmetic or low-impact; workaround exists |
| `major` | Degrades a core flow; no clean workaround |
| `critical` | Data loss, security, or complete flow breakage |

### Step 3 — Size

| Size | Criteria |
|---|---|
| `small` | ≤ 3 files, ≤ 1 hexagonal layer, ≤ 100 net lines, no new contracts/migrations/deps |
| `large` | Anything beyond `small` |

### Step 4 — Route

| Class × Severity × Size | Route |
|---|---|
| Any + `minor` or `major` + `small` | → `/fix` directly (produce Plan-Lite inline) |
| Any + `critical` + any size | → BLOCKERS.md + WORK_QUEUE + POINTS_OF_ATTENTION, then `/fix` or `/plan` |
| `data-integrity` or `security` + any | → Always BLOCKERS.md regardless of size |
| `logic-bug` or `performance` + `large` | → WORK_QUEUE Scope Slice (candidate) + recommend `/plan` |

---

## Behavior

### Fast path (`small` + `minor/major`, non-`data-integrity`, non-`security`)

1. Classify + severity + size-check.
2. Confirm a reproducer exists (failing test, error trace, or manual steps). If missing, **stop** and ask.
3. Output a **Bug Triage Card**.
4. Wait for `approved`.
5. On `approved`: invoke `/fix <description>` inline — produce Plan-Lite, wait for `approved`, apply edits.

No WORK_QUEUE write for fast-path bugs (they go straight to `/fix`).

### Blocker path (`critical`, `data-integrity`, `security`, or `large`)

1. Classify + severity + size-check.
2. Output a **Bug Triage Card**.
3. Wait for `approved`.
4. On `approved`:
   - Append a blocker row to `docs/BLOCKERS.md`:
     - `Scope`: `scope-slice` (if tied to a known slice), `feature-area` (if broader), or `global` (if critical/security)
     - `NEED_HUMAN: true` for `critical` / `security` / `data-integrity`
   - Append a row to `docs/WORK_QUEUE.md`:
     - `Type`: `Scope Slice` (for targeted bugs) or `Feature Area` (for systemic issues)
     - `Status`: `blocked` (if blocker row added), `candidate` (if queue-only)
     - `Blocked By`: the new blocker ID
   - Append to `docs/POINTS_OF_ATTENTION.md` if `critical` or `security`.
   - Append to `docs/EXECUTION_LOG.md`: mode `system`, note `/bug intake — <severity> <class> — <one-line summary>`.
5. Recommend: `/fix` (if small, after human resolution of blocker) or `/plan` (if large).

---

## Bug Triage Card format

```txt
/bug — Triage Card

Input: <verbatim description>
Reproducer: <steps | test path | error trace | "missing — ask user">

Classification: ui-defect | logic-bug | data-integrity | performance | security
Severity: minor | major | critical
Size: small | large
Route: /fix | BLOCKERS.md + WORK_QUEUE | both

Suspected file(s): <path(s) or "unknown">
Root cause hypothesis: <one-sentence diagnosis or "needs investigation">

WORK_QUEUE row (if applicable, written on approval):
| <ID> | Scope Slice | <Parent FA> | <status> | <Priority> | <NEED_HUMAN> | false | <blocker ID> | /fix or /plan |

BLOCKERS.md row (if applicable, written on approval):
| <B-NNN> | <scope> | <artifact> | <reason> | <NEED_HUMAN> | false | <date> | |

Approval required:
Reply `approved` to route to workflow.
Reply `fix` to skip queue and route directly to /fix.
Reply `cancel` to discard.
```

---

## Hard rules

- A reproducer is mandatory before any code change. No reproducer → stop and ask.
- `critical` / `security` / `data-integrity` bugs always produce a BLOCKERS.md entry — no exceptions.
- No source-tree writes without `approved` + a subsequent `/fix` or `/implement` loop.
- `data-integrity` and `security` bugs with `NEED_HUMAN: true` are not eligible for autonomous `/fix` — they require human triage before code changes.
- No frozen-violation contributions in the fix (per `72-hexagonal-boundaries.mdc` §7, `73-result-rop.mdc` §7).

---

→ /fix (small/minor) | /plan (large) | /babysit (open PR regression)
