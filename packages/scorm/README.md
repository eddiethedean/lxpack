# @lxpack/scorm

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/scorm)](https://www.npmjs.com/package/@lxpack/scorm)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

SCORM 1.2, SCORM 2004 (multi-SCO), and standalone HTML export for LXPack courses.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/) · [Tracking and completion](https://lxpack.readthedocs.io/en/latest/reference/tracking-and-completion/).

| Related | Package |
|---------|---------|
| CLI | [`@lxpack/cli`](../cli/README.md) |
| Manifest validation | [`@lxpack/validators`](../validators/README.md) |
| Embedded client | [`@lxpack/runtime`](../runtime/README.md) |
| Components bundle | [`@lxpack/components`](../components/README.md) |

## Install

```bash
npm install @lxpack/scorm
```

Requires Node.js 18 or 20 (18+).

## Usage

### SCORM 1.2 or standalone ZIP

```ts
import { readFile } from "node:fs/promises";
import type { CourseManifest } from "@lxpack/validators";
import { buildRuntimeAssessmentBundle } from "@lxpack/validators";
import {
  packageCourse,
  packageStandaloneDir,
  buildIndexHtml,
  collectFiles,
  safeJsonForHtml,
  courseSlug,
} from "@lxpack/scorm";

const courseDir = "/path/to/my-course";
const manifest: CourseManifest = /* from validateCourse */;
const assessmentBundle = await buildRuntimeAssessmentBundle(courseDir, manifest);

const runtimeClientJs = await readFile("path/to/client.js", "utf8");
const runtimeCss = await readFile("path/to/styles.css", "utf8");
const componentsJs = await readFile("path/to/bundle.js", "utf8"); // optional

await packageCourse({
  courseDir,
  manifest,
  target: "scorm12",
  outputPath: "/path/to/output/course-scorm12.zip",
  runtimeClientJs,
  runtimeCss,
  componentsJs,
  assessmentBundle,
});
```

### SCORM 2004 multi-SCO

```ts
import { packageScorm2004, buildScoIndexHtml, listCourseActivities } from "@lxpack/scorm";

const activities = listCourseActivities(manifest);

await packageScorm2004({
  courseDir,
  manifest,
  outputPath: "/path/to/output/course-scorm2004.zip",
  runtimeClientJs,
  runtimeCss,
  componentsJs,
  assessmentBundle,
});
```

Each activity gets `sco/<activityId>/index.html` (via `buildScoIndexHtml`). Shared assets include `lxpack-runtime.js` and `lxpack-components.js`. `generateScorm2004Manifest` emits `imsmanifest.xml` with IMS Simple Sequencing metadata.

### Standalone directory

```ts
await packageStandaloneDir({
  courseDir,
  manifest,
  target: "standalone",
  outputDir: "/path/to/output/standalone",
  runtimeClientJs,
  runtimeCss,
  componentsJs,
  assessmentBundle,
});
```

Most users should use `lxpack build` from [`@lxpack/cli`](../cli/README.md) instead of calling these APIs directly. See [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/) for `--target` options.

## Exports

| Export | Description |
|--------|-------------|
| `packageCourse(options)` | Build a SCORM 1.2 or standalone ZIP |
| `packageScorm2004(options)` | Build a SCORM 2004 multi-SCO ZIP |
| `packageStandaloneDir(options)` | Write an unpacked directory |
| `listCourseActivities(manifest)` | Ordered activities for multi-SCO layout |
| `generateImsManifest(manifest, files)` | SCORM 1.2 `imsmanifest.xml` |
| `generateScorm2004Manifest(...)` | SCORM 2004 manifest with sequencing |
| `buildIndexHtml(options)` | Single-SCO course shell HTML |
| `buildScoIndexHtml(options)` | Per-activity launch HTML for SCORM 2004 |
| `scoLaunchPath(activityId)` | Relative launch path (`sco/<id>/index.html`) |
| `buildRuntimeConfig(options)` | Config object passed to `safeJsonForHtml` |
| `collectFiles(courseDir, baseDir)` | Course assets for packaging (respects skip rules) |
| `shouldSkipCourseFile(rel)` | Whether a relative path is omitted from exports |
| `buildManifestFileList(courseFiles)` | File list for `imsmanifest.xml` |
| `safeJsonForHtml(value)` | JSON safe for `<script type="application/json">` blocks |
| `courseSlug(manifest)` | Stable slug for ZIP names and manifest identifiers |
| `ExportTarget` | `"scorm12"` \| `"scorm2004"` \| `"standalone"` |

### `PackageOptions`

| Field | Description |
|-------|-------------|
| `courseDir` | Course root directory |
| `manifest` | Parsed `course.yaml` |
| `outputPath` | Destination ZIP path |
| `target` | `scorm12`, `scorm2004`, or `standalone` |
| `runtimeClientJs` | Contents of `@lxpack/runtime/client` bundle |
| `runtimeCss` | Runtime stylesheet |
| `componentsJs` | Optional `@lxpack/components/bundle` for component lessons |
| `assessmentBundle` | From `buildRuntimeAssessmentBundle()` (assessments, keys, configs, feedback) |

## What gets packaged

**Included**

- Lessons, interactions, assets, and component overrides referenced by the manifest
- `lxpack-runtime.js` — browser client bundle
- `lxpack-components.js` — when component lessons are used
- **SCORM 1.2 / standalone:** root `index.html` with embedded config
- **SCORM 2004:** `sco/<activityId>/index.html` per activity + `imsmanifest.xml`

**Excluded** (`shouldSkipCourseFile`)

- `course.yaml`, `lxpack.config.json`, `.lxpack/`
- `assessments/**` — author YAML; assessments are embedded in config instead
- Root `index.html` if present (packager generates entry pages)

Answer keys and feedback text are only present inside the JSON config block (with `<` escaped via `safeJsonForHtml`), not as downloadable files.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/scorm build
pnpm --filter @lxpack/scorm test
pnpm --filter @lxpack/scorm typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation home](https://lxpack.readthedocs.io/en/latest/)
- [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/)
- [course.yaml — tracking.xapi](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/)
- [Architecture](https://lxpack.readthedocs.io/en/latest/developer/ARCHITECTURE/)
- [Roadmap & phases](https://lxpack.readthedocs.io/en/latest/developer/ROADMAP/)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
