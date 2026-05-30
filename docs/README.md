# LXPack documentation

Source for [lxpack.readthedocs.io](https://lxpack.readthedocs.io/en/latest/). Built with **MkDocs Material**; config at repo root [`mkdocs.yml`](../mkdocs.yml).

## Audience tracks

| Track | Nav path | Who |
|-------|----------|-----|
| **File-based authoring** | Guides → File-based authoring | Instructional designers, YAML/markdown authors |
| **AI-assisted authoring** | Guides → AI-assisted authoring | Claude, Cursor, Library Skills users |
| **LessonKit & React** | Guides → LessonKit & React | React integrators, `@lessonkit/lxpack` consumers |
| **Reference** | Reference tab | CLI flags, schemas, troubleshooting lookup |
| **Project** | Project tab | Contributors, maintainers, changelog |

## Guide vs reference

| Layer | Contains | Example |
|-------|----------|---------|
| **Guide** | Steps, personas, workflows, prompts | [Your first course](getting-started/your-first-course.md) |
| **Reference** | Flags, YAML keys, APIs, error tables | [CLI](reference/cli.md) → includes [`CLI.md`](CLI.md) |

Guides **link to** reference; they do not duplicate schema tables.

## Source-of-truth files (`docs/*.md`)

These files are listed in `mkdocs.yml` `exclude_docs` and included by thin wrappers under `reference/`:

| Source | Wrapper |
|--------|---------|
| [`CLI.md`](CLI.md) | `reference/cli.md` |
| [`COURSE_YAML.md`](COURSE_YAML.md) | `reference/course-yaml.md` |
| [`LXPACK_CONFIG.md`](LXPACK_CONFIG.md) | `reference/lxpack-config.md` |
| [`TRACKING_AND_COMPLETION.md`](TRACKING_AND_COMPLETION.md) | `reference/tracking-and-completion.md` |
| [`SPA_BRIDGE.md`](SPA_BRIDGE.md) | `reference/spa-bridge.md` |
| [`LESSONKIT_INTERCHANGE.md`](LESSONKIT_INTERCHANGE.md) | `reference/lessonkit-interchange.md` |
| [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | `reference/troubleshooting.md` |
| [`LESSONKIT_INTEROPERABILITY.md`](LESSONKIT_INTEROPERABILITY.md) | `reference/lessonkit-interoperability.md` |
| [`LESSONKIT_PACKAGES.md`](LESSONKIT_PACKAGES.md) | `reference/lessonkit-packages.md` |
| [`LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md`](LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md) | `reference/lxpack-upgrades.md` (partial) |
| [`LXPACK_UPGRADES_FOR_LESSONKIT.md`](LXPACK_UPGRADES_FOR_LESSONKIT.md) | `reference/lxpack-upgrades.md` (partial) |

**Link convention:** author root sources with paths relative to `reference/` (where wrappers render), e.g. `cli.md`, `../guides/export-to-lms.md`.

**Snippets only** (`docs/includes/`): install commands, copy-tip — not full topics.

## Include syntax

Wrappers use [pymdownx.snippets](https://facelessuser.github.io/pymdown-extensions/extensions/snippets/):

```markdown
--8<-- "CLI.md"
--8<-- "LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md:10:"
```

`base_path` in `mkdocs.yml`: `docs/includes`, `docs`.

## Local build

```bash
pip install -r requirements-docs.txt
bash scripts/build-docs.sh
mkdocs serve   # optional live preview
```

Strict build matches CI and Read the Docs. See [readthedocs-setup.md](readthedocs-setup.md).

## Adding a new reference topic

1. Write authoritative content in `docs/TOPIC.md` (links relative to `reference/`).
2. Add `docs/reference/topic.md` with title + `--8<-- "TOPIC.md"`.
3. Add the filename to `exclude_docs` in `mkdocs.yml`.
4. Link from guides; do not duplicate tables in guides.
