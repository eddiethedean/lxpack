
# LXPack Plan Document

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

- Improve accessibility
- Improve version control friendliness
- Improve collaboration workflows
- Support reusable learning components
- Enable technical and simulation-based training
- Support custom JavaScript interactions

---

# Target Users

## Primary Users

- Instructional Designers
- Learning Experience Designers
- Technical Trainers
- Corporate Training Teams
- Government Training Teams
- eLearning Developers

## Secondary Users

- Software Developers
- Curriculum Designers
- Cybersecurity Training Teams
- Developer Enablement Teams
- LMS Administrators

---

# Core Product Philosophy

## AI-Native

Claude and other AI systems should be first-class authoring collaborators.

## Web-Native

Courses are modern web applications, not PowerPoint slide exports.

## Standards-Compatible

Enterprise LMS compatibility is mandatory.

## Developer-Friendly

Courses should work naturally with:
- Git
- CI/CD
- testing
- version control
- reusable components

## Extensible

Developers should be able to:
- write plugins
- build custom interactions
- extend tracking
- add export targets

---

# Architecture Overview

## Major Components

### 1. CLI

Responsibilities:
- project scaffolding
- validation
- packaging
- previews
- export management

### 2. Runtime Engine

Responsibilities:
- course navigation
- progress tracking
- state management
- branching
- quiz handling
- interaction APIs

### 3. Packaging Engine

Responsibilities:
- SCORM packaging
- xAPI packaging
- cmi5 packaging
- ZIP generation
- manifest generation

### 4. Validation Engine

Responsibilities:
- schema validation
- accessibility validation
- tracking validation
- package integrity checks

### 5. Preview Server

Responsibilities:
- local course preview
- hot reload
- interaction testing
- debugging

---

# Proposed Tech Stack

## Initial Stack

| Layer | Technology |
|---|---|
| CLI | TypeScript |
| Runtime | TypeScript |
| Bundler | Vite |
| Validation | Zod |
| Packaging | JSZip |
| Testing | Playwright |
| Markdown Rendering | MDX |
| Dev Server | Express/Fastify |

## Future Rust Opportunities

Potential Rust components:
- SCORM compiler
- package validation
- asset optimization
- accessibility scanning
- high-performance build system

---

# Project Phases

# Phase 1 — MVP

## Goals

Build a minimally viable AI-native course compiler.

## Features (shipped in v0.1.0)

- CLI scaffolding (`lxpack init`, `--force`)
- Markdown lessons and HTML interactions
- Local preview server (Fastify)
- Strict `course.yaml` validation (Zod, path containment)
- SCORM 1.2 ZIP export (full `imsmanifest` file list, self-contained runtime bundle)
- Standalone HTML ZIP/directory export
- Progress tracking (preview/standalone `localStorage`; SCORM `suspend_data`)
- Minimal quiz engine (YAML MCQ, passing score, SCORM passed/failed)
- `lxpack.config.json` for default build target and output dir

## Example Commands

```bash
lxpack init my-course
lxpack preview
lxpack validate
lxpack build --target scorm12
```

---

# Phase 2 — Enterprise Readiness

## Features

- SCORM 2004
- xAPI
- cmi5
- branching logic
- variables
- reusable components
- accessibility validation
- analytics hooks
- CI/CD support

---

# Phase 3 — AI Workflow Optimization

## Features

- Claude prompt generation
- AI repair tooling
- AI course optimization
- AI-generated assessments
- AI accessibility remediation
- AI interaction generation

Example:

```bash
lxpack ask "why is my course not completing?"
```

---

# Phase 4 — Ecosystem

## Features

- plugin marketplace
- component marketplace
- LMS integrations
- cloud deployment
- collaborative editing
- hosted review environments

---

# Example Course Structure

```text
course/
  course.yaml
  lessons/
  assets/
  interactions/
  theme/
  assessments/
```

---

# Competitive Advantages

## Compared to Storyline

| Feature | Storyline | LXPack |
|---|---|---|
| AI-native | No | Yes |
| Git-friendly | Weak | Strong |
| Web-native | Partial | Yes |
| Open ecosystem | Limited | Planned |
| Developer extensibility | Limited | Strong |
| Custom interactions | Difficult | Easy |

---

# Long-Term Vision

LXPack evolves into:
- an open eLearning runtime
- an AI-assisted instructional design ecosystem
- a modern alternative to slide-centric authoring tools
- a programmable learning experience platform

The long-term opportunity is to become:
"the Next.js/Vite of AI-generated learning experiences."
