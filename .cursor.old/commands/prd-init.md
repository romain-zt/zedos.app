# /prd init — Initialize PRD workspace from templates

## Purpose

Create or repair the project-scoped PRD documentation workspace from canonical templates.

This command is used when:
- `docs/` is missing
- `docs/prd/` is missing
- `docs/product-decisions/` is missing
- core PRD files are missing or empty
- starting a new project from the Cursor workflow setup

## Canonical source

All reusable templates come from:

`.cursor/templates/prd/`

Never copy structure from existing `docs/**` files as templates.

## Files to create

Create directories if missing:

- `docs/prd/`
- `docs/prd/archive/`
- `docs/prd/notes/`
- `docs/prd/questions/`
- `docs/product-decisions/`

Create files if missing or empty:

- `docs/prd/PRD.md` from `.cursor/templates/prd/PRD.template.md`
- `docs/prd/state.md` from `.cursor/templates/prd/state.template.md`
- `docs/prd/history.md` from `.cursor/templates/prd/history.template.md`
- `docs/prd/questions/open-questions.md` from `.cursor/templates/prd/open-questions.template.md`
- `docs/product-decisions/README.md` from `.cursor/templates/prd/product-decisions-readme.template.md`

Create if missing:

- `docs/prd/archive/.gitkeep`

Optional:
- Do not create a discovery note until the first `/prd note` or `/prd discover` input.
- Do not create `PD-001.md` automatically unless the user asks to record a product decision.

## Placeholder replacement

When initializing templates, replace:

- `{{DATE}}` with current date
- `{{VERSION}}` with `v1`
- `{{WHY}}` with `Initial scaffold`
- `{{ARCHIVE_OR_DASH}}` with `—`
- `{{DIRECTION}}` with `TBD`
- `{{LAST_MAJOR_CHANGE}}` with `Initial scaffold`
- `{{WHY_THIS_VERSION_EXISTS}}` with `Scaffold PRD — replace sections as discovery proceeds.`
- all other unknown placeholders with `TBD`

## Safety rules

- Do not overwrite non-empty existing project docs.
- If a file exists and is non-empty, leave it unchanged.
- If a file exists but is empty, initialize it from the matching template.
- If `history.md` contains project-specific rows, do not reset it unless explicitly asked.
- Do not create archives except `.gitkeep`.
- Do not modify product docs beyond initialization.
- Do not run PRD discovery, convergence, challenge, prioritize, specs, tickets, implementation, or architecture.

## Output

After running, show only:

1. Created directories
2. Created files
3. Skipped existing non-empty files
4. Empty files initialized
5. Next recommended command

Expected next command:

`/prd discover`
