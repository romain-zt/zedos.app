# /evol — Product evolution intake

## Usage

```txt
/evol <description>             (design fix, UX improvement, feature enhancement)
/evol <description> --fast      (skip triage proposal; route directly to /fix for obvious small changes)
```

---

## Purpose

`/evol` is the intake gate for **product evolution requests** — anything that improves, refines, or extends an existing capability. It triages the request, produces a routing recommendation, and on approval adds the appropriate item to the workflow.

Use `/evol` when:
- You spot a design issue or UX friction (e.g. "the inline form is too big")
- You want to improve an existing feature (e.g. "add keyboard shortcut to submit")
- You want to extend a Feature Area with a new behaviour (e.g. "save chat history between sessions")

Use `/prd` for **new product territory** that doesn't map to an existing feature.  
Use `/bug` for **broken behaviour** — things that used to work or should work but don't.

---

## Triage

### Step 1 — Classify the request

| Class | Criteria | Example |
|---|---|---|
| `design-fix` | Visual / layout issue, no new data or logic | "form too big on mobile" |
| `ux-improvement` | Interaction pattern, flow, or copy | "auto-submit single choice" |
| `feature-enhancement` | Adds capability to an existing Feature Area | "show token count in editor" |
| `product-evolution` | Cross-cutting or multi-area change | "onboarding redesign" |

### Step 2 — Size assessment

| Size | Criteria |
|---|---|
| `small` | ≤ 3 files, ≤ 1 hexagonal layer, ≤ 100 net lines, no new contracts/migrations/dependencies |
| `medium` | ≤ 15 files, ≤ 3 layers, no new migrations |
| `large` | Anything beyond `medium` |

### Step 3 — Route

| Class × Size | Route |
|---|---|
| `design-fix` or `ux-improvement` + `small` | → `/fix <description>` (produce Plan-Lite inline) |
| `design-fix` or `ux-improvement` + `medium` | → Add Scope Slice to matching Feature Area + WORK_QUEUE row |
| `feature-enhancement` + any size | → Add Scope Slice to matching Feature Area + WORK_QUEUE row |
| `product-evolution` + any size | → Propose new Feature Area stub + WORK_QUEUE row (routes to `/feature-area scaffold` on approval) |

---

## Behavior

### Fast path (`small` + `design-fix` / `ux-improvement`)

1. Classify + size-check.
2. Output a **Triage Card** (see format below).
3. Wait for `approved`.
4. On `approved`: invoke `/fix <description>` inline — produce Plan-Lite, wait for `approved`, apply edits.

No WORK_QUEUE write needed for small design fixes (they go straight to code).

### Standard path (`medium` / `large` or `feature-enhancement`)

1. Classify + size-check.
2. Identify the parent **Feature Area** (read `docs/product/feature-areas/*.md`).
3. Draft a **Scope Slice stub** (title, user story one-liner, acceptance criteria sketch, size estimate).
4. Output a **Triage Card**.
5. Wait for `approved`.
6. On `approved`:
   - Append a row to `docs/WORK_QUEUE.md` with `Status: candidate`, `Type: Scope Slice`, `Parent: FA-<name>`.
   - If the Feature Area doesn't exist yet: add a `Feature Area` row first (`Status: candidate`).
   - Append to `docs/EXECUTION_LOG.md`: mode `system`, note `/evol intake — <one-line summary>`.
7. Recommend next action: `/feature-area refine-slice` or `/feature-area scaffold-slices` depending on whether the Scope Slice file needs creation.

### Product-evolution path

1. Triage + size-check.
2. Output a **Triage Card** with a proposed Feature Area name and summary.
3. Wait for `approved`.
4. On `approved`:
   - Append a `Feature Area` row to `docs/WORK_QUEUE.md` with `Status: candidate`.
   - Append to `docs/EXECUTION_LOG.md`.
5. Recommend: `/feature-area scaffold <name>` then `/feature-area validate <name>`.

---

## Triage Card format

```txt
/evol — Triage Card

Input: <verbatim description>

Classification: design-fix | ux-improvement | feature-enhancement | product-evolution
Size: small | medium | large
Route: /fix | Scope Slice | Feature Area

Parent Feature Area: <name or "new">
Scope Slice title (if applicable): <proposed title>
User story one-liner: As a <who>, I want <what>, so that <why>.

Acceptance criteria (sketch):
- <criterion 1>
- <criterion 2>

WORK_QUEUE row (will be written on approval):
| <ID> | <Type> | <Parent> | candidate | <Priority> | false | false | | <Next Action> |

Approval required:
Reply `approved` to add to workflow.
Reply `fix` to skip queue and route directly to /fix.
Reply `cancel` to discard.
```

---

## Hard rules

- No source-tree writes without `approved` + a subsequent `/fix` or `/implement` loop.
- WORK_QUEUE writes are append-only additions (`candidate` rows) — never modify existing rows.
- No Scope Slice file creation here — `/evol` only adds the queue row. Slice file creation requires `/feature-area scaffold-slices` after approval.
- No silent mode escalation: if the request is ORANGE/RED on SISO, surface the ambiguity before triaging.

---

→ /fix (small) | /feature-area scaffold-slices (medium/large) | /plan (when slice is ready-for-user-stories)
