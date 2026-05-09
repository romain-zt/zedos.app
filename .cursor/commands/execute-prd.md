# /execute-prd — Zedos execution loop

## Usage

```txt
/execute-prd <mode>
```

Operational skill: `.cursor/skills/execution-loop/SKILL.md`  
Governed by: `.cursor/rules/execution-loop.mdc`

Also respect: `.cursor/rules/feature-area-workflow.mdc`, `.cursor/commands/feature-area.md`, `.cursor/checkers/scope-readiness-checker.md`, `.cursor/rules/00-siso.mdc`.

---

## Modes

### `init`

Ensures **`docs/`** governance tables exist (`WORK_QUEUE.md`, `BLOCKERS.md`, `EXECUTION_LOG.md`, `EXECUTION_LOCK.md`, `POINTS_OF_ATTENTION.md`) from templates described in **`execution-loop` rule**.

- Writes **missing** scaffold only; merges with existing markdown where files already contain tables (**do not** wipe history).
- Appends **`EXECUTION_LOG`** row: mode `system` or `init`, note **`execution-loop scaffold present`**.

### `scan`

Rebuilds **`docs/WORK_QUEUE.md`** from **`docs/prd/**`**, **`docs/product/feature-areas/**`, **`docs/product/scope-slices/**`**.

- Reconcile **`Blocked By`** with **`docs/BLOCKERS.md`**.
- Optionally append **`EXECUTION_LOG`**: **`scan`** + row counts (**Feature Area** / **Scope Slice**).

### `next`

After an implicit **`scan`** (perform **`scan`** if sources changed since lock timestamp):

1. Read **`EXECUTION_LOCK.md`** — if **`stale: true`**, execute stale-release steps from **`execution-loop`** rule §8 **before** recommending work.
2. Apply selection order **§5 a–j** from **`execution-loop` rule**.
3. Output exactly one **recommended queue ID**, **Type**, **`Next Action`** (string), **`Blocked`** boolean for that row’s subtree rationale, checker hint if advancing.

### `run-one`

1. Acquire or validate **`EXECUTION_LOCK`**: assign **`active_item_id`** = **`next`** result; **`allowed_files`** must be subset of **`docs/`** + **`docs/prd`** + **`docs/product`** + **`docs/product-decisions`** + **`.cursor/`** governance only — **never** defaults to **`src/**`**.
2. Execute **exactly one** bounded governance step:
   - **`/feature-area validate`**, **`check`**, **`refine-slice`**, **`promote`**, **`promote-slice`**, **`slice`** (proposal-only), or **documentation-only** updates to **`WORK_QUEUE` / `BLOCKERS` / `POINTS_OF_ATTENTION`** driven by scan — **no** User Story / Spec / Task file creation (**v0 stop** per rule §11).
3. If step requires **checker `CLEAR`** and it is not **CLEAR**, log **BLOCKED** and **do not** patch promotion fields.
4. Append **`EXECUTION_LOG`**: mode **`run-one`**, item, action, outcome.
5. Release lock if step complete; if the step pairs **`check`** then **`promote-slice`**, both may complete in one lock only when **`check` CLEAR** precedes **`promote-slice`** on an unchanged file (**`execution-loop`** rule §12); otherwise one step per **`run-one`**.

### `loop`

Repeat **`next` → `run-one`** until a **stop condition** in **`execution-loop`** rule §11 fires.

- Max iterations: **10** per user invocation unless user specifies a lower cap in the same message.
- On stop, print **stop reason** + **`EXECUTION_LOG`** reference + recommended **`/execute-prd scan`**.
- **`/feature-area promote-slice`:** allowed in **`loop` / `run-one`** only after **`/feature-area check`** on the **same** scope-slice path returned **`Advancement verdict: CLEAR`** in that episode (**`execution-loop`** rule §12, **`feature-area` Mode: promote-slice**).

---

## Hard rules

- **No** product implementation code, **no** dependency installs, **no** runtime architecture.
- **No** creating **`User Story`**, **`Spec`**, **`Task`**, **`Test`** queue rows that imply execution specs **until** governance explicitly allows that phase (not yet).
- **No** bypassing **`NEED_HUMAN`** or checker **`BLOCKED`** via autonomous choice.
- **Feature Area** and **Scope Slice** file mutations follow **only** allowed **`/feature-area`** modes from **`.cursor/commands/feature-area.md`**.
