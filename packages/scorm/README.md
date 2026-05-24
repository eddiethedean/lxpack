# @lxpack/scorm

[![npm version](https://img.shields.io/npm/v/@lxpack/scorm)](https://www.npmjs.com/package/@lxpack/scorm)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

SCORM 1.2 and standalone HTML export for LXPack courses.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime.

## Install

```bash
npm install @lxpack/scorm
```

Requires Node.js 20+.

## Usage

```ts
import {
  packageCourse,
  packageStandaloneDir,
  generateImsManifest,
  buildIndexHtml,
  collectFiles,
  type ExportTarget,
  type PackageOptions,
} from "@lxpack/scorm";
```

### SCORM 1.2 ZIP

```ts
await packageCourse({
  courseDir: "/path/to/my-course",
  manifest,
  target: "scorm12",
  outputPath: "/path/to/output/course-scorm12.zip",
  runtimeBundle: "<embedded client.js>",
  styles: "<embedded styles.css>",
});
```

Produces a ZIP containing `imsmanifest.xml`, `index.html`, course assets, and the embedded runtime.

### Standalone HTML

```ts
await packageCourse({
  courseDir: "/path/to/my-course",
  manifest,
  target: "standalone",
  outputPath: "/path/to/output/course.zip",
  runtimeBundle,
  styles,
});

// Or write an unpacked directory:
await packageStandaloneDir({
  courseDir,
  manifest,
  outputDir: "/path/to/output/standalone",
  runtimeBundle,
  styles,
});
```

## Exports

| Export | Description |
|--------|-------------|
| `packageCourse(options)` | Build a SCORM 1.2 or standalone ZIP |
| `packageStandaloneDir(options)` | Write an unpacked standalone directory |
| `generateImsManifest(manifest, files)` | Generate SCORM 1.2 `imsmanifest.xml` |
| `buildIndexHtml(options)` | Build the course shell HTML page |
| `collectFiles(courseDir, manifest)` | Collect course assets for packaging |
| `buildManifestFileList(manifest, files)` | Build the manifest file reference list |
| `ExportTarget` | `"scorm12"` \| `"standalone"` |

## What gets packaged

- All assets referenced by the course manifest (lessons, interactions, assessments)
- Embedded `@lxpack/runtime` client bundle and styles
- SCORM API wrapper for LMS communication (SCORM 1.2 target only)

The CLI `lxpack build` command wraps this package — most users interact via `@lxpack/cli` rather than calling these APIs directly.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/scorm build
pnpm --filter @lxpack/scorm test
```

## License

Apache-2.0
