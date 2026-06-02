# Developer documentation

Technical references for **v0.6.4** contributors and integrators.

<div class="grid cards" markdown>

-   :octicons-file-code-24: **[SPEC](SPEC.md)**

    ---

    Functional requirements, manifest, runtime, security.

-   :octicons-project-roadmap-24: **[ROADMAP](ROADMAP.md)**

    ---

    Phases, standards, long-term vision.

-   :octicons-package-24: **[PLAN](PLAN.md)**

    ---

    Product goals and architecture narrative.

-   :octicons-repo-24: **[ARCHITECTURE](ARCHITECTURE.md)**

    ---

    Package boundaries (v0.6.4).

-   :octicons-tools-24: **[REFACTORING](REFACTORING.md)**

    ---

    Invariants and CI commands.

-   :octicons-shield-check-24: **[API stability](api-stability.md)**

    ---

    LessonKit 1.0 bridge and interchange contracts.

</div>

## Deep specification

Full technical docs (linked from nav cards above):

| Document | Purpose |
|----------|---------|
| [SPEC](SPEC.md) | Functional requirements, manifest, runtime |
| [PLAN](PLAN.md) | Product goals and architecture narrative |
| [ARCHITECTURE](ARCHITECTURE.md) | Package boundaries |
| [REFACTORING](REFACTORING.md) | Internal refactor invariants |
| [API stability](api-stability.md) | LessonKit interoperability contracts |
| [Documentation README](https://github.com/eddiethedean/lxpack/blob/main/docs/README.md) | Docs contributor guide |

## Release phases

| Phase | Target version | Status | Summary |
|-------|----------------|--------|---------|
| **1 — MVP** | **v0.1.x** | Shipped | CLI, validation, preview, SCORM 1.2, standalone HTML, MCQ assessments |
| **2 — Runtime expansion** | **v0.2.x** | Shipped | SCORM 2004 multi-SCO, branching, variables, quiz engine, `@lxpack/components` |
| **3 — Modern standards** | **v0.3.x** | Shipped | xAPI, cmi5, analytics / simulation tracking |
| **0.4 — LessonKit interoperability** | **v0.4.0** | Shipped | SPA lessons, `@lxpack/api`, `lessonkit.json`, `@lxpack/tracking-schema` |
| **0.5 — LessonKit integration depth** | **v0.5.0** | Shipped | `packageLessonkit()`, interchange schema v1, `lxpack build --lessonkit` |
| **0.6 — LessonKit bridge & conformance** | **v0.6.0** | Shipped | `@lxpack/spa-bridge`, telemetry map, `preview --lessonkit`, `@lxpack/conformance`, `@lxpack/lessonkit` |
| **0.6.1 — Patch** | **v0.6.1** | Shipped | Packaging/metadata fixes, LessonKit config path, SCORM session guards, export CSS parity, xAPI auth/flush |
| **0.6.2 — Patch** | **v0.6.2** | Shipped | Node.js 18 and 20; runtime navigation fixes; LessonKit **1.0** packaging parity |
| **0.6.3 — Patch** | **v0.6.3** | Shipped | Position-aware flow (`from`); runtime nav UX; CLI config/parse error parity |
| **0.6.4 — Patch** | **v0.6.4** | Shipped | Flow multi-branch inference; nav end-of-path UX; preview/lessonkit validation parity |
| **5 — AI tooling** | **v0.6+** | Planned | Claude integration, AI repair, AI-generated interactions |
| **6 — Ecosystem** | **v0.6+** | Planned | Plugin marketplace, component marketplace, hosted previews |
| **7 — Enterprise platform** | **v0.7+** | Planned | Cloud deployment, compliance tooling, hosted runtime |

## Published npm packages (v0.6.4)

| Package | Role |
|---------|------|
| `@lxpack/cli` | `init`, `preview`, `validate`, `build` |
| `@lxpack/validators` | Zod schemas, `validateCourse`, assessment bundles |
| `@lxpack/runtime` | Browser client, flow, SCORM APIs, xAPI analytics |
| `@lxpack/scorm` | SCORM / standalone / xAPI / cmi5 packaging |
| `@lxpack/xapi` | Statements, transport, Tin Can XML |
| `@lxpack/cmi5` | cmi5.xml generation |
| `@lxpack/components` | Built-in UI widgets |
| `@lxpack/api` | Programmatic `validateCourse` / `buildCourse` |
| `@lxpack/tracking-schema` | Shared tracking event types |
| `@lxpack/spa-bridge` | SPA iframe bridge SDK |
| `@lxpack/conformance` | Shared export conformance matrix |
| `@lxpack/lessonkit` | Optional re-exports for LXPack-centric integrators (LessonKit apps use `@lessonkit/lxpack`) |

**Related project:** [LessonKit 1.0](https://github.com/eddiethedean/lessonkit) — React authoring, `@lessonkit/lxpack`, `lessonkit package`. Docs: [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/).

## Publishing

Prerequisites: green [CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml) on `main`, `NPM_TOKEN` configured for the Release workflow, and [Changelog](../project/changelog.md) accurate for the release version.

```bash
# From a clean main with matching versions in all packages/*/package.json
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage
pnpm examples:validate && pnpm examples:test
pnpm --filter @lxpack/conformance test
bash scripts/build-docs.sh

git tag vX.Y.Z
git push origin vX.Y.Z
```

Pushing a `v*.*.*` tag runs [.github/workflows/release.yml](https://github.com/eddiethedean/lxpack/blob/main/.github/workflows/release.yml): full checks, then publishes all `packages/*` to npm. Read the Docs can track the same tag as **stable** (see [readthedocs-setup.md](../readthedocs-setup.md)).

## User-facing docs

Authors and LXDs should use the [documentation home](../index.md), not this section.
