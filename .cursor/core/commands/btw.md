---
description: "/btw — drop an input into the pipeline queue with a priority (0–5). 'Hey, by the way, put that in the pipe.'"
---

# /btw — queue an input

Capture a thought, request, bug, or idea into the append-only input queue **without** stopping current work to fully spec it. Each item gets a **priority 0–5** (0 = pick it next run, absolutely; 5 = whenever, the default).

Backed by `docs/state/inbox.ndjson` (append-only, `merge=union`). See `.cursor/core/rules/61-input-queue.mdc`.

## Usage

```
/btw <what to do or consider> [p<0-5>]
```

Examples:
- `/btw the product grid should lazy-load images p2`
- `/btw URGENT login button is dead on mobile p0`
- `/btw consider a wishlist later` (defaults to p5)

## Behavior

1. Parse the text and an optional trailing priority token (`p0`–`p5`, or "urgent" → 0). Default priority 5.
2. Append the item to the queue:
   ```bash
   npx --prefix .github/scripts/core tsx .github/scripts/core/inbox.ts add "<text>" --priority <N> [--tag <tag>] --actor "<who>"
   ```
3. Confirm in one line (id + priority). Do **not** start the work now — `/btw` only queues.

## Draining the queue (manager)

When picking the next thing to work on, a Manager/decomposer first reads the open queue:

```bash
npx --prefix .github/scripts/core tsx .github/scripts/core/inbox.ts list --open
```

- **Priority 0 items are picked on the very next run, before anything else.**
- Otherwise, lower priority number wins; ties break oldest-first.
- Triage each item into the right workflow (`/prd`, `/feature-area`, `/spec`, bug path, or a planner-queue step with a matching `priority`), then resolve it:
  ```bash
  npx --prefix .github/scripts/core tsx .github/scripts/core/inbox.ts resolve <id> --note "<where it went>"
  ```

Never silently drop a queued item — resolve it (even if the resolution is "won't do, because …").
