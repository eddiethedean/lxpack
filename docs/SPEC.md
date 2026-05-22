
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
- theme/
- lxpack.config.ts

---

## FR-002 — Local Preview

The CLI SHALL provide a local preview server.

### Command

```bash
lxpack preview
```

### Features

- hot reload
- runtime debugging
- interaction testing
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

### Supported Targets

- SCORM 1.2
- SCORM 2004
- xAPI
- cmi5
- standalone HTML

### Command

```bash
lxpack build --target scorm2004
```

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

## SCORM

The runtime SHALL support:
- lesson_status
- score.raw
- suspend_data
- completion
- bookmarking

## xAPI

The runtime SHALL emit:
- launched
- experienced
- answered
- completed
- passed
- failed

---

# Accessibility Requirements

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
lxpack.config.ts
```

## Example

```typescript
export default {
  runtime: {
    theme: "modern"
  },

  exports: {
    scorm12: true,
    scorm2004: true,
    xapi: true
  }
}
```

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
