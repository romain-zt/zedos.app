---
name: execution-loop
description: Runs `/execute-prd` — init, scan, next, run-one, loop over WORK_QUEUE with BLOCKERS, EXECUTION_LOCK, EXECUTION_LOG, POINTS_OF_ATTENTION. Non-blocking blockers; checker-gated advancement; stops before User Story/Spec/Task implementation artifacts per execution-loop rule.
disable-model-invocation: true
---

# Execution Loop — Operational Skill

Use when the user invokes **`/execute-prd <mode>`** or references **`execution-loop`**.

**Read first:** `.cursor/rules/execution-loop.mdc`  
**Align with:** `.cursor/rules/feature-area-workflow.mdc`, `.cursor/commands/feature-area.md`, `.cursor/checkers/scope-readiness-checker.md`

---

## 1. Files

| File | Read for | Write on |
|------|-----------|----------|
| `docs/WORK_QUEUE.md` | Eligible work, ordering | **`scan`**, manual reconciliation after promotions |
| `docs/BLOCKERS.md` | Subtree blocking | When new human flags or resolutions appear in sources |
| `docs/EXECUTION_LOCK.md` | Concurrency, allowed paths | **`run-one`**, **`loop`**, stale release |
| `docs/EXECUTION_LOG.md` | Audit | **Every mode** (append row) |
| `docs/POINTS_OF_ATTENTION.md` | Risks, NEED_UPDATE, PRD surface | **`scan`**, **`next`** when surfacing gaps |
| `docs/prd/state.md`, `docs/prd/PRD.md`, `docs/prd/questions/open-questions.md` | Ground truth | Only via PRD workflow — not on this loop unless logging |
| `docs/product/feature-areas/*.md`, `docs/product/scope-slices/*.md` | Queue rebuild + actions | Only via **`/feature-area`** allowed modes |

---

## 2. Mode: `init`

1. If `docs/WORK_QUEUE.md` missing or header-only, create table per rule §3.
2. Same for `BLOCKERS.md`, `EXECUTION_LOG.md`, `EXECUTION_LOCK.md`, `POINTS_OF_ATTENTION.md` per rule §7–10.
3. Log: **`init`**, Item `—`, Action **`scaffold verified`**, Outcome **`ok`**.

---

## 3. Mode: `scan`

1. Read all Feature Area and Scope Slice markdown (non-`.gitkeep`).
2. For each **Feature Area** file `docs/product/feature-areas/<kebab>.md`:
   - **ID:** `FA-<kebab>`
   - **Type:** `Feature Area`
   - **Parent:** empty
   - **Priority:** `P0`–`P4` per **execution-loop** rule §4
   - **NEED_HUMAN / NEED_UPDATE:** from `> **NEED_HUMAN:**` / `> **NEED_UPDATE:**` lines if present; else `false`
   - **Status:** map `Status` line per rule §3 table
   - **Blocked By:** semicolon list of `B-NNN` where artifact open blockers + flags match **BLOCKERS** (create blocker rows in **`scan`** if missing but **NEED_HUMAN** in source — keep **minimal**)
   - **Next Action:** e.g. **`/feature-area validate <kebab>`** if exploratory; **`/feature-area slice <kebab>`** if validated and slices not all materialized; **`/feature-area check <path>`** for slices under it
3. For each **Scope Slice** `docs/product/scope-slices/<fa>--<slice>.md`:
   - **ID:** `SS-<fa>--<slice>` (full basename without `.md`, prefix `SS-`)
   - **Type:** `Scope Slice`
   - **Parent:** `FA-<fa>` (first segment(s) before `--` matching FA kebab)
   - **Priority:** inherit from parent FA band
   - Flags from file; **Status** mapping per rule
   - **Next Action:** **`/feature-area refine-slice <path>`** when UX States / Data Touched empty or verdict NOT READY; **`/feature-area check <path>`** when refined; **`/feature-area promote-slice <path>`** only after **`check`** **CLEAR** on that path in the same episode (per `execution-loop` §12 + `feature-area` Mode: promote-slice)
