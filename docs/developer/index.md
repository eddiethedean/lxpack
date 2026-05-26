# Developer documentation

Technical references for **v0.3.6** contributors and integrators.

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

    Package boundaries (v0.3.6).

-   :octicons-wrench-24: **[REFACTORING](REFACTORING.md)**

    ---

    Invariants and CI commands.

</div>

## Release phases

| Phase | Target version | Status | Summary |
|-------|----------------|--------|---------|
| **1 — MVP** | **v0.1.x** | Shipped | CLI, validation, preview, SCORM 1.2, standalone HTML, MCQ assessments |
| **2 — Runtime expansion** | **v0.2.x** | Shipped | SCORM 2004 multi-SCO, branching, variables, quiz engine, `@lxpack/components` |
| **3 — Modern standards** | **v0.3.6** | Shipped | xAPI, cmi5, analytics / simulation tracking |
| **4 — AI tooling** | TBD | Planned | Claude integration, AI repair, AI-generated interactions |
| **5 — Ecosystem** | TBD | Planned | Plugin marketplace, component marketplace, hosted previews |
| **6 — Enterprise platform** | TBD | Planned | Cloud deployment, compliance tooling, hosted runtime |

## Published npm packages (v0.3.6)

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

## Publishing v0.3.6

Prerequisites: green [CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml) on `main`, `NPM_TOKEN` configured for the Release workflow, and [CHANGELOG](../../CHANGELOG.md) accurate for `[0.3.6]`.

```bash
# From a clean main at 0.3.6 in all packages/*/package.json
pnpm install --frozen-lockfile
pnpm build && pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage
pnpm examples:validate
bash scripts/build-docs.sh

git tag v0.3.6
git push origin v0.3.6
```

Pushing tag `v0.3.6` runs [.github/workflows/release.yml](../../.github/workflows/release.yml): full checks, then publishes all `packages/*` to npm at the tag version. Read the Docs can track the same tag as **stable** (see [readthedocs-setup.md](../readthedocs-setup.md)).

## User-facing docs

Authors and LXDs should use the [documentation home](../index.md), not this section.
