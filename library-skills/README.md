# LXPack Library Skills

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)

**Library Skills** are portable packages of instructions (and optional scripts) for AI coding agents: Claude Code, Cursor, Windsurf, Aider, Copilot, and others that support the [Agent Skills](https://agentskills.io) `SKILL.md` format.

LLMs do not know your project's current CLI flags, validation rules, or folder layout. These skills act as **lazy-loaded expertise**: the agent reads a short `description` in frontmatter first, then loads the full `SKILL.md` (and `references/` only when needed) instead of pasting huge prompts every session.

**Human guides:** [Library Skills](https://lxpack.readthedocs.io/en/latest/guides/library-skills/) · [Prompts for Claude and Cursor](https://lxpack.readthedocs.io/en/latest/guides/prompts-for-claude/) · [Documentation](https://lxpack.readthedocs.io/en/latest/).

## Included skills

| Skill | When the agent should use it |
|-------|------------------------------|
| **lxpack-author** | Editing `course.yaml`, lessons, assessments, branching; running validate/preview |
| **lxpack-interaction** | Creating or fixing HTML labs under `interactions/` |
| **lxpack-export** | Choosing SCORM/xAPI/cmi5 target and `lxpack build` |
| **lxpack-migrate-legacy** | Mapping Storyline/Rise/Captivate or HTML courses to LXPack files |

Each skill folder:

```text
skill-name/
  SKILL.md       # Required — YAML frontmatter + instructions
  references/  # Optional — deep docs loaded on demand
  scripts/       # Optional — deterministic helpers (validate, preview)
```

## Install

Full walkthrough: [Library Skills guide](https://lxpack.readthedocs.io/en/latest/guides/library-skills/).

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

- Node.js 18 or 20 and `@lxpack/cli` on your `PATH` for `scripts/*.sh` — [Install the CLI](https://lxpack.readthedocs.io/en/latest/getting-started/install-cli/)
- Agent product that discovers `SKILL.md` (Cursor Skills, Claude Code skills, etc.)

## Related documentation

| Topic | Guide |
|-------|--------|
| Course folders | [Course structure](https://lxpack.readthedocs.io/en/latest/guides/course-structure/) |
| HTML labs | [Building interactions](https://lxpack.readthedocs.io/en/latest/guides/building-interactions/) |
| LMS ZIP | [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/) |
| Legacy / HTML migration | [Migrating from legacy tools](https://lxpack.readthedocs.io/en/latest/guides/migrating-from-legacy-tools/) |

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0 — same as LXPack.
