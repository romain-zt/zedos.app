# /execute-prd — Zedos execution loop

## Usage

```txt
/execute-prd <mode>
```

Operational skill: `.cursor/core/skills/execution-loop/SKILL.md`  
Governed by: `.cursor/core/rules/execution-loop.mdc`

Also respect: `.cursor/core/rules/feature-area-workflow.mdc`, `.cursor/core/rules/user-story-workflow.mdc`, `.cursor/core/commands/feature-area.md`, `.cursor/core/commands/user-story.md`, `.cursor/core/commands/spec.md`, `.cursor/core/commands/task.md`, `.cursor/core/checkers/scope-readiness-checker.md`, `docs/product-decisions/PD-001-post-slice-workflow.md`, `docs/product-decisions/PD-006-per-fa-delivery-readiness-gate.md`, `.cursor/core/rules/00-siso.mdc`.

---

## Modes

### `init`

Ensures **`docs/`** governance tables exist (`WORK_QUEUE.md`, `BLOCKERS.md`, `EXECUTION_LOG.md`, `EXECUTION_LOCK.md`, `POINTS_OF_ATTENTION.md`) from templates described in **`execution-loop` rule**.

- Writes **missing** scaffold only; merges with existing markdown where files already contain tables (**do not** wipe history).
- Appends **`EXECUTION_LOG`** row: mode `system` or `init`, note **`execution-loop scaffold present`**.

### `scan`

Rebuilds **`docs/WORK_QUEUE.md`** from **`docs/prd/**`**, **`docs/product/feature-areas/**`**, **`docs/product/scope-slices/**`**, **`docs/product/user-stories/**`**, **`docs/product/specs/**`**, **`docs/product/tasks/**`**.

- Reconcile **`Blocked By`** with **`docs/BLOCKERS.md`**.
- **Per-FA Delivery Readiness (PD-006):** group queue rows by Feature Area and tag each FA with its current status. Explicitly list FAs at status **`delivery-ready`** as **verticales potentiellement parallélisables** in a top-level section of `WORK_QUEUE.md` so the founder can pick the next vertical to run. FAs at `validated` (slicing authorized but no User Story / Spec / Task work) are listed in a separate section with their first DR-01..DR-05 failure annotated. FAs at `exploratory` / `blocked` / `deferred` are grouped under "macro work in progress" and "blocked / deferred" respectively.
- Optionally append **`EXECUTION_LOG`**: **`scan`** + row counts (**Feature Area** / **Scope Slice** / **User Story** / **Spec** / **Task**) and a per-status FA breakdown including `delivery-ready` count.

### `next`

After an implicit **`scan`** (perform **`scan`** if sources changed since lock timestamp):

1. Read **`EXECUTION_LOCK.md`** — if **`stale: true`**, execute stale-release steps from **`execution-loop`** rule §8 **before** recommending work.
2. Apply selection order **§5 a–j** from **`execution-loop` rule**.
3. Output exactly one **recommended queue ID**, **Type**, **`Next Action`** (string), **`Blocked`** boolean for that row’s subtree rationale, checker hint if advancing.

### `run-one`

1. Acquire or validate **`EXECUTION_LOCK`**: assign **`active_item_id`** = **`next`** result; **`allowed_files`** must be subset of **`docs/`** + **`docs/prd`** + **`docs/product`** (including **`docs/product/user-stories/`**, **`docs/product/specs/`**, **`docs/product/tasks/`**) + **`docs/product-decisions`** + **`.cursor/`** governance only — **never** defaults to **`src/**`**.
2. Execute **exactly one** bounded governance step:
   - **`/feature-area`** modes: `validate`, `check`, `refine-slice`, `promote`, `promote-slice`, `clear-for-vertical`, `slice` (proposal-only), `scaffold`, `scaffold-slices` (after approved proposal in conversation).
   - **`/user-story`** modes: `propose`, `scaffold`, `refine`, `check`, `promote` — gated by parent Scope Slice at `ready-for-user-stories` **AND** grandparent Feature Area at `delivery-ready` (per PD-006).
   - **`/spec`** modes: `propose`, `scaffold`, `refine`, `check`, `promote` — gated by parent User Story at `ready-for-spec` AND chain-grandparent Feature Area at `delivery-ready` (per PD-006).
   - **`/task`** modes: `propose`, `scaffold`, `refine`, `check`, `promote` — gated by parent Spec at `ready-for-implementation`, chain-grandparent Feature Area at `delivery-ready` (per PD-006), AND approved proposal with `Subdivision needed: yes`.
   - **documentation-only** updates to **`WORK_QUEUE` / `BLOCKERS` / `POINTS_OF_ATTENTION`** driven by scan.
3. If step requires **checker `CLEAR`** and it is not **CLEAR**, log **BLOCKED** and **do not** patch promotion fields.
4. Append **`EXECUTION_LOG`**: mode **`run-one`**, item, action, outcome.
5. Release lock if step complete; if multi-step action (e.g. checker then promote), keep lock **only** if skill says so **and** **`stale`** stays **false**.

### `loop`

Repeat **`next` → `run-one`** until a **stop condition** in **`execution-loop`** rule §11 fires.

- Max iterations: **10** per user invocation unless user specifies a lower cap in the same message.
- On stop, print **stop reason** + **`EXECUTION_LOG`** reference + recommended **`/execute-prd scan`**.

---

## Hard rules

- **No** product implementation code under `src/**`, **no** dependency installs, **no** runtime architecture from this command. Spec is a description, not code.
- **User Story / Spec / Task file creation is allowed**, but **only** behind the same propose → approve → scaffold → refine → check → promote gates defined by `/user-story`, `/spec`, and `/task` per **PD-001** (`docs/product-decisions/PD-001-post-slice-workflow.md`), **and** only when the chain-grandparent Feature Area is at status `delivery-ready` per **PD-006** (`docs/product-decisions/PD-006-per-fa-delivery-readiness-gate.md`). Autonomous creation outside an approved proposal stays forbidden. If the FA has not been promoted to `delivery-ready`, the only allowed pre-User Story step is `/feature-area clear-for-vertical <fa-name>` (which itself requires DR-01..DR-05 CLEAR).
- **No** bypassing **`NEED_HUMAN`** or checker **`BLOCKED`** via autonomous choice.
- **Feature Area** and **Scope Slice** file mutations follow **only** allowed **`/feature-area`** modes from **`.cursor/core/commands/feature-area.md`**.
- **User Story** file mutations follow **only** allowed **`/user-story`** modes from **`.cursor/core/commands/user-story.md`**.
- **Spec** file mutations follow **only** allowed **`/spec`** modes from **`.cursor/core/commands/spec.md`**.
- **Task** file mutations follow **only** allowed **`/task`** modes from **`.cursor/core/commands/task.md`** AND only when the corresponding `/task propose` returned `Subdivision needed: yes`.
