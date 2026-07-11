---
name: business
description: Business reasoning doctrine — business model, pricing/monetization, unit economics, market sizing, risks, and prioritization (ICE). Use when evaluating viability, pricing, trade-offs, or whether to build something. Vision-tier; informs the PRD, not implementation.
disable-model-invocation: true
---

# Business Understanding

Use to reason about viability and trade-offs. Vision-tier (`claude-opus-4-6`). This
informs the PRD and product decisions — it does **not** produce architecture or code.

## Business model canvas (lightweight)

Before betting on a feature/product, be able to state:

- **Value proposition** — outcome delivered, to whom.
- **Customer segments** — who pays, who uses (may differ).
- **Revenue model** — how money is made (subscription, usage, transaction, seat...).
- **Cost structure** — main cost drivers (incl. variable cost per unit served).
- **Channels** — how customers find and buy.
- **Key risks** — what would make this fail.

## Pricing & unit economics

- Tie price to **value** (what the outcome is worth), not cost-plus.
- Know the rough **unit economics**: revenue per customer vs. variable cost to serve (incl. LLM/infra). A feature with negative contribution margin needs a plan.
- For any feature, ask: does it drive **acquisition, retention, or expansion**? If none, question it.

## Prioritization (ICE)

Score scope on **Impact × Confidence × Ease / 100**:

- **Impact** (1–10): user + business value.
- **Confidence** (1–10): evidence quality, not enthusiasm.
- **Ease** (1–10): realistic cost, inverted.

Decide KEEP / DEFER / CUT / TEST-FIRST. Confidence drops when success metrics or monetization are undefined.

## Output

```txt
Business note — <decision>

Value prop: <one line> · Segment: <who pays / who uses>
Revenue model: <how> · Unit economics: <rev vs variable cost — sign>
Growth lever: acquisition | retention | expansion | none(?)
Top risks: <2–3> · what would invalidate this
ICE: I×C×E/100 = <score> → KEEP | DEFER | CUT | TEST-FIRST
Recommendation: <one paragraph>
```

## Anti-patterns

- Building before knowing who pays and why.
- Cost-plus pricing for a value product.
- Ignoring variable cost per unit (esp. LLM/infra).
- ICE confidence inflated by enthusiasm or missing metrics.
- Treating a feature with no growth lever as a priority.
