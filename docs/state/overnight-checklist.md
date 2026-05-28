# Overnight Checklist

Last updated: 2026-05-28

This document replaces the historical migration-era checklist and stays aligned with:
- `docs/state/status.json` (source of truth)
- `docs/state/HANDOFF.md` (human handoff)
- `docs/WORK_QUEUE.md` (execution backlog)

---

## Current overnight priorities

1. Keep documentation coherence (`status.json` / `WORK_QUEUE.md` / `HANDOFF.md`).
2. Keep deployment secrets in sync with runtime expectations (`STRIPE_WEBHOOK_SECRET`).
3. Ensure no regression on Stripe webhook flow (`POST /api/stripe/webhook` returns `2xx` for valid signed events).

---

## Morning checks (quick)

- [ ] `pnpm -w run typecheck`
- [ ] `pnpm -w run build`
- [ ] `pnpm -w run test`
- [ ] `docs/state/status.json` has no stale blockers vs completed slices
- [ ] `docs/WORK_QUEUE.md` matches statuses in `status.json`
- [ ] `docs/state/HANDOFF.md` "Next actions" has no duplicate or stale action

---

## Incident response

If an automated step fails overnight:

1. Inspect `docs/state/status.json` (`orchestration.steps`, `orchestration.blocker`, `orchestration_blocker`).
2. Inspect `docs/state/HANDOFF.md` for the latest operator context.
3. Fix root cause, then update docs so all three files tell the same story.
4. Re-run verification commands (`typecheck`, `build`, `test`) before resuming automation.

---

## Legacy note

The previous version (dated 2026-05-10) described the Turborepo migration rollout and is now obsolete.
