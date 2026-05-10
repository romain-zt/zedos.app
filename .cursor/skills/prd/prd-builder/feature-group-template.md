# Feature Group Template & Status Semantics

Referenced from `SKILL.md` §4. Standard and critical feature groups use this exact template. Lightweight groups use the smaller template inlined in `SKILL.md` §3.0.

## Standard / critical template

```md
# <Feature Group Name>

## WHY
<3–5 lines: user/business reason. No solutioning.>

## WHO
<Target users — specific roles or segments. Not "everyone".>

## WHAT
<3–5 lines: the capability in user-visible terms. Verbs over nouns.>

## WHEN
<Trigger/context: when in the user's workflow does this matter?>

## Product Surface
<Inherit from PRD-level Surface block, OR list overrides for this group.
Required fields (see `surface-gate.md`). Use `inherits PRD` if no override.
Any UNKNOWN field caps Confidence at 4 and blocks implementation specs.>

## Definition of Done
- <Observable, user-visible condition 1>
- <Observable, user-visible condition 2>

## ICE
<Impact>,<Confidence>,<Ease>

Impact: <one line>
Confidence: <one line>
Ease: <one line>

Why Confidence is not higher: <required>
What would invalidate this: <required>

## Dependencies
- <Other feature group or external dependency — or "None">

## Out of Scope
- <Explicit exclusion 1>
- <Explicit exclusion 2>

## Open Questions
- <Unresolved question blocking confidence>

## Status
exploratory | validated-with-open-surface | validated | committed

## Validation Metadata
Last validated: YYYY-MM-DD
Stale after: YYYY-MM-DD
```

## Section requirements & failure modes

| Section | Required | Common failure | Correction |
|---|---|---|---|
| WHY | yes | Restates WHAT | Force "so that <outcome>" clause |
| WHO | yes | "All users" | Demand a role or segment |
| WHAT | yes | Implementation language | Strip frameworks and services |
| WHEN | yes | Vague ("anytime") | Anchor to a user moment |
| Product Surface | yes | Silently inferred / missing | Run Surface Gate (`surface-gate.md`); UNKNOWN is allowed, silent inference is not |
| DoD | yes | Engineering-shaped | Reject; rewrite as user-observable |
| ICE | yes | Fake confidence | See `ice-scoring.md` |
| Dependencies | optional | Hides scope creep | Each dep must be defined or external |
| Out of Scope | yes | Empty | Block until ≥2 exclusions |
| Open Questions | optional | Dumping ground | Flag if it blocks Confidence ≥ 7 |
| Status | yes | Never updated; `validated` claimed while surface UNKNOWN | Use `validated-with-open-surface` when surface fields are UNKNOWN; update at every `/prd update` pass |
| Validation Metadata | required for validated/committed | Missing on critical groups | Add at first `/prd update` after initial draft |

## Status semantics

| Status | Means | May proceed to |
|---|---|---|
| `exploratory` | Shape under discussion; not user-validated | further discovery; not persistence as ready |
| `validated-with-open-surface` | User value, WHAT, DoD agreed; one or more required surface fields are UNKNOWN | persistence (with explicit blockers listed); NOT implementation specs |
| `validated` | All convergence checks pass AND all required surface fields resolved | persistence; implementation specs |
| `committed` | `validated` + the team has decided to build it | implementation |

A group cannot skip from `exploratory` to `committed`. A group cannot be `validated` while any required surface field is UNKNOWN — downgrade to `validated-with-open-surface` instead.
