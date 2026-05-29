
# LXPack Technical Specification

> **Doc sync:** Release phases match [ROADMAP.md](ROADMAP.md) and [PLAN.md](PLAN.md). **Current release:** v0.5.0. See the [documentation home](../index.md).

## Overview

LXPack is a CLI-driven learning experience compiler and runtime that packages AI-generated courses into standards-compliant LMS deliverables.

---

# Functional Requirements

## FR-001 — Project Initialization

The CLI SHALL support project scaffolding.

### Command

```bash
lxpack init <project-name>
```

### Output

Creates:
- `course.yaml`
- `lessons/`
- `assets/`
- `interactions/`
- `assessments/`
- `components/` (optional overrides for `@lxpack/components`)
- `theme/` (reserved; not wired in v0.2.x)
- `lxpack.config.json`

### Options

- `--dir` — relative output directory (must stay inside cwd; v0.1.1+)
- `--force` — overwrite existing course directory

---

## FR-002 — Local Preview

### Command

```bash
lxpack preview
```

### Implemented (v0.1.x)

- Fastify static server for course assets + bundled runtime
- **Strict validation** before start (same failure mode as `build`)
- Embedded assessment bundle in HTML config (no fetch of author YAML)
- Default preview progress via `localStorage` (`preview.scormMode: local`)
- Optional SCORM 1.2 simulator (`preview.scormMode: scorm12`, `window.API`)
- Optional SCORM 2004 simulator (`preview.scormMode: scorm2004`, `window.API_1484_11`)
- Blocks direct HTTP access to `assessments/`, `course.yaml`, `lxpack.config.json`, `lxpack.config.ts`, dotfiles, and `.lxpack/` (normalized paths; traversal via `..` rejected)
- Options: `-p` / `--port`, `-H` / `--host`

### Planned

| Feature | Phase |
|---------|-------|
| Hot reload | Post–2 |
| Runtime debugging UI | Post–2 |
| Mobile preview | Post–2 |
| Accessibility warnings in preview | 4+ |

---

## FR-003 — Course Validation

### Command

```bash
lxpack validate
```

### Implemented (v0.1.x)

- `course.yaml` schema (Zod, strict)
- Lesson types: `markdown` (`file`), `html` (`path`)
- Assessment YAML structure (MCQ; one correct choice per question)
- Duplicate lesson ID detection
- Referenced files exist on disk
- Path containment (including symlink escape checks)
- Assessment refs must be regular files under the course root

### Planned

| Area | Phase |
|------|-------|
| Branching / flow graph validation | 2 |
| Manifest variables schema | 2 |
| Component reference validation | 2 |
| Automated accessibility rules | 3+ |

---

## FR-004 — Packaging

### Command

```bash
lxpack build --target <target>
```

### Supported targets (v0.4.0)

| Target | Description |
|--------|-------------|
| `scorm12` | SCORM 1.2 ZIP with `imsmanifest.xml`, single SCO launch |
| `scorm2004` | SCORM 2004 4th Edition multi-SCO ZIP with IMS Simple Sequencing subset |
| `standalone` | HTML ZIP or directory (no SCORM manifest) |
| `xapi` | Tin Can package: `tincan.xml`, `index.html`, runtime `mode: "xapi"` |
| `cmi5` | cmi5 package: `cmi5.xml`, launch `index.html`, runtime `mode: "cmi5"` |

`xapi` and `cmi5` require `tracking.xapi.activityIri` (HTTPS IRI) in `course.yaml`.

Default target and output directory: `lxpack.config.json`.

---

# Course Manifest Specification

## File

`course.yaml`

## Example (v0.1.x)

```yaml
title: Security Awareness
version: 1.0.0
description: Optional summary

runtime:
  theme: modern   # reserved; not applied in v0.1.x

tracking:
  completion:
    threshold: 0.9

lessons:
  - id: intro
    title: Introduction
    type: markdown
    file: lessons/intro.md

  - id: phishing_lab
    title: Phishing lab
    type: html
    path: interactions/phishing-lab

assessments:
  - id: final_quiz
    file: assessments/final.yaml
```

## v0.2 extensions (shipped)

- `variables:` — default values and types; persisted with `v:` prefix in suspend data
- `flow:` — branching rules between lessons/assessments (condition AST)
- Lesson type `component` — reference to `@lxpack/components` widgets (`callout`, `image-card`, `checklist`)

---

# Runtime Specification

## Responsibilities

| Responsibility | v0.1.x | v0.2.0 |
|----------------|--------|--------|
| Linear navigation (lessons + assessments) | Yes | Extended with flow |
| Progress persistence | Yes | Yes |
| MCQ assessments | Yes | Quiz engine upgrades (retakes, shuffle, feedback) |
| `window.lxpack` interaction API | Yes | Yes |
| `setVariable` / `getVariable` | Suspend data only | + manifest defaults |
| Branching logic | No | Yes |
| Component lessons | No | Yes |
| SCORM 1.2 LMS API | Yes | Yes |
| SCORM 2004 LMS API | No | Yes |

---

# Interaction API

Interactions MAY emit runtime events:

```javascript
window.lxpack.track({
  type: "interaction",
  id: "phishing_click",
  data: { clicked: true }
});
```

Flow rules MAY consume interaction and assessment events for navigation (v0.2.0).

