# LXPack

[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![Release](https://github.com/eddiethedean/lxpack/actions/workflows/release.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/release.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

**AI-native learning experience compiler and runtime** — build web-native courses from declarative manifests, preview them locally, validate structure with schemas, and export SCORM 1.2 or standalone packages for your LMS.

LXPack treats courses as programmable learning applications (markdown lessons, HTML interactions, YAML assessments), not slide decks. It is designed for AI-assisted authoring workflows (Claude Code, Claude Design) and enterprise LMS deployment.

## Features

- **Declarative manifests** — `course.yaml` defines lessons, interactions, assessments, and tracking rules
- **Schema validation** — Zod-powered checks for manifest shape and on-disk assets before build
- **Browser runtime** — lesson navigation, markdown rendering, HTML interactions, YAML assessments (MCQ), progress tracking
- **SCORM 1.2** — discovers the LMS `API` in parent/opener frames; preview mode uses a local simulator with `localStorage`
- **Local preview** — Fastify dev server serves the course and bundled runtime (default `http://127.0.0.1:3847`)
- **Export targets** — SCORM 1.2 ZIP (`imsmanifest.xml`) or standalone HTML ZIP/directory
- **Course config** — optional `lxpack.config.json` for default export target and output directory
- **Monorepo packages** — publishable `@lxpack/*` modules with full test coverage

## Requirements

- [Node.js](https://nodejs.org/) **20+**
- [pnpm](https://pnpm.io/) **9.15** (see `packageManager` in `package.json`) — for developing LXPack from source

## Install

```bash
npm install -g @lxpack/cli
# or: pnpm add -g @lxpack/cli
```

Then scaffold a course from any directory:

```bash
lxpack init my-course
cd my-course
lxpack preview
```

## Quick start (from source)

From the repository root:

```bash
corepack enable
pnpm install
pnpm build

# Scaffold a new course
pnpm exec lxpack init my-course
cd my-course

# Preview (run from the course directory)
pnpm exec lxpack preview

# Validate and export
pnpm exec lxpack validate
pnpm exec lxpack build --target scorm12
```

Build artifacts are written under `.lxpack/` by default (for example `.lxpack/my-course-scorm12.zip`).

### Try the example course

```bash
pnpm build
cd examples/security-awareness
pnpm exec lxpack preview
pnpm exec lxpack validate
pnpm exec lxpack build --target scorm12
```

## CLI reference

| Command | Description |
|---------|-------------|
| `lxpack init <name>` | Scaffold a new course (`-d, --dir`, `-f, --force`) |
| `lxpack preview` | Start local preview server (`-p, --port`, `-H, --host`) |
| `lxpack validate` | Validate `course.yaml` and referenced files |
| `lxpack build` | Package for LMS or standalone export |

### `build` options

| Option | Description |
|--------|-------------|
| `-t, --target <target>` | `scorm12` (default) or `standalone` |
| `-o, --output <path>` | Output ZIP file or directory |
| `--dir` | Write an unpacked directory instead of a ZIP |

Examples:

```bash
lxpack build --target scorm12
lxpack build --target standalone -o ./dist/course.zip
lxpack build --target standalone --dir -o ./dist/standalone
```

Commands discover the course by walking up from the current directory until they find `course.yaml`.

## Course structure

```text
my-course/
  course.yaml          # Course manifest (required)
  lxpack.config.json   # Optional: defaultTarget, output dir
  lessons/             # Markdown lesson files
  interactions/        # HTML/JS interaction folders (index.html)
  assessments/         # Quiz YAML files
  assets/              # Static assets
  theme/               # Optional theme assets (not wired in 0.1.1)
  .lxpack/             # Build output (generated)
```

### Minimal `course.yaml`

```yaml
title: My Course
version: 1.0.0
description: Optional summary

lessons:
  - id: intro
    title: Introduction
    type: markdown
    file: lessons/intro.md

  - id: lab
    title: Hands-on lab
    type: html
    path: interactions/lab

assessments:
  - id: quiz
    file: assessments/quiz.yaml

tracking:
  completion:
    threshold: 0.9
```

Lesson types:

- **markdown** — `file` points to a `.md` lesson
- **html** — `path` points to a folder containing `index.html`

## Monorepo layout

```text
packages/
  cli/          @lxpack/cli       — lxpack CLI (init, preview, validate, build) — [README](packages/cli/README.md)
  runtime/      @lxpack/runtime   — browser client, routing, SCORM API — [README](packages/runtime/README.md)
  validators/   @lxpack/validators — Zod schemas + validateCourse — [README](packages/validators/README.md)
  scorm/        @lxpack/scorm     — imsmanifest.xml + ZIP packaging — [README](packages/scorm/README.md)
examples/
  security-awareness/   — sample course
test/
  fixtures/             — shared validation/build test courses
docs/
  SPEC.md, PLAN.md, ROADMAP.md
```

```mermaid
flowchart LR
  course[course.yaml + assets]
  cli[@lxpack/cli]
  validators[@lxpack/validators]
  runtime[@lxpack/runtime]
  scorm[@lxpack/scorm]
  lms[LMS / browser]

  course --> cli
  cli --> validators
  cli --> runtime
  cli --> scorm
  scorm --> lms
  runtime --> lms
```

## Development

```bash
pnpm install
pnpm build          # build all packages (required before preview/tests)
pnpm lint           # ESLint on package sources
pnpm typecheck      # TypeScript per package
pnpm test           # Vitest across packages
pnpm test:coverage  # 100% coverage thresholds (packages only)
```

Run a single package:

```bash
pnpm --filter @lxpack/validators test
pnpm --filter @lxpack/cli build
```

## CI and releases

| Workflow | Trigger | Steps |
|----------|---------|--------|
| [CI](https://github.com/eddiethedean/lxpack/blob/main/.github/workflows/ci.yml) | Push/PR to `main` or `master` | lint, build, typecheck, test (separate jobs) |
| [Release](https://github.com/eddiethedean/lxpack/blob/main/.github/workflows/release.yml) | Tag `v*.*.*` | checks, then publish `@lxpack/*` to npm |

Published packages: `@lxpack/cli`, `@lxpack/runtime`, `@lxpack/validators`, `@lxpack/scorm`.

To cut a release:

1. Add an npm token as the GitHub secret `NPM_TOKEN`:
   - **Granular access token** — enable **Bypass 2FA for publish** and grant **Read and write** on `@lxpack/*`, or
   - **Classic automation token** — type **Automation**.
2. Tag and push: `git tag v0.1.1 && git push origin v0.1.1`

The release workflow runs all CI checks before publishing. See [CHANGELOG.md](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md) for release notes.

## Roadmap

Phase 1 (current, **v0.1.1**) delivers init, preview, validate, minimal MCQ assessments, SCORM 1.2 export with real LMS API discovery, and standalone HTML export. Built packages embed assessments in the runtime config (author `assessments/*.yaml` files are not shipped). Planned work includes SCORM 2004, xAPI/cmi5, hot reload, themes, and richer interactions — see [ROADMAP.md](https://github.com/eddiethedean/lxpack/blob/main/docs/ROADMAP.md).

## Documentation

- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)
- [Technical Specification](https://github.com/eddiethedean/lxpack/blob/main/docs/SPEC.md)
- [Product Plan](https://github.com/eddiethedean/lxpack/blob/main/docs/PLAN.md)
- [Roadmap](https://github.com/eddiethedean/lxpack/blob/main/docs/ROADMAP.md)

## License

Apache-2.0
