---
version: v1
status: draft
supersedes: null
date: {{DATE}}
---

<!--
  This PRD is an OVERVIEW — start fast, don't try to be exhaustive. Capture the
  thesis, global picture, Flow Inventory and blockers, then stop. Detail that
  would bloat this doc goes into chunk files under docs/prd/chunks/ (see the
  `# PRD Chunks` index below). Edit small chunks, not a monolith.
  Sections you don't know yet: leave as TBD — that's expected early.
-->

# Why This Version Exists

{{WHY_THIS_VERSION_EXISTS}}

# Product Overview

{{PRODUCT_OVERVIEW}}

# Problem & Users

{{PROBLEM_AND_USERS}}

# Product Surface

- Primary market / language: {{PRIMARY_MARKET_LANGUAGE}}
- Buyer entry point: {{BUYER_ENTRY_POINT}}
- Buyer-facing surface: {{BUYER_FACING_SURFACE}}
- Merchant operating surface: {{MERCHANT_OPERATING_SURFACE}}
- Source of truth: {{SOURCE_OF_TRUTH}}
- Confirmation channel: {{CONFIRMATION_CHANNEL}}
- Payment model: {{PAYMENT_MODEL}}
- Hard v1 exclusions:
  - {{EXCLUSION_1}}
  - {{EXCLUSION_2}}

## Surface Blockers

- {{SURFACE_BLOCKER_OR_NONE}}

# Global Product Picture

{{GLOBAL_PRODUCT_PICTURE_OR_TBD}}

# Operating Model

{{OPERATING_MODEL_OR_TBD}}

# Core User Journeys

{{CORE_USER_JOURNEYS_OR_TBD}}

# Flow Inventory

{{FLOW_INVENTORY_OR_TBD}}

# PRD Chunks

Detailed product definition offloaded from this overview lives in chunk files
(`docs/prd/chunks/<slug>.md`, from `.cursor/core/templates/prd/chunk.template.md`).
Keep this index short; link each chunk with a one-line summary.

| Chunk | Covers | Status | Link |
|-------|--------|--------|------|
| {{CHUNK_NAME_OR_NONE}} | {{CHUNK_COVERS}} | {{CHUNK_STATUS}} | {{CHUNK_LINK}} |

# Business Objects

{{BUSINESS_OBJECTS_OR_TBD}}

# Configuration Matrix

{{CONFIGURATION_MATRIX_OR_TBD}}

# Integration Boundaries

{{INTEGRATION_BOUNDARIES_OR_TBD}}

# MVP Completeness Checklist

{{MVP_COMPLETENESS_CHECKLIST_OR_TBD}}

# Feature Groups

{{FEATURE_GROUPS}}

# Build Sequence

{{BUILD_SEQUENCE_OR_TBD}}

# Out of Scope

- {{PRD_LEVEL_EXCLUSION_1}}
- {{PRD_LEVEL_EXCLUSION_2}}

# Success Metrics

{{SUCCESS_METRICS_OR_TBD}}

# Risks & Assumptions

- {{RISK_OR_ASSUMPTION_1}}
- {{RISK_OR_ASSUMPTION_2}}
