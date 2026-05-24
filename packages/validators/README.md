# @lxpack/validators

[![npm version](https://img.shields.io/npm/v/@lxpack/validators)](https://www.npmjs.com/package/@lxpack/validators)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Zod schemas and filesystem validation for LXPack course manifests.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime.

## Install

```bash
npm install @lxpack/validators
```

Requires Node.js 20+.

## Usage

```ts
import {
  validateCourse,
  loadManifest,
  courseManifestSchema,
  type CourseManifest,
  type ValidationResult,
} from "@lxpack/validators";

const result: ValidationResult = await validateCourse("/path/to/my-course");

if (!result.valid) {
  for (const issue of result.issues) {
    console.error(`${issue.path}: ${issue.message}`);
  }
}
```

### Load and parse only

```ts
const loaded = await loadManifest("/path/to/my-course");
if (Array.isArray(loaded)) {
  // validation issues
} else {
  const { manifest } = loaded;
}
```

### Schema-only validation

```ts
const parsed = courseManifestSchema.safeParse(manifestObject);
```

## Exports

| Export | Description |
|--------|-------------|
| `validateCourse(dir)` | Parse `course.yaml`, validate schema, and check referenced files exist |
| `loadManifest(courseDir)` | Load and parse `course.yaml` in a course directory |
| `resolveCoursePath(dir, relativePath)` | Resolve a path safely within the course directory |
| `courseManifestSchema` | Zod schema for the full course manifest |
| `lessonSchema`, `assessmentSchema`, … | Sub-schemas for manifest sections |
| `CourseManifest`, `Lesson`, `Assessment` | Inferred TypeScript types |

## What gets validated

- Manifest shape (lessons, assessments, tracking rules)
- Lesson types: `markdown` (`file`) and `html` (`path`)
- Assessment YAML structure (MCQ questions, scoring)
- Path containment — referenced files must stay inside the course directory
- On-disk assets referenced by the manifest

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/validators build
pnpm --filter @lxpack/validators test
```

## License

Apache-2.0
