# ICE Scoring

Referenced from `SKILL.md` §5. Captured as a flat tuple: `Impact,Confidence,Ease` (e.g. `8,6,7`).

## Scale (1–10 each)

| Axis | 1 | 5 | 10 |
|---|---|---|---|
| **Impact** | Marginal value | Solid value for a real segment | Game-changer for the core problem |
| **Confidence** | Pure guess | Reasonable inference, weak data | Validated with direct user evidence |
| **Ease** | Massive cost, deep unknowns | Real work, known approach | Trivial to ship and operate |

## Formula

```
score = Impact × Confidence × Ease / 100
```

Max score: 10.0. Typical honest range: 0.5–5.0.

Why multiplicative: a weakness in ANY axis drags the entire score down. Low Confidence (C=3) cuts the score by 70% regardless of Impact. High Ease cannot compensate for low Impact.

## Display guidance

The ICE **tuple** (`8,6,7`) is the canonical artifact stored in the PRD and used in discussion. Humans reason well about individual axis values.

The **composite score** (`I × C × E / 100`) is used only for ranking across feature groups (`SKILL.md` §7). Do not use the composite score in conversation — it obscures the reasoning. When discussing priority, talk about the axes: "Impact is high but Confidence is low — we need a test before committing."

Never let a single number replace the three-axis discussion.

## Tie-break

Higher Ease first (cheaper to validate), then higher Confidence.

## Hard rules

- Reject any axis at 9–10 without evidence-rooted justification.
- If Confidence ≤ 4, propose the cheapest test that would raise it before recommending build.
- If Ease ≥ 9, ask: "What's the hidden cost — operations, support, edge cases?"
- Never accept 10,10,10.
- Default Confidence for new ideas: 3–4.
- Confidence ≥ 7 requires evidence from Researcher.
- Ease ≥ 8 requires challenge from Challenger.
- "Why Confidence is not higher" and "What would invalidate this" are required in every ICE block. An ICE block without them is not scored.
- Default Confidence for new ideas with no user evidence: 3 (not 5, not 7).
- **Surface cap.** If any of `Buyer entry point`, `Buyer-facing surface`, `Merchant operating surface`, `Source of truth`, or `Primary market / language` is UNKNOWN for this group (per `surface-gate.md`), Confidence is capped at **4** regardless of evidence quality. The cap is lifted only when the surface field is resolved or the user explicitly waives the uncertainty in writing (recorded in Open Questions).

## Staleness defaults

| Status | Confidence half-life | Stale after |
|---|---|---|
| `exploratory` | 14 days | 14 days from last validated |
| `validated` | 45 days | 45 days from last validated |
| `committed` | 90 days | 90 days from last validated |

A stale group must be re-challenged by Challenger before prioritization or implementation. Do not silently resume stale groups.
