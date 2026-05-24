# LXPack documentation

Canonical references for product direction, technical behavior, and releases.

| Document | Purpose |
|----------|---------|
| [ROADMAP.md](ROADMAP.md) | Long-term vision, standards, and **development phases** (source of truth for phase names) |
| [PLAN.md](PLAN.md) | Product goals, users, architecture, phased delivery aligned with the roadmap |
| [SPEC.md](SPEC.md) | Functional requirements, manifest shape, runtime/LMS behavior, security |
| [../CHANGELOG.md](../CHANGELOG.md) | Released versions and change history |
| [../README.md](../README.md) | Install, CLI usage, monorepo layout, CI/releases |

## Release phases (aligned across all docs)

| Phase | Target version | Status | Summary |
|-------|----------------|--------|---------|
| **1 — MVP** | **v0.1.x** | **Shipped** (latest [v0.1.1](https://github.com/eddiethedean/lxpack/releases/tag/v0.1.1)) | CLI, validation, preview, SCORM 1.2, standalone HTML, MCQ assessments, secure packaging |
| **2 — Runtime expansion** | **v0.2.0** | Shipped | SCORM 2004 multi-SCO, branching, manifest variables, quiz engine upgrades, `@lxpack/components` |
| **3 — Modern standards** | **v0.3.x** | Planned | xAPI, cmi5, analytics / simulation tracking |
| **4 — AI tooling** | TBD | Planned | Claude integration, AI repair, AI-generated interactions |
| **5 — Ecosystem** | TBD | Planned | Plugin marketplace, component marketplace, hosted previews |
| **6 — Enterprise platform** | TBD | Planned | Cloud deployment, compliance tooling, hosted runtime |

## Published npm packages (v0.1.x)

| Package | Role |
|---------|------|
| `@lxpack/cli` | `init`, `preview`, `validate`, `build` |
| `@lxpack/validators` | Zod schemas, `validateCourse`, assessment bundles |
| `@lxpack/runtime` | Browser client, SCORM 1.2 API, progress |
| `@lxpack/scorm` | SCORM 1.2 / standalone export |

`@lxpack/components` ships in v0.2.0. Planned in Phase 3+: `@lxpack/xapi`, `@lxpack/cmi5`.

## Repository layout (current)

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

When editing docs, keep phase numbers and version targets consistent with this table.
