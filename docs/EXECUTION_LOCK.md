# EXECUTION_LOCK

One active governance lock for `/execute-prd run-one` / `loop`. Template fields per `.cursor/rules/execution-loop.mdc` §8.

```yaml
active_item_id: none
type: none
parent_chain: []
current_action: none
started_at: null
allowed_files: []
forbidden_files:
  - src/**
  - app/**
  - packages/**
  - lib/**
stale: false
```

**Stale handling:** If `stale: true`, or lock age is more than 24 hours, or the target is missing from the queue after `scan`, release the lock, append `EXECUTION_LOG`, then re-run `next`. See `.cursor/skills/execution-loop/SKILL.md`.
