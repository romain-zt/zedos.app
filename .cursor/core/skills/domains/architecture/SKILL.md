---
name: architecture
description: Architecture doctrine for this stack — monorepo (next-forge direction) + Payload CMS (i18n + S3), Postgres, MinIO local. Use when shaping system structure, choosing runtime boundaries, evaluating a stack/dependency change, writing a Spec's Implementation notes, or opening a Product Decision. Vision-tier work.
disable-model-invocation: true
---

# Architecture

Use when a decision shapes structure or is expensive to reverse. Read first:
`.cursor/core/rules/40-architecture-baseline.mdc`. This is **Vision-tier** work
(`claude-opus-4-6`) — see `.cursor/core/rules/20-model-routing.mdc`.

## Default before you design

The stack is decided (baseline). Do **not** re-litigate it per feature:

- Monorepo, pnpm + Turborepo, next-forge structure.
- Payload CMS, Next-native, Postgres, **i18n always on**, **media always S3** (MinIO local).
- Local repro via `docker-compose` (Postgres + MinIO).

Your job is to fit the feature into this, and to flag the rare case where the baseline genuinely doesn't fit — that case becomes a **Product Decision**, not a silent divergence.

## Decision checklist

For any structural choice, answer:

1. **Boundary** — does this need a new runtime/deployment boundary, or is it a module inside an existing app? Default: module. A new "service" requires a PD.
2. **Data ownership** — which Payload collection/global owns this data? One owner per concept. i18n: which fields are localized?
3. **Sync vs async** — does any path exceed ~2s, call out to a third party, or need a callback? If yes → stream / job / webhook (never blocking sync). Feeds the Spec's `## Async / Event / Webhook / Cron / Stream`.
4. **Contract** — what is the stable surface (route, event, message)? Version it if external.
5. **Failure** — what happens on partial failure? Idempotency, retries, reversibility.
6. **Blast radius** — is this reversible? Gate irreversible actions.
7. **Cost of change** — how hard to undo in 6 months? High → write a PD.

## When to write a Product Decision (`docs/product-decisions/PD-NNN.md`)

- A new runtime boundary, queue, datastore, or third-party service.
- A deviation from the architecture baseline.
- A cross-cutting pattern multiple Specs will depend on (auth model, multi-tenancy, eventing).

Use `.cursor/core/templates/prd/product-decision.template.md`. Keep it: context → decision → consequences.

## Output (architecture proposal)

```txt
Architecture Note — <topic>

Fit to baseline: <fits | deviation (→ PD)>
Boundary: <module in app X | new boundary + PD-NNN>
Data: <collections/globals touched · localized fields>
Sync/async: <classification, feeds Spec SP-15>
Contract: <surface + versioning>
Failure & reversibility: <idempotency, retries, gating>
Decision record needed: <none | PD-NNN>
Open questions (NEED_HUMAN): <...>
```

## Anti-patterns

- Re-choosing the stack per feature.
- Calling a feature module a "service" without a PD.
- Designing a blocking sync path for slow/external work.
- Silent deviation from the baseline.
- Architecture astronautics: abstraction with no second caller yet.
