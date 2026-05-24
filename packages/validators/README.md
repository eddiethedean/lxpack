# @lxpack/validators

[![npm version](https://img.shields.io/npm/v/@lxpack/validators)](https://www.npmjs.com/package/@lxpack/validators)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Zod schemas and filesystem validation for LXPack course manifests.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime.

| Related | Package |
|---------|---------|
| CLI | [`@lxpack/cli`](../cli/README.md) |
| Packaging | [`@lxpack/scorm`](../scorm/README.md) |
| Runtime | [`@lxpack/runtime`](../runtime/README.md) |

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
  buildRuntimeAssessmentBundle,
  courseManifestSchema,
  type ValidationResult,
} from "@lxpack/validators";

const result: ValidationResult = await validateCourse("/path/to/my-course");

if (!result.valid) {
  for (const issue of result.issues) {
    console.error(`${issue.path}: ${issue.message}`);
  }
} else {
  const { manifest } = result;
  const bundle = await buildRuntimeAssessmentBundle("/path/to/my-course", manifest);
  // bundle.assessments — learner-facing questions (no correct flags)
  // bundle.answerKeys — scoring keys for the runtime (embedded at build time)
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

### Safe path resolution

```ts
import { resolveCoursePath, isPathContained } from "@lxpack/validators";

const abs = resolveCoursePath(courseDir, "lessons/intro.md");
isPathContained(courseDir, abs); // true if inside course root
```

## Exports

| Export | Description |
|--------|-------------|
| `validateCourse(dir)` | Parse `course.yaml`, validate schema, check files, symlink containment |
| `loadManifest(courseDir)` | Load and parse `course.yaml` |
| `buildRuntimeAssessmentBundle(dir, manifest)` | Load assessments; split learner view vs answer keys |
| `toLearnerAssessment(assessment)` | Strip `correct` / `explanation` from one assessment |
| `resolveCoursePath(dir, relativePath)` | Resolve a path safely inside the course directory |
| `isPathContained(root, target)` | Whether `target` stays under `root` |
| `courseManifestSchema` | Zod schema for the full course manifest |
| `lessonSchema`, `assessmentSchema`, … | Strict sub-schemas for manifest sections |
| `CourseManifest`, `Lesson`, `Assessment`, `LearnerAssessment`, `RuntimeAssessmentBundle` | TypeScript types |

## What gets validated

- Manifest shape (lessons, assessments, tracking rules)
- Lesson types: `markdown` (`file`) and `html` (`path`)
- Assessment YAML: strict MCQ schemas (`correct` on exactly one choice per question)
- Duplicate lesson IDs
- Path containment — referenced files must stay inside the course directory (including via symlinks)
- On-disk assets: files exist and assessments paths are regular files

## Assessment packaging

Author assessments live as YAML under `assessments/` in the course repo. At build/preview time:

1. `buildRuntimeAssessmentBundle()` reads each assessment file.
2. **Learner payload** — questions and choices without `correct` or `explanation`.
3. **Answer keys** — `questionId → choiceId` map for scoring.

The CLI and [`@lxpack/scorm`](../scorm/README.md) embed both in the HTML config JSON. Exported ZIPs **do not** include `assessments/` files, so answer keys are not fetchable as static assets.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/validators build
pnpm --filter @lxpack/validators test
pnpm --filter @lxpack/validators typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation index](https://github.com/eddiethedean/lxpack/blob/main/docs/README.md)
- [Technical specification](https://github.com/eddiethedean/lxpack/blob/main/docs/SPEC.md)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
