
# LXPack Full Product Roadmap

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
- SCORM 1.2
- SCORM 2004
- xAPI
- cmi5
- standalone HTML

## Developer Experience

Goals:
- Git-friendly
- CI/CD support
- npm ecosystem integration
- plugin system
- reusable components

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
- branching
- scoring
- LMS communication

### Packaging Engine
- SCORM generation
- xAPI packaging
- cmi5 packaging
- ZIP artifacts

### Validation Engine
- schema validation
- accessibility validation
- package integrity

### Preview Environment
- hot reload
- mobile preview
- debugging
- LMS simulation

---

# Standards Support Roadmap

## SCORM 1.2
MVP support:
- completion tracking
- bookmarking
- suspend_data
- scoring

## SCORM 2004
Enterprise support:
- sequencing
- navigation APIs
- advanced completion states

## xAPI
Advanced analytics:
- learner events
- simulation analytics
- adaptive tracking

## cmi5
Modern LMS launch support.

## H5P Interoperability
Long-term reusable interaction compatibility.

## QTI Support
Assessment interoperability.

## LTI Support
External tool launch support.

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
| Testing | Playwright |

---

# Rust Opportunities

Potential future Rust modules:
- package compiler
- accessibility scanner
- asset optimizer
- manifest validator

Long-term:
- TypeScript ecosystem with Rust acceleration.

---

# Repository Structure

packages/
  cli/
  runtime/
  validators/
  exporters/
  plugins/
  components/

examples/

---

# Course Structure

course/
  course.yaml
  lessons/
  interactions/
  assets/
  assessments/
  theme/

---

# Manifest Philosophy

Declarative and AI-friendly.

Example:

title: Security Awareness
version: 1.0.0

runtime:
  theme: modern

tracking:
  completion:
    threshold: 0.9

---

# Runtime Philosophy

The runtime replaces Storyline’s runtime layer.

Responsibilities:
- progress persistence
- bookmarking
- LMS communication
- state management
- analytics
- scoring

---

# Interaction Types

Supported interactions:
- quizzes
- branching scenarios
- coding labs
- dashboards
- simulations
- fake terminals
- React apps
- canvas/WebGL

---

# Accessibility

Target:
- WCAG 2.1 AA

Checks:
- alt text
- contrast
- keyboard navigation
- ARIA validation

---

# AI Workflow Features

Commands:

lxpack prompt
lxpack fix
lxpack ask

Goals:
- prompt generation
- AI remediation
- AI interaction generation
- accessibility repair

---

# Plugin System

Plugin categories:
- exporters
- themes
- runtime extensions
- analytics providers
- assessment engines

Example:

lxpack plugin install @lxpack/plugin-moodle

---

# Packaging Philosophy

LXPack packages learning web applications, not slide decks.

---

# Analytics Roadmap

Features:
- xAPI dashboards
- learner analytics
- heatmaps
- adaptive metrics

---

# Security Goals

- sandbox interactions
- CSP enforcement
- signed plugins
- offline mode

---

# Development Phases

## Phase 1 — MVP
Features:
- project scaffolding
- markdown lessons
- HTML interactions
- local preview
- SCORM 1.2 export
- standalone HTML export

## Phase 2 — Runtime Expansion
Features:
- SCORM 2004
- branching
- variables
- quiz engine
- reusable components

## Phase 3 — Modern Standards
Features:
- xAPI
- cmi5
- analytics
- simulation tracking

## Phase 4 — AI Tooling
Features:
- Claude integration
- AI repair
- AI accessibility remediation
- AI-generated interactions

## Phase 5 — Ecosystem
Features:
- plugin marketplace
- component marketplace
- hosted previews

## Phase 6 — Enterprise Platform
Features:
- cloud deployment
- analytics dashboards
- hosted runtime
- compliance tooling

---

# npm Package Plan

@lxpack/cli
@lxpack/runtime
@lxpack/scorm
@lxpack/xapi
@lxpack/cmi5
@lxpack/components

---

# Distribution Strategy

Primary:
- npm

Secondary:
- GitHub Releases
- Homebrew
- Docker images

Future:
- crates.io
- hosted SaaS platform

---

# Initial Target Users

Primary:
- technical training teams
- cybersecurity trainers
- AI-native LXD teams

Secondary:
- instructional designers
- LMS administrators

---

# Long-Term Vision

LXPack becomes:
- an open learning runtime
- an AI-native course compiler
- a programmable learning ecosystem

Strategic vision:

"The Vite/Next.js ecosystem for AI-generated learning experiences."
