
# LXPack Plan Document

> **Doc sync:** Phases and version targets match [ROADMAP.md](ROADMAP.md). See [Developer docs](index.md) for the release-phase table.

## Vision

LXPack is an AI-native CLI framework for building, validating, previewing, packaging, and deploying interactive learning experience (LX) courses without relying on legacy slide-centric tools such as Articulate Storyline.

The platform is designed specifically for:
- Claude Design
- Claude Code
- AI-assisted instructional design workflows
- Web-native learning experiences
- LMS deployment pipelines

LXPack enables learning experience developers (LXDs) to:
1. Generate course content using AI
2. Structure courses using declarative manifests
3. Build interactive HTML/JS learning experiences
4. Export SCORM/xAPI/cmi5-compatible packages
5. Deploy courses to enterprise LMS systems

---

# Product Goals

## Primary Goals

- Replace the Storyline publishing/runtime layer
- Enable AI-generated learning content workflows
- Standardize course structure for AI tools
- Support enterprise LMS compatibility
- Provide a modern web-native runtime
- Make advanced interactions easier than Storyline

## Secondary Goals

- Improve accessibility (automated checks in Phase 3+)
- Improve version control friendliness
- Improve collaboration workflows
- Support reusable learning components (shipped v0.2.0)
- Enable technical and simulation-based training
- Support custom JavaScript interactions

---

# Target Users

## Primary Users

- Instructional Designers
- Learning Experience Designers
- Technical Trainers
- Corporate and government training teams
- eLearning Developers

## Secondary Users

- Software Developers
- LMS Administrators

---

# Core Product Philosophy

## AI-Native

Claude and other AI systems should be first-class authoring collaborators.

## Web-Native

Courses are modern web applications, not PowerPoint slide exports.

## Standards-Compatible

Enterprise LMS compatibility is mandatory. SCORM 1.2 is shipped; SCORM 2004, xAPI, and cmi5 follow the phased roadmap.

## Developer-Friendly

Courses work with Git, CI/CD, testing, and reusable components.

## Extensible

Plugins, custom interactions, export targets, and analytics providers are planned for later phases.

---

# Architecture Overview

## Major Components (current monorepo)

| Component | Package | Status |
|-----------|---------|--------|
| CLI | `@lxpack/cli` | Shipped |
| Runtime | `@lxpack/runtime` | Shipped |
| Validation | `@lxpack/validators` | Shipped |
| Packaging | `@lxpack/scorm` | Shipped (SCORM 1.2, SCORM 2004, standalone) |
| Components | `@lxpack/components` | Shipped (v0.2.0) |
| Preview server | part of `@lxpack/cli` | Shipped (Fastify) |

### Responsibilities

**CLI** — scaffolding, validation, packaging, previews, export management.

**Runtime** — navigation, flow-aware branching, manifest variables, quiz engine, component lessons, SCORM 1.2 / 2004 APIs, assessments, interaction API (`window.lxpack.track` on the shell; HTML labs use `window.parent.lxpack` inside iframes).

**Packaging** — ZIP artifacts, `imsmanifest.xml`, embedded runtime bundle, assessment config injection.

**Validation** — Zod schemas, filesystem checks, path/symlink containment, assessment bundles for export.

**Preview** — serves course + runtime; strict validation; default `localStorage` progress; optional SCORM 1.2/2004 simulators via `preview.scormMode`.

---

# Tech Stack

| Layer | Technology |
|---|---|
| CLI | TypeScript |
| Runtime | TypeScript |
| Bundler | Vite |
| Validation | Zod |
| Packaging | JSZip |
| Preview | Fastify |
| Testing | Vitest |

Future: Playwright for e2e; optional Rust accelerators for packaging/a11y (see [ROADMAP.md](ROADMAP.md)).

---

# Project Phases

Aligned with [ROADMAP.md](ROADMAP.md) development phases.

## Phase 1 — MVP (shipped — v0.1.x)

**Latest release:** v0.1.1

### Shipped features

- CLI: `lxpack init`, `preview`, `validate`, `build` (`--dir`, `--force`, path containment on init/output)
- Markdown lessons and HTML interaction folders
- Local preview (Fastify); validation errors block preview and build
- Strict `course.yaml` validation (Zod, symlink-safe path containment)
- SCORM 1.2 ZIP export and standalone HTML ZIP/directory export
- MCQ assessments (YAML authoring; learner config + answer keys embedded at build; no `assessments/` in export ZIPs)
- Progress: `localStorage` in preview/standalone; SCORM 1.2 `suspend_data` / `lesson_location` with compact JSON
- `lxpack.config.json` for default export target and output directory
- Example course: `examples/security-awareness`
- CI (lint, build, typecheck, test) and npm publish on tag

