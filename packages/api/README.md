# @lxpack/api

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/api)](https://www.npmjs.com/package/@lxpack/api)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Programmatic **validate** and **build** API for LXPack courses — the same logic the CLI uses, with structured results for Node integrations (LessonKit, CI, custom exporters).

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [LessonKit & React hub](https://lxpack.readthedocs.io/en/latest/guides/lessonkit/) · [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/).

| Related | Package |
|---------|---------|
| CLI (wraps this package) | [`@lxpack/cli`](https://github.com/eddiethedean/lxpack/blob/main/packages/cli/README.md) |
| Schemas & filesystem checks | [`@lxpack/validators`](https://github.com/eddiethedean/lxpack/blob/main/packages/validators/README.md) |
| ZIP / directory export | [`@lxpack/scorm`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) |

## Install

```bash
npm install @lxpack/api
```

Requires Node.js 18 or 20 (18+).

## Usage

### Validate

```ts
import { validateCourse } from "@lxpack/api";

const result = await validateCourse({
  courseDir: "/path/to/my-course",
  target: "scorm2004", // optional export-specific checks
});

if (!result.ok) {
  for (const issue of result.issues) {
    console.error(`${issue.severity} ${issue.path}: ${issue.message}`);
  }
} else {
  console.log(result.manifest.title);
}
```

### Build

```ts
import { buildCourse } from "@lxpack/api";

// ZIP (default)
const zip = await buildCourse({
  courseDir: "/path/to/my-course",
  target: "scorm12",
  output: ".lxpack/course-scorm12.zip", // optional
  outputBaseDir: ".lxpack",
});

if (!zip.ok) throw new Error("build failed");
console.log(zip.outputPath, zip.fileCount);

// Unpacked directory
const dir = await buildCourse({
  courseDir: "/path/to/my-course",
  target: "standalone",
  dir: true,
  output: ".lxpack/standalone",
});
```

Targets: `scorm12`, `scorm2004`, `standalone`, `xapi`, `cmi5`.

### Injected assessments

Pass assessment objects instead of reading `assessments/*.yaml` from disk:

```ts
await buildCourse({
  courseDir: "/path/to/my-course",
  target: "scorm12",
  assessments: [
    {
      id: "quiz",
      passingScore: 0.7,
      questions: [
        {
          id: "q1",
          prompt: "Ready?",
          choices: [
            { id: "yes", text: "Yes", correct: true },
            { id: "no", text: "No" },
          ],
        },
      ],
    },
  ],
});
```

The course manifest must still declare `assessments: [{ id: quiz, file: ... }]`; the API uses injected data at validate/build time.

## LessonKit interchange (`lessonkit.json`)

v1 interchange requires `format: "lessonkit"` and `version: "1"`. See [lessonkit interchange reference](https://lxpack.readthedocs.io/en/latest/reference/lessonkit-interchange/).

## `packageLessonkit()` (v0.5.0)

Package without hand-written `course.yaml`:

```ts
import { packageLessonkit } from "@lxpack/api";

const result = await packageLessonkit({
  interchange: {
    format: "lessonkit",
    version: "1",
    course: { title: "My SPA Course" },
    lessons: [{ id: "main", type: "spa", path: "dist/main" }],
  },
  spaDirs: { main: "/abs/path/to/vite-dist" },
  configDir: "/path/to/project", // optional — loads lxpack.config.json for defaultTarget / output.dir
  target: "scorm12", // optional when configDir (or outputAnchorDir) has lxpack.config.json
  assessments: [/* optional MCQ payloads */],
});
```

## Exports

| Export | Description |
|--------|-------------|
| `validateCourse(options)` | Validate course directory; returns `{ ok, manifest?, issues }` |
| `buildCourse(options)` | Validate and package; returns paths and file counts |
| `packageLessonkit(options)` | Materialize interchange + SPA dirs, then build |
| `ExportTarget` | Re-exported from `@lxpack/scorm` |
| `CourseManifest`, `ValidationIssue` | Re-exported from `@lxpack/validators` |

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/api build
pnpm --filter @lxpack/api test
pnpm --filter @lxpack/api typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0
