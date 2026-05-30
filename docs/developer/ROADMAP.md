
# LXPack Full Product Roadmap

> **Doc sync:** Phase names and version targets match [PLAN.md](PLAN.md), [SPEC.md](SPEC.md), and the [repository README](https://github.com/eddiethedean/lxpack/blob/main/README.md). See [Developer docs](index.md) for the release-phase table.

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
- xAPI (Phase 3 — shipped v0.3.1)
- cmi5 (Phase 3 — shipped v0.3.1)
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
- LMS simulation (preview: `local` default; optional SCORM 1.2/2004 via `preview.scormMode`)

---

# Standards Support Roadmap

## SCORM 1.2 (shipped — v0.1.x)

- completion tracking
- bookmarking (`lesson_location`)
- compact `suspend_data` (4096-char limit)
- MCQ scoring / passed-failed
- sanitized assessment embedding (no answer YAML in ZIPs)

## SCORM 2004 (shipped — v0.2.0)

- multi-SCO packages with IMS Simple Sequencing subset in `imsmanifest`
- SCORM 2004 Run-Time API (`API_1484_11`) and preview simulator
- per-activity launch pages and shared runtime/components bundles

## xAPI (shipped — v0.3.1)

- learner events via `XapiReporter` and `@lxpack/xapi`
- Tin Can `tincan.xml` export (`lxpack build --target xapi`)
- optional `tracking.xapi` in `course.yaml`

## cmi5 (shipped — v0.3.1)

- `cmi5.xml` with per-activity blocks (`lxpack build --target cmi5`)
- cmi5 launch `fetch` param kept separate from LRS `endpoint`

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
  api/
  runtime/
  validators/
  scorm/
  components/
  tracking-schema/
  xapi/
  cmi5/
  spa-bridge/          # Phase 0.6 (shipped)
  conformance/         # Phase 0.6 (shipped)
  lessonkit/           # Phase 0.6 (shipped, meta-package)
examples/
  security-awareness/
  branching-demo/
  xapi-awareness/
  cmi5-demo/
test/fixtures/
docs/
```

---

# Course Structure

```text
course/
  course.yaml
  lxpack.config.json
  lessons/
  interactions/
  assets/
  assessments/     # authoring only; not shipped in export ZIPs
  components/      # optional widget overrides (v0.2.0)
  theme/           # reserved; not wired in v0.2.x
  .lxpack/         # build output
```

Manifest may include `variables` and `flow` for branching (v0.2.0).

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

## Phase 2 — Runtime expansion (shipped — v0.2.0)

**Latest release in phase:** v0.2.0

Features:
- **SCORM 2004** — multi-SCO export with sequencing/navigation in the manifest
- **Branching** — declarative flow in `course.yaml` (conditions on variables, assessment results, interaction events)
- **Variables** — manifest defaults + runtime `setVariable` / `getVariable` persisted in suspend data
- **Quiz engine** — retakes, choice shuffle, feedback modes (`immediate` | `end` | `never`)
- **Reusable components** — `@lxpack/components` with built-in widgets and per-course overrides
- Example: `examples/branching-demo`

Not in Phase 2: xAPI, cmi5 (now Phase 3), hot reload, themes, plugins.

## Phase 3 — Modern standards (shipped — v0.3.1)

**Latest release in phase:** v0.3.6

Features:
- **xAPI** — `lxpack build --target xapi`, `@lxpack/xapi` statement builders and Tin Can packaging
- **cmi5** — `lxpack build --target cmi5`, `@lxpack/cmi5` manifest generation
- **Analytics hooks** — `AnalyticsReporter` / `XapiReporter` in runtime (separate from SCORM LMS bridges)
- **Simulation tracking** — `window.lxpack.track({ type: "simulation", simulation: { ... } })` emits xAPI `interacted` with extensions
- Examples: `examples/xapi-awareness`, `examples/cmi5-demo`

Deferred to v0.3.1+: automated WCAG validation in preview/build.

## Phase 0.4 — LessonKit interoperability (shipped — v0.4.0)

This phase makes LXPack a first-class **packaging and LMS export layer** for
[LessonKit](https://github.com/eddiethedean/lessonkit): preserve React authoring, provide stable
library APIs for CI/tooling, and align tracking semantics across runtimes.

Shipped checklist: [LXPACK_UPGRADES_FOR_LESSONKIT.md](../LXPACK_UPGRADES_FOR_LESSONKIT.md). Next phase: [LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md](../LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md).

### Shipped in v0.4.0

- **SPA / React lesson type (`spa`)** — `type: spa`, `path: <dir-with-index.html>`; works across all export targets; `window.parent.lxpackBridge.v1` bridge API; example `examples/lessonkit-spa/`
- **Programmatic validate/build API** — `@lxpack/api` with typed results, injected assessments, explicit `courseDir`
- **Interchange schema** — optional `lessonkit.json` / `lxpack.import.json` merged at validate/build (CLI and API)
- **Shared tracking event catalog** — `@lxpack/tracking-schema`
- **Assessment build-time injection** — pass `assessments` to `buildCourse` without on-disk YAML
- **Docs and examples** — [LessonKit interoperability](../reference/lessonkit-interoperability.md)

### Remaining for v0.7+

- **Extensibility for custom lesson runtimes (plugin slot)** — runtime registration hooks (v0.7+ ecosystem)

## Phase 0.5 — LessonKit integration depth (shipped — v0.5.0)

**Latest release in phase:** v0.5.0

Thin packaging and interchange schema for LessonKit; see **Phase 0.6** for bridge SDK, conformance, and meta-package.

**Source of truth:** [LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md](../LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md).

### Shipped in v0.5.0

- **`packageLessonkit()`** in `@lxpack/api` — materialize `course.yaml`, copy SPA dirs with path containment, prefer in-memory assessments; no hand-built project tree required
- **Interchange schema owned by LXPack** — versioned Zod schema for `lessonkit.json` (`format: lessonkit`, `version: 1`); `validateCourse` accepts interchange-only projects
- **CLI** — `lxpack build --lessonkit` with `--spa-lesson` / `--spa-dist`
- **Docs** — [lessonkit interchange reference](../reference/lessonkit-interchange.md)

## Phase 0.6.2 — Node.js 18 support (shipped — v0.6.2)

**Latest release in phase:** v0.6.2

### Shipped in v0.6.2

- **Node.js 18 and 20** — all `@lxpack/*` packages and the CLI support Node.js 18 and 20 (`engines.node` is `>=18`)
- **CI matrix** — lint, build, typecheck, test, examples, conformance, and coverage run on Node 18 and 20
- **Runtime navigation** — clear stale lesson UI on fast navigation; delayed iframe `track()` resolves html/spa lessons by interaction id
- **LessonKit/API parity** — `packageLessonkit({ configDir })` loads `lxpack.config.json`; `init --force` clears interchange metadata
- **Validators** — interchange files no longer warn as export payloads; markdown warns on unsafe URI schemes blocked at runtime

## Phase 0.6.1 — Bugfix patch (shipped — v0.6.1)

**Latest release in phase:** v0.6.1

### Shipped in v0.6.1

- Omit `lessonkit.json` / `lxpack.import.json` from LMS export ZIPs
- LessonKit CLI loads `lxpack.config.json` beside the interchange file
- Assessment navigation race guard; shared export CSS with preview
- cmi5 POST fetch fix; xAPI Bearer auth and terminal flush retry
- SCORM bridge session guards; SCORM 2004 adapter post-terminate guards
- `lxpack init --force` clears stale root artifacts

## Phase 0.6 — LessonKit bridge and conformance (shipped — v0.6.0)

**Latest release in phase:** v0.6.0

### Shipped in v0.6.0

- **`@lxpack/spa-bridge`** — typed child SDK, score normalization, `createLxpackBridgeHost`, `completeCourse` on v1 bridge
- **Telemetry map** — `mapLessonkitTelemetryToLxpack` / `mapLessonkitTelemetryToBridgeAction` in `@lxpack/tracking-schema`
- **Theme interchange** — `runtime.themePreset` presets (`lessonkit:default`, `lessonkit:brand`)
- **`lxpack preview --lessonkit`** — preview from interchange + SPA dist
- **SCORM SPA recipes** — [scorm-spa-recipes](../guides/scorm-spa-recipes.md); `inferScormSpaLayout()`; interchange warnings for shared paths
- **`@lxpack/conformance`** — export-target matrix for shared CI
- **`@lxpack/lessonkit`** — meta-package; [LessonKit & React hub](../guides/lessonkit/index.md)
- **API stability** — [api-stability.md](api-stability.md) documents LessonKit **1.0.0** interoperability contracts

**LessonKit 1.0.0** is the stable public API ([github.com/eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit)). LXPack **0.6.2** is the supported packaging/runtime baseline (`@lxpack/api` 0.6.2+, Node 18+).

## v0.6+ — LessonKit integration and platform

### LessonKit integration (remaining)

- Deeper bridge **v2** / capability negotiation (future)
- `lxpack preview` hot-reload for Vite dev servers (future)

### Phase 5 — AI tooling (v0.6+)

Features:
- Claude integration
- AI repair and accessibility remediation
- AI-generated interactions

### Phase 6 — Ecosystem (v0.6+)

Features:
- plugin marketplace
- component marketplace
- hosted previews
- custom lesson runtime plugin slot (deferred from Phase 0.4)

### Phase 7 — Enterprise platform (v0.7+)

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
| `@lxpack/api` | 0.4 (shipped) |
| `@lxpack/tracking-schema` | 0.4 (shipped) |
| `@lxpack/spa-bridge` | 0.6 (shipped) |
| `@lxpack/conformance` | 0.6 (shipped) |
| `@lxpack/lessonkit` | 0.6 (shipped) |

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
