"""Generate draft v1 user stories and plans for blueprint scope slices."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_US = ROOT / "docs/execution/user-stories"
BASE_PL = ROOT / "docs/execution/plans"

ITEMS: list[tuple[str, str, str, str, str]] = [
    (
        "decision-graph--persist-from-question-history",
        "Decision graph",
        "signed-in founder",
        "see my clarification history stored as durable product decisions",
        "my PRD rationale is traceable without re-entering past turns",
    ),
    (
        "decision-graph--owner-decisions-list-panel",
        "Decision graph",
        "signed-in founder",
        "browse all decisions in one list and filter by PRD section",
        "I can audit what we decided before sharing or exporting",
    ),
    (
        "decision-graph--section-badges-and-links",
        "Decision graph",
        "signed-in founder",
        "see which PRD sections are backed by recorded decisions",
        "I know where the document is evidence-backed vs assumed",
    ),
    (
        "decision-graph--export-decisions-json",
        "Decision graph",
        "signed-in founder",
        "include decisions.json in my Cursor export package",
        "my coding agent inherits structured decision context",
    ),
    (
        "prd-drift-github--connect-repo",
        "PRD drift (GitHub)",
        "signed-in founder",
        "connect my GitHub repo to a project",
        "Zedos can compare shipped code signals to my PRD",
    ),
    (
        "prd-drift-github--evaluate-and-weekly-digest",
        "PRD drift (GitHub)",
        "signed-in founder",
        "receive drift alerts when GitHub and my PRD disagree",
        "I notice scope creep before investors or teammates do",
    ),
    (
        "prd-drift-github--webhook-realtime",
        "PRD drift (GitHub)",
        "signed-in founder",
        "get near-real-time drift signals from GitHub events",
        "I react to pushes and releases without waiting for a weekly email",
    ),
    (
        "collab-async--invite-commenter",
        "Collab async",
        "project owner",
        "invite a commenter by email without granting edit access",
        "I get async feedback without risking PRD edits",
    ),
    (
        "collab-async--section-comment-threads",
        "Collab async",
        "project owner or commenter",
        "comment on PRD sections and resolve threads",
        "we align on specific sections instead of vague email threads",
    ),
    (
        "templates-marketplace--official-seed-catalog",
        "Templates marketplace",
        "signed-in founder",
        "choose from official PRD templates",
        "I start from a credible structure instead of a blank doc",
    ),
    (
        "templates-marketplace--use-template-on-create",
        "Templates marketplace",
        "signed-in founder",
        "start a project from a template in one click",
        "my journey mode and metadata match the template intent",
    ),
    (
        "ai-red-team--adversarial-review-report",
        "AI red team",
        "Pro founder",
        "run an adversarial review before investor share",
        "I fix weak claims and missing risks before external eyes",
    ),
    (
        "integrations-linear--push-stories-and-status-sync",
        "Integrations (Linear)",
        "signed-in founder",
        "push user stories to Linear and sync status back",
        "engineering execution stays linked to product artifacts",
    ),
    (
        "team-data-room--bundle-export-zip",
        "Team & data room",
        "Team plan owner",
        "download a due-diligence zip of product artifacts",
        "I can hand investors a single bundle without manual assembly",
    ),
    (
        "payments--builder-subscription-checkout",
        "Payments",
        "signed-in founder",
        "subscribe to Builder monthly via Stripe",
        "I unlock export and Pro capabilities with predictable billing",
    ),
    (
        "project-workspace--next-action-banner",
        "Project workspace",
        "signed-in founder",
        "always see my single next recommended action",
        "I never wonder what to do after clarify, share, or export",
    ),
    (
        "delivery--export-cursor-conversion-gate",
        "Delivery",
        "Free founder",
        "understand Builder value at first Cursor export",
        "I upgrade when the zip is the real payoff",
    ),
    (
        "owner-milestone-feedback--outcome-prompt-on-share",
        "Owner milestone feedback",
        "signed-in founder",
        "answer whether I shared externally after creating a share link",
        "product learns outcomes (O1) instead of vanity stars only",
    ),
    (
        "prd-versioning--export-markdown-v0-1",
        "PRD versioning",
        "signed-in founder",
        "download my PRD version as Markdown",
        "I can paste or diff PRD content outside Zedos",
    ),
]


def title_from_sid(sid: str) -> str:
    return sid.split("--", 1)[-1].replace("-", " ").title()


def write_pair(sid: str, fa: str, role: str, want: str, so_that: str) -> None:
    slice_rel = f"../../product/scope-slices/{sid}.md"
    title = title_from_sid(sid)
    us_path = BASE_US / f"{sid}--v1.md"
    pl_path = BASE_PL / f"{sid}--v1.plan.md"

    us = f"""# User Story: {title} (v1)

## Parent Scope Slice

[{sid}]({slice_rel})

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Story

As a **{role}**, I want to **{want}** so that **{so_that}**.

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC-1 | I meet prerequisites in the scope slice | I perform the primary action | The success outcome in the slice occurs |
| AC-2 | I am not authorized | I attempt the action | I receive a clear error without data leakage |
| AC-3 | A dependency in the slice is unmet | I attempt the action | I see a blocked or prerequisite message |

---

## Test Plan

- [ ] Unit tests for application use case (happy path)
- [ ] Contract tests for new zod schemas if any
- [ ] E2E or integration test for primary owner journey

---

## Out of Scope

See parent scope slice excluded behaviors.

---

## Blueprint

- Feature Area: **{fa}**
- Generated: 2026-06-04 from blueprint backlog
"""

    pl = f"""# Implementation Plan: {sid} (v1)

## Parent User Story

[{sid} (v1)](../user-stories/{sid}--v1.md)

## Status

`draft`

> **NEED_HUMAN:** false
> **NEED_UPDATE:** false

---

## Approach

Implement per scope slice `{sid}` under FA **{fa}**. Follow hexagonal boundaries: contracts, domain/application, infrastructure, app/ui. See `docs/product/scope-slices/{sid}.md` and related blueprint docs in `docs/product/`.

---

## Layers Affected

- [ ] `domain`
- [ ] `application`
- [ ] `contracts`
- [ ] `infrastructure`
- [ ] `app`
- [ ] `ui`

---

## Touched Files (predicted)

> Refine at plan approval before implement.

| Path | Operation | Rationale |
|------|-----------|-----------|
| TBD | TBD | Filled during plan approval |

---

## Verification

- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

---

## Blueprint

Generated 2026-06-04.
"""

    us_path.write_text(us, encoding="utf-8")
    pl_path.write_text(pl, encoding="utf-8")


def main() -> None:
    BASE_US.mkdir(parents=True, exist_ok=True)
    BASE_PL.mkdir(parents=True, exist_ok=True)
    for row in ITEMS:
        write_pair(*row)
    print(f"wrote {len(ITEMS)} user-story + plan pairs")


if __name__ == "__main__":
    main()
