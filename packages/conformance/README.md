# @lxpack/conformance

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/conformance)](https://www.npmjs.com/package/@lxpack/conformance)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Shared **LessonKit/LXPack export conformance** fixtures and a matrix runner — packages a minimal SPA interchange through `@lxpack/api` and verifies each export target produces output.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [LessonKit interoperability](https://lxpack.readthedocs.io/en/latest/reference/lessonkit-interoperability/) · [API stability](https://lxpack.readthedocs.io/en/latest/developer/api-stability/).

| Related | Package |
|---------|---------|
| Packaging API | [`@lxpack/api`](https://github.com/eddiethedean/lxpack/blob/main/packages/api/README.md) |
| Export targets | [`@lxpack/scorm`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) |
| SPA bridge | [`@lxpack/spa-bridge`](https://github.com/eddiethedean/lxpack/blob/main/packages/spa-bridge/README.md) |

## Install

```bash
npm install @lxpack/conformance
```

Requires Node.js 18 or 20 (18+).

## Usage

```ts
import {
  runConformanceMatrix,
  DEFAULT_CONFORMANCE_TARGETS,
} from "@lxpack/conformance";

const result = await runConformanceMatrix();
// or: runConformanceMatrix({ targets: ["scorm12", "standalone"] })

if (!result.ok) {
  for (const row of result.results.filter((r) => !r.ok)) {
    console.error(row.target, row.message);
  }
}
```

Default targets: `standalone`, `scorm12`, `scorm2004`, `xapi`, `cmi5`.

## Exports

| Export | Description |
|--------|-------------|
| `runConformanceMatrix(options?)` | Run `packageLessonkit()` for each target; returns per-target pass/fail |
| `DEFAULT_CONFORMANCE_TARGETS` | Default export target list |
| `conformanceInterchange()` | Minimal v1 `lessonkit.json` payload for tests |
| `conformanceSpaDir()` | Path to bundled SPA fixture HTML |

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/conformance build
pnpm --filter @lxpack/conformance test
pnpm --filter @lxpack/conformance typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [LessonKit interoperability](https://lxpack.readthedocs.io/en/latest/reference/lessonkit-interoperability/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0