### Example commands

```bash
lxpack init my-course
lxpack preview
lxpack validate
lxpack build --target scorm12
```

---

## Phase 2 — Runtime expansion (shipped — v0.2.0)

**Latest release:** v0.2.0

### Shipped features

- SCORM 2004 export with **multi-SCO sequencing/navigation** in `imsmanifest`
- **Branching** — declarative `flow` rules in the manifest
- **Variables** — declared defaults in `course.yaml`; persisted via runtime API and suspend data
- **Quiz engine** — `maxAttempts`, `shuffleChoices`, `showFeedback` (immediate | end | never)
- **`@lxpack/components`** — built-in widgets with per-course overrides
- Example course: `examples/branching-demo`

### Example commands

```bash
lxpack build --target scorm2004
```

Out of scope for v0.2: xAPI, cmi5, hot reload, theme wiring, plugin marketplace.

---

## Phase 3 — Modern standards (shipped — v0.3.1)

- xAPI export and runtime statement helpers (`@lxpack/xapi`, `lxpack build --target xapi`)
- cmi5 packaging (`@lxpack/cmi5`, `lxpack build --target cmi5`)
- analytics via `XapiReporter` and preview logging in `lxpack.config.json`
- Preview optional SCORM simulators via `preview.scormMode` (`local` | `scorm12` | `scorm2004`)
- cmi5 `fetch` launch bootstrap deferred (manifest + runtime shell only in v0.3.1)
- automated accessibility validation (WCAG-oriented) remains future work

---

## Phase 0.4 — LessonKit interoperability (shipped — v0.4.0)

- SPA / React lesson type (`type: spa`) and `lxpackBridge.v1`
- `@lxpack/api` — programmatic `validateCourse` / `buildCourse`
- `lessonkit.json` / `lxpack.import.json` interchange merge
- `@lxpack/tracking-schema` and in-memory assessment injection

See [ROADMAP.md](ROADMAP.md#phase-04-lessonkit-interoperability-shipped-v040) for full shipped list.

---

## Phase 0.5 — LessonKit integration depth (shipped — v0.5.0)

**Shipped:** `packageLessonkit()`, interchange schema v1, interchange-only validation, `lxpack build --lessonkit`, [lessonkit interchange reference](../reference/lessonkit-interchange.md).

**Source of truth:** [Maintainer upgrade plan](../reference/lxpack-upgrades.md#upgrade-plan-for-lxpack-maintainers).

---

## Phase 0.6.1 — Bugfix patch (shipped — v0.6.1)

Packaging, LessonKit config resolution, runtime/SCORM/xAPI fixes — see [Changelog](../project/changelog.md#061-2026-05-29).

## Phase 0.6.2 — Node.js 18 support (shipped — v0.6.2)

Node.js 18 and 20, runtime navigation fixes, LessonKit/API parity, validator cleanup — see [Changelog](../project/changelog.md#062-2026-05-30).

## Phase 0.6 — LessonKit bridge and conformance (shipped — v0.6.0)

- `@lxpack/spa-bridge`, telemetry map, theme presets, `lxpack preview --lessonkit`
- `@lxpack/conformance`, `@lxpack/lessonkit`, SCORM SPA recipes, [API stability](api-stability.md)

See [ROADMAP.md](ROADMAP.md#phase-06-lessonkit-bridge-and-conformance-shipped-v060).

---

## Phase 5 — AI tooling (v0.6+)

- Claude prompt generation and repair workflows
- AI-generated assessments and interactions
- Example: `lxpack ask "why is my course not completing?"`

---

## Phase 6 — Ecosystem (v0.6+)

- plugin marketplace
- component marketplace
- LMS integrations and hosted review environments
- custom lesson runtime plugin slot

---

## Phase 7 — Enterprise platform (v0.7+)

- cloud deployment
- analytics dashboards
- hosted runtime
- compliance tooling

---

# Example Course Structure

```text
course/
  course.yaml
  lxpack.config.json
  lessons/
  interactions/
  assets/
  assessments/
  components/     # optional widget overrides (v0.2.0)
  theme/          # reserved (not wired in v0.2.x)
  .lxpack/
```

---

# Competitive Advantages

## Compared to Storyline

| Feature | Storyline | LXPack |
|---|---|---|
| AI-native | No | Yes |
| Git-friendly | Weak | Strong |
| Web-native | Partial | Yes |
| Open ecosystem | Limited | Planned (Phase 6+) |
| Developer extensibility | Limited | Strong |
| Custom interactions | Difficult | Easy |

---

# Long-Term Vision

LXPack evolves into an open eLearning runtime and programmable learning experience platform — **the Next.js/Vite of AI-generated learning experiences** (see [ROADMAP.md](ROADMAP.md)).
