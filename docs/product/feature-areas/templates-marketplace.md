# Feature Area: Templates marketplace

## Status

`validated`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## PRD Source

- `docs/product/templates-marketplace-v1-cadrage.md`
- Blueprint ROI #14

---

## Product Intent

Founders **fork official templates** (express pitch, B2B SaaS, import cleanup) at project creation — network effect seed without UGC v1.

---

## In Scope

- **10 official** seed templates (metadata + content).
- Catalog browse and **use on create** pre-fill.

## Out of Scope

- Community marketplace / UGC v1.
- Paid template SKUs v1.

---

## Business Objects Touched

| Object | Relationship |
|--------|--------------|
| Template catalog entry | Official seed content |
| Project | Created from template slug |

---

## Open Blockers

| Blocker | NEED_HUMAN |
|---------|------------|
| _(none)_ | — |

---

## Candidate Scope Slices

| Slice | Description | Status |
|-------|-------------|--------|
| `templates-marketplace--official-seed-catalog` | 10 templates metadata + content MD | ready-for-user-stories |
| `templates-marketplace--use-template-on-create` | « Use template » pre-fills create flow | ready-for-user-stories |

---

## Readiness Verdict

**Verdict:** READY FOR SCOPE SLICES
