# docs/state/ — Cloud Agent State Handoff

This directory contains the state handoff documents for autonomous Cursor Cloud Agent continuation.

## Files

| File | Purpose | Format |
|------|---------|--------|
| `HANDOFF.md` | Comprehensive human-readable state document | Markdown |
| `status.json` | Machine-readable summary for programmatic checks | JSON |
| `README.md` | This file | Markdown |

## How a Cloud Agent Should Consume These

### Bootstrap sequence

1. **Read `status.json`** — get current phase, approval status, and next action at a glance.
2. **Read `HANDOFF.md`** — full context: phase history, PIS blockers, locked decisions, git state, file inventory.
3. **Read the files listed in HANDOFF.md §9** (Key File Inventory) — in the order listed. Governance rules first, then product, then execution artifacts.
4. **Check `HANDOFF.md` §3** (Rules Merge) — if `rules_merge_status` in `status.json` is `not-complete`, complete the merge before any other work.
5. **Check `HANDOFF.md` §5** (Secret Safety) — verify no real secrets are in the commit tree before any push.

### Decision protocol

- **Locked decisions** (§6 of HANDOFF.md, `locked_decisions` in status.json): do NOT re-litigate. These were explicitly decided and confirmed.
- **PIS blockers** (`pis_blockers` in status.json): each must receive explicit `approved` from the user. Present them, get approval, then proceed.
- **Governance rules** (`.cursor/rules/*.mdc`): follow them strictly. The `80-change-policy.mdc` defines what each mode can write. The `00-siso.mdc` classifies requests.

### Updating state

After completing a step:
1. Update `status.json` to reflect the new phase status.
2. Append to `HANDOFF.md` §11 if the next-action sequence changes.
3. Do NOT delete or rewrite history — these are append-only state documents.

### When to stop and ask

- Any PIS blocker that the user hasn't approved
- Any secret that appears to still be in the commit tree
- Any governance rule violation that cannot be resolved without user input
- Any `NEED_HUMAN: true` flag encountered in execution artifacts
