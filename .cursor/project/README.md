# `.cursor/project/` — Per-Project Overlay

This directory is the **per-project layer** of the Cursor agent framework. It is **gitignored on this framework repo** but committed and owned by downstream projects.

## How it works

The Cursor IDE loads rules and skills recursively from `.cursor/**`. Two sibling layers co-exist:

```
.cursor/
├── core/       ← framework source of truth (read-only for projects)
│   ├── rules/
│   ├── skills/
│   ├── commands/
│   ├── agents/
│   ├── templates/
│   ├── checkers/
│   └── hooks/
└── project/    ← this directory — per-project additions & overrides
    ├── rules/
    ├── skills/
    ├── commands/
    ├── agents/
    ├── templates/
    └── hooks/
```

## Rules

- **`core/` is sacred.** Never edit `core/` in a project repo. Treat it as an npm package. If you need to patch something in `core/`, propose a Framework Decision (FD-NNN) back to the framework repo.
- **`project/` is yours.** Add project-specific rules, skills, and commands here. When a name in `project/` collides with `core/`, the IDE merges both (rules: both apply; skills: project version wins if names collide).
- **Upgrading `core/`.** When the framework repo cuts a new version, copy `.cursor/core/**` into your project's `.cursor/core/` and review the diff. There is no auto-sync.

## What belongs here

| Kind | Example |
|------|---------|
| Project-specific domain rules | `project/rules/payment-gateway-constraints.mdc` |
| Project-specific skills | `project/skills/my-api/SKILL.md` |
| Custom commands for this project | `project/commands/deploy.md` |
| Project-scoped agents | `project/agents/my-domain/specialist.md` |
| Custom artifact templates | `project/templates/custom-ticket.template.md` |
| Project lifecycle hooks | `project/hooks/after-deploy.mdc` |

## Bootstrap

When starting a new project from this framework:

```bash
# One-time copy from the framework repo
cp -r .cursor/core/ your-project/.cursor/core/
cp -r .github/scripts/core/ your-project/.github/scripts/core/
cp .github/workflows/*.yml your-project/.github/workflows/
# Then create your project overlay
mkdir -p your-project/.cursor/project/{rules,skills,commands,agents,templates,hooks}
```

See [`BOOTSTRAP.md`](../../BOOTSTRAP.md) for the full setup sequence.
