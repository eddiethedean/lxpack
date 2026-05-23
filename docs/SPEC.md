
# LXPack Technical Specification

## Overview

LXPack is a CLI-driven learning experience compiler and runtime system designed to package AI-generated courses into standards-compliant LMS deliverables.

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
- course.yaml
- lessons/
- assets/
- interactions/
- assessments/
- theme/
- lxpack.config.json

### Options

- `--dir` — output directory (defaults to project name)
- `--force` — overwrite existing `course.yaml`

---

## FR-002 — Local Preview

The CLI SHALL provide a local preview server.

### Command

```bash
lxpack preview
```

### Implemented (v0.1.0)

- Static course + runtime serving
- Schema validation before start (blocks on invalid manifest; warns on missing files)
- Preview SCORM simulator (`localStorage`)
- Port/host options (`-p`, `-H`)

### Planned

- hot reload
- runtime debugging UI
- mobile preview
- accessibility warnings

---

## FR-003 — Course Validation

The CLI SHALL validate course structure and metadata.

### Command

```bash
lxpack validate
```

### Validation Areas

- schema compliance
- missing assets
- invalid interaction references
- broken lesson links
- accessibility issues
- invalid tracking configuration

---

## FR-004 — Packaging

The CLI SHALL export LMS-compatible packages.

### Supported Targets (v0.1.0)

- SCORM 1.2
- standalone HTML

### Planned Targets

- SCORM 2004
- xAPI
- cmi5

### Command

```bash
lxpack build --target scorm12
lxpack build --target standalone
```

Default target and output directory may be set in `lxpack.config.json`.

---

# Course Manifest Specification

## File

```text
course.yaml
```

## Example

```yaml
title: Security Awareness
version: 1.0.0

runtime:
  theme: modern

tracking:
  completion:
    threshold: 0.9

lessons:
  - id: intro
    type: markdown
    file: lessons/intro.md

  - id: phishing_lab
    type: html
    path: interactions/phishing-lab

assessments:
  - id: final_quiz
    file: assessments/final.yaml
```

---

# Runtime Specification

## Responsibilities

The runtime SHALL provide:
- routing
- progress persistence
- variable storage
- branching logic
- assessment scoring
- LMS communication
- interaction APIs

---

# Interaction API

## Event API

Interactions SHALL emit runtime events.

## Example

```javascript
window.lxpack.track({
  type: "interaction",
  id: "phishing_click"
})
```

---

# Tracking Specification

## SCORM (v0.1.0 — SCORM 1.2)

The runtime supports:
- LMS API discovery (`window.API` in parent/opener chain)
- `lesson_status`, `score.raw`, `suspend_data` (4096-char limit), `lesson_location`
- Completion ratio from lessons + passed assessments
- Preview mode: `localStorage`-backed simulator (not sent to a real LMS)

## xAPI (planned)
- launched
- experienced
- answered
- completed
- passed
- failed

---

# Accessibility Requirements (planned for automated validation)

## WCAG

The platform SHALL target WCAG 2.1 AA compliance.

## Validation

Accessibility validation SHALL include:
- missing alt text
- contrast checks
- keyboard navigation
- ARIA validation

---

# Plugin System

## Goals

Allow third-party extension development.

## Plugin Types

- export targets
- runtime extensions
- assessment types
- analytics providers
- themes
- interaction libraries

## Example

```bash
lxpack plugin install lxpack-plugin-moodle
```

---

# Configuration Specification

## File

```text
lxpack.config.json
```

## Example

```json
{
  "exports": {
    "defaultTarget": "scorm12"
  },
  "output": {
    "dir": ".lxpack"
  }
}
```

TypeScript config evaluation is planned for a later release.

---

# Build Pipeline

## Stages

1. Parse manifests
2. Validate schema
3. Resolve assets
4. Bundle interactions
5. Generate runtime
6. Build LMS manifests
7. Package ZIP artifacts

---

# Security Requirements

## Requirements

- no remote code execution
- sandbox interactions
- CSP enforcement
- optional offline mode
- signed plugin support

---

# Future Features

## Planned

- adaptive learning
- AI tutoring
- live analytics
- collaborative editing
- visual builder
- simulation engine
- multiplayer exercises

---

# Recommended Repository Structure

```text
packages/
  cli/
  runtime/
  validators/
  exporters/
  plugins/
  docs/

examples/
```

---

# Suggested Open Source License

Recommended:
- Apache 2.0
or
- MIT

Apache 2.0 is recommended if enterprise adoption is a major goal.

---

# Suggested Initial Milestones

## Milestone 1

- CLI scaffolding
- preview server
- markdown lessons
- SCORM 1.2 export

## Milestone 2

- variables
- branching
- quiz engine
- xAPI support

## Milestone 3

- cmi5
- plugin system
- accessibility engine

## Milestone 4

- AI tooling
- Claude integration
- analytics dashboard
