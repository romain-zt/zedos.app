# Product Surface Gate

Referenced from `SKILL.md` §3.0.5. Read on demand when running `/prd converge`, `/prd prioritize`, or `/prd update`.

The most dangerous failure mode of the PRD workflow is **false convergence**: a clean-looking feature group that hides unresolved product-surface decisions. Surface decisions silently determine scope, dependencies, build cost, and what "done" even means. AI-generated PRD prose is especially good at making absent decisions look present.

The Surface Gate runs *before* the first feature group is drafted for a new PRD, and *again* whenever a feature group surfaces a surface ambiguity that the current PRD has not resolved.

## When to run the gate

The gate does **not** fire during open discovery (`/prd discover`, `/prd note`) or informal PRD conversation. It fires only in `converge`, `prioritize`, and `update` modes, or when the user explicitly asks to validate a feature group.

Within those modes, run the gate before drafting the first WHY/WHO/WHAT/WHEN of a feature group when **any** of:

- `docs/prd/state.md` has no `DIRECTION` set, or it is the scaffold value
- `docs/prd/PRD.md` has no validated feature group yet
- The candidate group introduces a new buyer surface, merchant surface, market, or source-of-truth not already established in the PRD
- Challenger has flagged a `FALSE CONVERGENCE RISK` against the current direction

If none apply, skip the gate — the surface is already established.

## Required surface fields

Ask only the smallest set of product-shaping questions. One short answer per field, or `UNKNOWN — decision needed before implementation`. Never silently infer.

| Field | Question | Why it matters |
|---|---|---|
| Primary market / language | Which market and language is v1 for? | Determines copy, legal, payment rails, support load |
| Buyer entry point | Where does the buyer first encounter the product? | Distribution surface (Shopify page, embed, standalone, link, WhatsApp, …) |
| Buyer-facing surface | Where does the buyer complete the action? | Same surface as entry, or a handoff? |
| Merchant operating surface | Where does the merchant operate it? | Shopify admin, separate admin, calendar, email-only, manual |
| Source of truth (after success) | Which system holds the canonical record after a successful action? | Booking record, Shopify order, calendar event, payment, customer record |
| Confirmation channel | How does the buyer know it worked? | On-screen, email, SMS, WhatsApp, dashboard |
| Payment model (if money) | Deposit, full prepayment, post-pay, free, merchant-configurable? | Determines refund logic, dispute surface, risk |
| Hard v1 exclusions | What surfaces / markets / models are explicitly out of v1? | Caps scope drift |

## Output: Surface Block

Produce one block per gate run. Persisted as part of the active PRD (under "Product Surface" or per feature group, depending on scope).

```md
## Product Surface

- Primary market / language: <answer | UNKNOWN — decision needed before implementation>
- Buyer entry point: <…>
- Buyer-facing surface: <…>
- Merchant operating surface: <…>
- Source of truth: <…>
- Confirmation channel: <…>
- Payment model: <… | n/a>
- Hard v1 exclusions: <list>

## Surface Blockers
- <field>: <what decision is missing> — blocks: <implementation specs | this feature group | none>
```

## Hard rules

- **The gate does not block discussion.** UNKNOWN is a valid, expected answer. Surface ambiguity must be made visible, not resolved by inference.
- **The gate does block implementation readiness.** See `SKILL.md` §6 (convergence checks) and §8 (persistence).
- **Confidence cap.** If `Buyer entry point`, `Buyer-facing surface`, `Merchant operating surface`, `Source of truth`, or `Primary market / language` is UNKNOWN, ICE Confidence for any feature group depending on that field is **capped at 4** (see `SKILL.md` §5).
- **No giant questionnaire.** Ask only fields that materially affect the next decision. Skip `Payment model` if money is not in scope. Group fields the user can answer in one breath.
- **No silent inference.** If the user says "I don't know", write `UNKNOWN — decision needed before implementation`. Do not pick the most plausible answer "for now".
