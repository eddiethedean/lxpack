# Developer documentation

Technical references for **v0.5.0** contributors and integrators.

<div class="grid cards" markdown>

-   :octicons-file-code-24: **[SPEC](SPEC.md)**

    ---

    Functional requirements, manifest, runtime, security.

-   :octicons-map-24: **[ROADMAP](ROADMAP.md)**

    ---

    Phases, standards, long-term vision.

-   :octicons-package-24: **[PLAN](PLAN.md)**

    ---

    Product goals and architecture narrative.

-   :octicons-repo-24: **[ARCHITECTURE](ARCHITECTURE.md)**

    ---

    Package boundaries (v0.5.0).

-   :octicons-wrench-24: **[REFACTORING](REFACTORING.md)**

    ---

    Invariants and CI commands.

</div>

## Release phases

| Phase | Target version | Status | Summary |
|-------|----------------|--------|---------|
| **1 — MVP** | **v0.1.x** | Shipped | CLI, validation, preview, SCORM 1.2, standalone HTML, MCQ assessments |
| **2 — Runtime expansion** | **v0.2.x** | Shipped | SCORM 2004 multi-SCO, branching, variables, quiz engine, `@lxpack/components` |
| **3 — Modern standards** | **v0.3.x** | Shipped | xAPI, cmi5, analytics / simulation tracking |
| **0.4 — LessonKit interoperability** | **v0.4.0** | Shipped | SPA lessons, `@lxpack/api`, `lessonkit.json`, `@lxpack/tracking-schema` |
| **0.5 — LessonKit integration depth** | **v0.5.0** | Shipped | `packageLessonkit()`, interchange schema v1, `lxpack build --lessonkit` |
| **0.6 — LessonKit bridge & conformance** | **v0.6.0** | Shipped | `@lxpack/spa-bridge`, telemetry map, `preview --lessonkit`, `@lxpack/conformance`, `@lxpack/lessonkit` |
| **5 — AI tooling** | **v0.6+** | Planned | Claude integration, AI repair, AI-generated interactions |
| **6 — Ecosystem** | **v0.6+** | Planned | Plugin marketplace, component marketplace, hosted previews |
| **7 — Enterprise platform** | **v0.7+** | Planned | Cloud deployment, compliance tooling, hosted runtime |

## Published npm packages (v0.6.0)

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
| `@lxpack/lessonkit` | LessonKit integration facade |

Package READMEs live under `packages/*/README.md` in the repository.

## Publishing v0.6.0

Prerequisites: green [CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml) on `main`, `NPM_TOKEN` configured for the Release workflow, and [CHANGELOG](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md) accurate for `[0.6.0]`.

```bash
# From a clean main at 0.6.0 in all packages/*/package.json
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage
pnpm examples:validate && pnpm examples:test
pnpm --filter @lxpack/conformance test
bash scripts/build-docs.sh

git tag v0.6.0
git push origin v0.6.0
```

Pushing tag `v0.6.0` runs [.github/workflows/release.yml](https://github.com/eddiethedean/lxpack/blob/main/.github/workflows/release.yml): full checks, then publishes all `packages/*` to npm at the tag version. Read the Docs can track the same tag as **stable** (see [readthedocs-setup.md](../readthedocs-setup.md)).

## User-facing docs

Authors and LXDs should use the [documentation home](../index.md), not this section.
