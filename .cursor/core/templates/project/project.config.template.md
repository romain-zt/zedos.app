<!--
  Project Config Template
  Location: .cursor/core/templates/project/project.config.template.md
  Usage: copy to docs/project.config.md and fill per project.
  Purpose: the ONLY place project-specific names live. Rules and skills read
           from here so the .cursor/** workflow stays project-agnostic.
-->

# Project Config

> The reusable `.cursor/**` workflow reads project-specific values from this file.
> Keep `.cursor/**` generic; put names, bands, and stack overrides here.

## Identity

- **Project name:** <!-- e.g. Zedos -->
- **One-line product:** <!-- what it is, for whom -->
- **Repo root layout:** <!-- monorepo | single-app -->

## Stack (overrides to `40-architecture-baseline.mdc`)

State only deviations from the baseline (monorepo · next-forge · Payload i18n+S3 · Postgres · MinIO local).
Start from the **latest stable** release of each framework/dependency (see `05-project-setup.mdc`).

| Concern | Baseline | This project |
|---------|----------|--------------|
| Framework |  next-forge / Next.js | <!-- same | deviation + reason --> |
| CMS/data | Payload (Postgres) | |
| Media | S3 (MinIO local) | |
| i18n | on | |

## Apps (pickable — keep the monorepo, scaffold only what you need)

Setup (`05-project-setup.mdc`) scaffolds **only** the apps listed here. See
`.cursor/core/templates/starter-monorepo/apps/CATALOG.md`. Default to the fewest.

| App | Selected? | Why |
|-----|-----------|-----|
| `web` | <!-- yes/no --> | <!-- buyer/visitor-facing surface --> |
| `cms` | <!-- yes/no --> | <!-- human-edited content/catalog in Payload --> |
| `api` | <!-- yes/no (add when needed) --> | <!-- standalone backend/service surface --> |

## Priority bands

Used by `execution-loop` to assign `Priority` to Feature Areas / Scope Slices.
List each Feature Area under its band. Bands run `P0` (highest) → `P4`.

| Band | Feature Areas (FA-<kebab>) |
|------|----------------------------|
| **P0** | <!-- FA-... --> |
| **P1** | |
| **P2** | |
| **P3** | |
| **P4** | |

Scope Slices inherit their parent Feature Area's band.

## v0 boundary (exclusions)

Surfaces explicitly deferred out of v0. A Scope Slice / Spec / Task touching any
of these must be marked `deferred` with a reference here.

- <!-- e.g. multi-user collaboration / roles -->
- <!-- e.g. subscription billing -->

## Implementation phase

- **Implementation governance enabled:** <!-- yes | no -->
- **Governing decision:** <!-- docs/product-decisions/PD-NNN-implementation-phase.md -->
- **Forbidden-paths default when locked:** <!-- e.g. none (impl allowed) | src/**, app/** -->
