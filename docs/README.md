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
| **2 — Runtime expansion** | **v0.2.x** | **Shipped** (latest [v0.2.2](../CHANGELOG.md#022---2026-05-24); tag `v0.2.2` to publish) | SCORM 2004 multi-SCO, branching, manifest variables, quiz engine upgrades, `@lxpack/components` |
| **3 — Modern standards** | **v0.3.0** | **Shipped** | xAPI, cmi5, analytics / simulation tracking |
| **4 — AI tooling** | TBD | Planned | Claude integration, AI repair, AI-generated interactions |
| **5 — Ecosystem** | TBD | Planned | Plugin marketplace, component marketplace, hosted previews |
| **6 — Enterprise platform** | TBD | Planned | Cloud deployment, compliance tooling, hosted runtime |

## Published npm packages (v0.3.0)

| Package | Role |
|---------|------|
| `@lxpack/cli` | `init`, `preview`, `validate`, `build` (`scorm12`, `scorm2004`, `standalone`, `xapi`, `cmi5`) |
| `@lxpack/validators` | Zod schemas, `validateCourse`, xAPI tracking validation, assessment bundles |
| `@lxpack/runtime` | Browser client, flow engine, SCORM APIs, xAPI analytics, quiz module |
| `@lxpack/scorm` | SCORM / standalone / xAPI / cmi5 export and packaging |
| `@lxpack/xapi` | Statement builders, transport, Tin Can XML |
| `@lxpack/cmi5` | cmi5.xml generation |
| `@lxpack/components` | Built-in UI widgets and browser bundle for `type: component` lessons |

## Repository layout (current)

```text
packages/
  cli/
  runtime/
  validators/
  scorm/
  components/
examples/
  security-awareness/
  branching-demo/
test/fixtures/
docs/
```

## v0.2 highlights (for doc authors)

- **`course.yaml`:** optional `variables`, `flow`, lesson `type: component`
- **Assessments:** optional `maxAttempts`, `shuffleChoices`, `showFeedback`; `explanation` embedded at build for feedback modes
- **CLI:** `lxpack build --target scorm2004` produces multi-SCO ZIPs with `sco/<activityId>/index.html`
- **Preview:** serves `@lxpack/components` bundle at `/runtime/components.js` when available

When editing docs, keep phase numbers and version targets consistent with this table.
