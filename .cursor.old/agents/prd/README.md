# PRD Committee

Three specialized agents that govern product discovery alongside the PRD Builder skill.

This is **AI-assisted product governance**, not "AI generates PRDs". Discussion drives discovery; the PRD is updated only via reviewed deltas.

## Members

| Agent | File | Responsibility |
|-------|------|----------------|
| PRD Lead | [`prd-lead.md`](./prd-lead.md) | Global PRD coherence — reconstructs full product context before major PRD actions |
| Challenger | [`prd-challenger.md`](./prd-challenger.md) | Attacks weak assumptions, scope inflation, and drift |
| Researcher | [`prd-researcher.md`](./prd-researcher.md) | Market, users, competition, evidence tagging |

## Operational core

The [`prd-builder`](../../skills/prd/prd-builder/SKILL.md) skill drives the convergence loop: feature group construction, ICE scoring, gated delta proposals, and approved PRD updates. Challenger and Researcher provide adversarial and evidence viewpoints — they do not drive the workflow. PRD Lead gates major PRD actions as a pre-flight coherence step; it does not own the convergence loop.

## Operating principle

```txt
conversation → [prd-lead context brief] → challenge → clarification → prioritization → persistence proposal → validation → write
```

PRD Lead runs before `converge`, `challenge`, `prioritize`, and `update` to ensure global coherence is established before any synthesis or persistence step.

## How to invoke

Use the [`/prd`](../../commands/prd.md) command:

- `/prd init` — initialize missing PRD docs workspace from `.cursor/templates/prd/`
- `/prd discover` — open product discovery, freeform capture (PRD Builder skill leads)
- `/prd questions` — ask the next unresolved discovery question (PRD Question Loop)
- `/prd note` — capture one insight as a discovery note, update question queue
- `/prd converge` — synthesize notes into a proposed PRD delta (PRD Builder skill leads, PRD Lead pre-flight)
- `/prd challenge` — stress-test current direction (Challenger leads, PRD Lead pre-flight)
- `/prd prioritize` — re-rank scope using ICE (PRD Lead pre-flight)
- `/prd update` — propose and write a PRD delta (PRD Lead pre-flight)

## Hard rules

- No technical architecture, frameworks, or implementation in committee output.
- No bulk PRD rewrites — only approved Patch Intent Summaries or full PRD Delta Proposals may be written through `/prd update`.
- Versioning and update triggers follow [`.cursor/rules/10-prd-discovery.mdc`](../../rules/10-prd-discovery.mdc).
- Persisted state lives under [`docs/prd/`](../../docs/prd/) and [`docs/product-decisions/`](../../docs/product-decisions/).