4. Rewrite **`WORK_QUEUE.md`** table (full replace of table body is OK; preserve title + intro if present).
5. Log **`scan`**, note row counts.

**ID convention:** Use `SS-account-session--signup-to-signed-in-dashboard` style = `SS-` + filename without `.md`.

---

## 4. Mode: `next`

1. Run **§3** mentally or literally (**full `scan`** if user has not just scanned).
2. Load **`EXECUTION_LOCK.md`**:
   - If **`stale: true`** **or** age rule triggered: clear lock per rule §8; log.
3. Build **eligible** set: all rows where:
   - **Status** not `done`
   - **NEED_UPDATE** false **or** user is only running **`next`** for reporting (still surface POA)
   - **Subtree not blocked:** remove row if any **ancestor** or **self** has **Blocked By** referencing an **unresolved** blocker whose **Scope** covers that row **and** **Resolution** empty in `BLOCKERS.md`
   - **Non-blocking rule:** sibling rows under same parent without blocker on them **stay eligible**
4. Sort by rule **§5 a–j** (Priority **P0→P4**, then frontier depth, then status preference).
5. Output: **ID**, **Type**, **Parent**, **Next Action**, **why this pick** (one line), **siblings still eligible** (optional).

---

## 5. Mode: `run-one`

1. Compute target = **`next`** output (recompute if needed).
2. **Lock:**
   - Set **`active_item_id`**, **`type`**, **`parent_chain`** (walk **Parent** column to root), **`current_action`** = chosen step, **`started_at`** = today ISO, **`stale: false`
   - **`allowed_files`:** minimal — e.g. one Scope Slice path + `WORK_QUEUE` + `EXECUTION_LOG` + `BLOCKERS` if reconciling
   - **`forbidden_files`:** `src/**`, `app/**`, `packages/**`, `lib/**` (adjust if repo differs — **default deny** implementation trees)
3. Execute **one** step only:
   - **Feature Area exploratory** → usually **`/feature-area validate <name>`** (read-only) or user-approved **`promote`** after CLEAR
   - **Scope Slice exploratory** → **`/feature-area refine-slice`** (one file) **or** **`check`** (read-only). **`/feature-area promote-slice`** only immediately after **`/feature-area check`** on **that path** returned **CLEAR** in the **same** run (same episode); do not promote without that **CLEAR** **`check`**.
   - **Never** create **User Story** files in **v0** loop
4. Append **`EXECUTION_LOG`**
5. **Unlock** if step finished; if checker **BLOCKED**, unlock and set **Next Action** in chat from checker **Reason**

---

## 6. Mode: `loop`

1. Iteration cap **10** (or user override in message).
2. Each iteration: **`next`**; if no target → **stop `idle`**
3. **`run-one`**; if stop condition (rule §11) → log and break
4. End summary: iterations, last item, stop reason

---

## 7. Blockers and siblings (operational)

When **`B-NNN`** has **Scope** `feature-area` on **`FA-credit-system`**, **remove** `FA-credit-system` and **all** rows with **Parent** = that ID or descendant chain from **eligible** — **do not** remove **`FA-payments`** or **`FA-account-session`**.

When **`Scope: scope-slice`** on one slice only, **other slices** of same FA stay in **eligible** set.

---

## 8. Logging (required fields)

**`EXECUTION_LOG` row:** ISO **Timestamp** (date fine), **Mode**, **Item** (queue ID or `—`), **Action** (short), **Outcome** (`ok` / `blocked` / `stale-released` / `idle` / `stall`), **Notes** (optional, one line).

---

## 9. Anti-patterns

| Wrong | Right |
|-------|--------|
| Promoting FA/SS without checker output | Run **`/feature-area check`** first; **`promote-slice`** only after **CLEAR** on that path in the same episode |
| Clearing **NEED_HUMAN** in chat | Human edits artifact + **BLOCKERS.Resolution** |
| Editing locked-out paths | Obey **allowed_files** |
| Expanding loop to code | **Stop** at rule §11 implementation boundary |
