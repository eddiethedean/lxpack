
# LXPack Full Product Roadmap

> **Doc sync:** Phase names and version targets match [PLAN.md](PLAN.md), [SPEC.md](SPEC.md), and [README.md](../README.md). See [docs/README.md](README.md) for the release-phase table.

## Vision Statement

LXPack is an AI-native learning experience application framework and packaging ecosystem.

It enables developers and learning experience designers to:
- build web-native learning applications
- generate courses with AI systems like Claude
- package courses into LMS-compatible formats
- deploy modern interactive learning experiences
- replace the Storyline packaging/runtime workflow

LXPack treats courses as programmable learning applications rather than slide decks.

---

# Strategic Positioning

## What LXPack Is

- AI-native learning framework
- CLI-first learning runtime
- LMS packaging compiler
- SCORM/xAPI/cmi5 export platform
- web-native course runtime
- developer-friendly learning infrastructure

## What LXPack Is NOT

- PowerPoint clone
- traditional slide authoring tool
- timeline animation editor
- WYSIWYG-first platform

---

# Product Pillars

## AI-Native Authoring

Goals:
- deterministic manifests
- schema-driven generation
- reusable prompts
- AI repair workflows
- AI-generated interactions

## Web-Native Runtime

Goals:
- React/Vue/Web Component support
- custom JavaScript interactions
- simulations
- WebGL/canvas support
- multiplayer support

## LMS Compatibility

Standards:
- SCORM 1.2 (shipped)
- SCORM 2004 (Phase 2)
- xAPI (Phase 3)
- cmi5 (Phase 3)
- standalone HTML (shipped)

## Developer Experience

Goals:
- Git-friendly
- CI/CD support
- npm ecosystem integration
- plugin system (later phases)
- reusable components (Phase 2)

---

# Architecture

## Major Components

### CLI
- scaffolding
- validation
- builds
- previews
- packaging

### Runtime
- routing
- tracking
- branching (Phase 2)
- scoring
- LMS communication

### Packaging Engine (`@lxpack/scorm` today)
- SCORM 1.2 generation (shipped)
- SCORM 2004 + sequencing (Phase 2)
- standalone HTML ZIP
- xAPI / cmi5 packaging (Phase 3)

### Validation Engine (`@lxpack/validators`)
- schema validation
- path containment
- assessment packaging
- accessibility validation (Phase 3+)

### Preview Environment
- local server (shipped)
- strict validation (shipped)
- hot reload (future)
- mobile preview (future)
- LMS simulation (SCORM 1.2 preview today)

---

# Standards Support Roadmap

## SCORM 1.2 (shipped — v0.1.x)

- completion tracking
- bookmarking (`lesson_location`)
- compact `suspend_data` (4096-char limit)
- MCQ scoring / passed-failed
- sanitized assessment embedding (no answer YAML in ZIPs)

## SCORM 2004 (Phase 2 — v0.2.x)

- multi-SCO packages with IMS sequencing/navigation in `imsmanifest`
- SCORM 2004 Run-Time API (`API_1484_11`)
- mapping course flow (branching, assessments) to sequencing rules

## xAPI (Phase 3)

- learner events
- simulation analytics
- adaptive tracking

## cmi5 (Phase 3)

- modern LMS launch profiles

## H5P / QTI / LTI

Long-term interoperability — not scheduled for v0.2.

---

# Tech Stack

| Layer | Technology |
|---|---|
| CLI | TypeScript |
| Runtime | TypeScript |
| Bundler | Vite |
| Validation | Zod |
| Packaging | JSZip |
| Preview Server | Fastify |
| Testing | Vitest (unit); Playwright (future e2e) |

---

# Repository Structure (current)

```text
packages/
  cli/
  runtime/
  validators/
  scorm/
examples/
test/fixtures/
docs/
```

Future packages: `components/` (Phase 2), `xapi/`, `cmi5/` (Phase 3).

---

# Course Structure

```text
course/
  course.yaml
  lxpack.config.json
  lessons/
  interactions/
  assets/
  assessments/     # authoring only; not shipped in export ZIPs (v0.1.x)
  theme/             # reserved; not wired in v0.1.x
  .lxpack/           # build output
```

Phase 2 may add `components/` overrides and manifest `variables` / `flow` sections.

---

# Development Phases

## Phase 1 — MVP (shipped — v0.1.x)

**Latest release:** v0.1.1

Features:
- project scaffolding (`lxpack init`)
- markdown lessons and HTML interactions
- local preview with strict validation
- SCORM 1.2 ZIP and standalone HTML export
- YAML MCQ assessments with embedded runtime config
- path containment and safe embedded JSON
- monorepo packages on npm: `@lxpack/cli`, `@lxpack/runtime`, `@lxpack/validators`, `@lxpack/scorm`

## Phase 2 — Runtime expansion (planned — v0.2.x)

Features:
- **SCORM 2004** — multi-SCO export with sequencing/navigation in the manifest
- **Branching** — declarative flow in `course.yaml` (conditions on variables, assessment results, interaction events)
- **Variables** — manifest defaults + runtime `setVariable` / `getVariable` persisted in suspend data
- **Quiz engine** — richer MCQ behavior (retakes, feedback modes, optional question types)
- **Reusable components** — new `@lxpack/components` package with built-in widgets and per-course overrides

Not in Phase 2: xAPI, cmi5, hot reload, themes, plugins (see Phase 3+).

## Phase 3 — Modern standards (planned — v0.3.x)

Features:
- xAPI export and statement helpers
- cmi5 packaging
- analytics hooks
- simulation tracking

## Phase 4 — AI tooling

Features:
- Claude integration
- AI repair and accessibility remediation
- AI-generated interactions

## Phase 5 — Ecosystem

Features:
- plugin marketplace
- component marketplace
- hosted previews

## Phase 6 — Enterprise platform

Features:
- cloud deployment
- analytics dashboards
- hosted runtime
- compliance tooling

---

# npm Package Plan

| Package | Phase |
|---------|-------|
| `@lxpack/cli` | 1 (shipped) |
| `@lxpack/runtime` | 1 (shipped) |
| `@lxpack/validators` | 1 (shipped) |
| `@lxpack/scorm` | 1 (shipped); extended in 2 for SCORM 2004 |
| `@lxpack/components` | 2 |
| `@lxpack/xapi` | 3 |
| `@lxpack/cmi5` | 3 |

---

# Distribution Strategy

Primary: npm (`@lxpack/*`). Secondary: GitHub Releases. CI: lint, build, typecheck, test; publish on tag `v*.*.*`.

---

# Initial Target Users

- technical training teams
- cybersecurity trainers
- AI-native LXD teams
- instructional designers and LMS administrators

---

# Long-Term Vision

LXPack becomes an open learning runtime and AI-native course compiler — **the Vite/Next.js-style ecosystem for AI-generated learning experiences.**