### Simulation tracking (v0.4.0)

Simulations MAY emit structured xAPI `interacted` statements:

```javascript
window.lxpack.track({
  type: "simulation",
  id: "fire_extinguisher",
  data: {
    simulation: { step: "pull_pin", success: true }
  }
});
```

---

# Tracking Specification

## SCORM 1.2 (v0.1.x)

- LMS API discovery (`window.API` in parent/opener frames)
- `cmi.core.lesson_status`, `cmi.core.score.raw`, `cmi.core.lesson_location`
- `cmi.suspend_data` — compact JSON (4096-character limit); legacy parse fallback
- Completion ratio from completed lessons + passed assessments
- Assessment submission updates status before `LMSCommit`
- Preview / standalone: `localStorage` (no real LMS)

## SCORM 2004 (v0.2.0)

- Run-Time Environment API (`API_1484_11`) with preview simulator
- Multi-SCO manifest with IMS Simple Sequencing subset
- Per-activity launch pages at `sco/<activityId>/index.html`
- Shared `lxpack-runtime.js` and `lxpack-components.js`

## xAPI / cmi5 (v0.4.0)

- Manifest: optional `tracking.xapi.activityIri` (course activity IRI); per-activity IRIs `{activityIri}/activities/{id}`
- Runtime modes `xapi` and `cmi5` use `@lxpack/xapi` builders (no SCORM API)
- cmi5 LMS launch query params: `endpoint`, `auth`, `actor`, `registration`, `activityId` (LRS credentials are not embedded in ZIPs)
- cmi5 `fetch` URL: runtime POSTs for `auth-token` per cmi5 spec; merges with launch `endpoint` / `actor` / `registration` query params
- Verbs: `launched`, `experienced`, `interacted`, `answered`, `completed`, `passed`, `failed`
- Preview: `lxpack.config.json` → `xapi.preview.logStatements` / `mockLrs` (console + `localStorage` queue)

---

# Accessibility (Phase 3+)

Target: WCAG 2.1 AA for authored content. Automated checks (alt text, contrast, keyboard, ARIA) are not implemented in v0.1.x.

Markdown is sanitized with a DOMPurify allowlist in the browser runtime. Custom HTML under `interactions/` is **trusted author input** (not sandboxed).

---

# Plugin System (Phase 6+)

Planned plugin types: export targets, runtime extensions, assessment types, analytics, themes.

```bash
lxpack plugin install @lxpack/plugin-example
```

Not implemented in v0.1.x.

---

# Configuration Specification

## File

`lxpack.config.json`

## Example

```json
{
  "exports": {
    "defaultTarget": "scorm12"
  },
  "xapi": {
    "preview": {
      "logStatements": true,
      "mockLrs": true
    }
  },
  "output": {
    "dir": ".lxpack"
  }
}
```

`output.dir` is resolved with path containment (v0.1.1+). TypeScript config is planned for a later release.

---

# Build Pipeline

1. Discover `course.yaml` (walk up from cwd)
2. `validateCourse` — schema, flow, variables, components, filesystem, assessments
3. `buildRuntimeAssessmentBundle` — learner assessments, answer keys, configs, feedback
4. Bundle `@lxpack/runtime` client + CSS; optional `@lxpack/components` bundle
5. `packageCourse` / `packageScorm2004` — collect assets (skip `assessments/`, configs, `.lxpack/`), write HTML with `safeJsonForHtml` config
6. SCORM 1.2: single-SCO `index.html` + `imsmanifest.xml`
7. SCORM 2004: per-SCO HTML + `generateScorm2004Manifest`
8. xAPI: `tincan.xml` + `index.html` with `mode: "xapi"` and `activityIri`
9. cmi5: `cmi5.xml` + launch `index.html` with `mode: "cmi5"`
10. Write ZIP or directory under `.lxpack/` (unless `-o` / `--dir`)

---

# Security Requirements

## Implemented (v0.1.x)

- Path containment for course assets, init `--dir`, and config output paths
- Assessment answer keys not shipped as static YAML in exports
- `<` escaped in embedded JSON config (`safeJsonForHtml`)
- DOMPurify allowlist for markdown HTML rendering in the browser runtime
- HTML interaction paths validated for safe characters; iframe URLs escaped

## Planned

- Stricter sanitization for custom HTML interactions (author `index.html` is trusted)
- CSP enforcement for interactions
- Sandboxed interaction iframes
- Signed plugins (Phase 6+)

---

# Repository Structure (current)

```text
packages/
  cli/
  runtime/
  validators/
  scorm/
  components/
  xapi/
  cmi5/
examples/
  security-awareness/
  branching-demo/
  xapi-awareness/
  cmi5-demo/
test/fixtures/
docs/
```

---

# Release Milestones (aligned with roadmap)

| Milestone | Phase | Version | Status |
|-----------|-------|---------|--------|
| MVP core | 1 | v0.1.0 | Shipped |
| Security & SCORM fixes | 1 | v0.1.1 | Shipped |
| Runtime expansion | 2 | v0.2.0 | Shipped |
| Modern standards | 3 | v0.3.1 | Shipped |
| AI tooling | 4 | TBD | Planned |

---

# License

Apache-2.0 (see repository [LICENSE](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)).
