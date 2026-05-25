# LXPack Library Skills

**Library Skills** are portable packages of instructions (and optional scripts) for AI coding agents: Claude Code, Cursor, Windsurf, Aider, Copilot, and others that support the [Agent Skills](https://agentskills.io) `SKILL.md` format.

LLMs do not know your project's current CLI flags, validation rules, or folder layout. These skills act as **lazy-loaded expertise**: the agent reads a short `description` in frontmatter first, then loads the full `SKILL.md` (and `references/` only when needed) instead of pasting huge prompts every session.

## Included skills

| Skill | When the agent should use it |
|-------|------------------------------|
| **lxpack-author** | Editing `course.yaml`, lessons, assessments, branching; running validate/preview |
| **lxpack-interaction** | Creating or fixing HTML labs under `interactions/` |
| **lxpack-export** | Choosing SCORM/xAPI/cmi5 target and `lxpack build` |
| **lxpack-migrate-legacy** | Mapping Storyline/Rise/Captivate content to LXPack files |

Each skill folder:

```text
skill-name/
  SKILL.md       # Required — YAML frontmatter + instructions
  references/  # Optional — deep docs loaded on demand
  scripts/       # Optional — deterministic helpers (validate, preview)
```

## Install

From the LXPack repository (or a clone):

```bash
# Global — available in all projects (Cursor, Claude Code, ~/.agents/skills)
./library-skills/install.sh --global

# This repo only — for LXPack contributors
./library-skills/install.sh --project

# A specific course folder
./library-skills/install.sh --project --directory ~/courses/security-2026
```

Install locations:

| Scope | Paths |
|-------|--------|
| **Global** | `~/.cursor/skills/`, `~/.claude/skills/`, `~/.agents/skills/` |
| **Project** | `<course>/.cursor/skills/`, `<course>/.claude/skills/` |

Re-run install after `git pull` to refresh skills from upstream.

## Requirements

- Node.js 20+ and `@lxpack/cli` on your `PATH` for `scripts/*.sh`
- Agent product that discovers `SKILL.md` (Cursor Skills, Claude Code skills, etc.)

## Human documentation

Full guides for non-coders: [lxpack.readthedocs.io](https://lxpack.readthedocs.io/en/latest/guides/library-skills/).

## License

Apache-2.0 — same as LXPack.
