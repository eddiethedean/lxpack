# Developer documentation

Internal references for contributors and engineers extending LXPack.

**Current release:** v0.3.0

## Release phases

| Phase | Target version | Status | Summary |
|-------|----------------|--------|---------|
| **1 — MVP** | **v0.1.x** | Shipped | CLI, validation, preview, SCORM 1.2, standalone HTML, MCQ assessments |
| **2 — Runtime expansion** | **v0.2.x** | Shipped | SCORM 2004 multi-SCO, branching, variables, quiz engine, `@lxpack/components` |
| **3 — Modern standards** | **v0.3.0** | Shipped | xAPI, cmi5, analytics / simulation tracking |
| **4 — AI tooling** | TBD | Planned | Claude integration, AI repair, AI-generated interactions |
| **5 — Ecosystem** | TBD | Planned | Plugin marketplace, component marketplace, hosted previews |
| **6 — Enterprise platform** | TBD | Planned | Cloud deployment, compliance tooling, hosted runtime |

## Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](SPEC.md) | Functional requirements, manifest shape, runtime/LMS behavior, security |
| [PLAN.md](PLAN.md) | Product goals, users, architecture, phased delivery |
| [ROADMAP.md](ROADMAP.md) | Long-term vision, standards, development phases |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Package boundaries (v0.3.0) |
| [REFACTORING.md](REFACTORING.md) | Refactor invariants and CI commands |

## Published npm packages (v0.3.0)

| Package | Role |
|---------|------|
| `@lxpack/cli` | `init`, `preview`, `validate`, `build` |
| `@lxpack/validators` | Zod schemas, `validateCourse`, assessment bundles |
| `@lxpack/runtime` | Browser client, flow, SCORM APIs, xAPI analytics |
| `@lxpack/scorm` | SCORM / standalone / xAPI / cmi5 packaging |
| `@lxpack/xapi` | Statements, transport, Tin Can XML |
| `@lxpack/cmi5` | cmi5.xml generation |
| `@lxpack/components` | Built-in UI widgets |

Package READMEs live under `packages/*/README.md` in the repository.

## User-facing docs

Instructional designers and authors should start at the [documentation home](../index.md), not this section.
