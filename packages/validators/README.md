# @lxpack/validators

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/validators)](https://www.npmjs.com/package/@lxpack/validators)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Zod schemas and filesystem validation for LXPack course manifests — flow, variables, component lessons, and xAPI tracking.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime. **Docs:** [course.yaml](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/) · [Troubleshooting](https://lxpack.readthedocs.io/en/latest/reference/troubleshooting/).

| Related | Package |
|---------|---------|
| CLI | [`@lxpack/cli`](../cli/README.md) |
| Programmatic API | [`@lxpack/api`](../api/README.md) |
| Packaging | [`@lxpack/scorm`](../scorm/README.md) |
| Runtime | [`@lxpack/runtime`](../runtime/README.md) |
| Components | [`@lxpack/components`](../components/README.md) |

## Install

```bash
npm install @lxpack/validators
```

Requires Node.js 18 or 20 (18+).

## Usage

```ts
import {
  validateCourse,
  validateCourseManifest,
  loadManifest,
  buildRuntimeAssessmentBundle,
  buildRuntimeAssessmentBundleFromData,
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
  // bundle.answerKeys — scoring keys for the runtime
  // bundle.configs — maxAttempts, shuffleChoices, showFeedback per assessment
  // bundle.feedback — questionId → explanation text for feedback modes
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

### Flow validation

```ts
import { validateFlow, detectFlowCycles, collectActivityIds } from "@lxpack/validators";
```

`validateCourse` runs flow checks when `manifest.flow` is present: valid `goto` targets, known condition shapes, and cycle detection.

### Safe path resolution

```ts
import { resolveCoursePath, isPathContained } from "@lxpack/validators";

const abs = resolveCoursePath(courseDir, "lessons/intro.md");
isPathContained(courseDir, abs); // true if inside course root
```

## Exports

| Export | Description |
|--------|-------------|
| `validateCourse(dir)` | Parse `course.yaml`, validate schema, flow, files, symlink containment |
| `validateCourseManifest(dir, manifest, options?)` | Validate an in-memory manifest (optional `assessmentData` instead of on-disk YAML) |
| `validateXapiTracking(manifest)` | Require HTTPS `tracking.xapi.activityIri` for xapi/cmi5 exports |
| `getCourseActivityIri(manifest)` | Read course activity IRI from manifest |
| `loadManifest(courseDir)` | Load and parse `course.yaml` |
| `buildRuntimeAssessmentBundle(dir, manifest)` | Load assessments; split learner view, keys, configs, feedback |
| `buildRuntimeAssessmentBundleFromData(manifest, data)` | Same bundle shape from in-memory assessment objects |
| `loadParsedAssessmentsFromData(manifest, data)` | Parse injected assessment payloads with manifest cross-checks |
| `toLearnerAssessment(assessment)` | Strip `correct` from choices; extract config and feedback maps |
| `validateFlow(manifest)` | Flow rule and target validation |
| `detectFlowCycles(manifest)` | Flow-jump cycle detection for branching graphs |
| `collectActivityIds(manifest)` | Lesson and assessment IDs for flow targets |
| `conditionSchema`, `flowRuleSchema` | Zod schemas for flow conditions and rules |
| `BUILTIN_COMPONENT_IDS`, `isBuiltinComponentId` | Allowed built-in component lesson IDs |
| `resolveCoursePath(dir, relativePath)` | Resolve a path safely inside the course directory |
| `isPathContained(root, target)` | Whether `target` stays under `root` |
| `courseManifestSchema` | Zod schema for the full course manifest |
| `lessonSchema`, `assessmentSchema`, `variableDefSchema`, … | Strict sub-schemas |
| `CourseManifest`, `Lesson`, `Assessment`, `FlowRule`, `VariableDef`, `RuntimeAssessmentBundle` | TypeScript types |

## What gets validated

Author-facing rules: [Course structure](https://lxpack.readthedocs.io/en/latest/guides/course-structure/) · [Quizzes and assessments](https://lxpack.readthedocs.io/en/latest/guides/quizzes-and-assessments/) · [Branching and paths](https://lxpack.readthedocs.io/en/latest/guides/branching-and-paths/).

- Manifest shape: lessons, assessments, optional `variables` and `flow`, tracking rules
- Lesson types: `markdown` (`file`), `html` (`path`), `spa` (`path` with `index.html`), `component` (`component` + optional `props`)
- SPA lessons: path containment, required `index.html`; warns when SPA HTML calls `window.lxpack` instead of `window.parent.lxpackBridge.v1`
- `runtime.cssVariables` — optional map of CSS custom properties for the learner shell
- Component IDs: built-in IDs or course overrides under `components/<id>/`
- Flow rules: condition grammar, `goto` targets that reference known activity IDs, acyclic flow (errors for cycles)
- Assessment YAML: strict MCQ schemas; optional `maxAttempts`, `shuffleChoices`, `showFeedback`; `explanation` per question
- Duplicate lesson IDs
- Path containment — referenced files must stay inside the course directory (including via symlinks)
- On-disk assets: files exist and assessment paths are regular files

## Assessment packaging

Author assessments live as YAML under `assessments/` in the course repo. At build/preview time:

1. `buildRuntimeAssessmentBundle()` reads each assessment file.
2. **Learner payload** — questions and choices without `correct` flags.
3. **Answer keys** — `questionId → choiceId` map for scoring.
4. **Configs** — per-assessment quiz behavior (`maxAttempts`, `shuffleChoices`, `showFeedback`).
5. **Feedback** — `questionId → explanation` for immediate/end feedback (not shipped as separate files).

The CLI and [`@lxpack/scorm`](../scorm/README.md) embed all of this in the HTML config JSON. Exported ZIPs **do not** include `assessments/` files, so answer keys are not fetchable as static assets.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/validators build
pnpm --filter @lxpack/validators test
pnpm --filter @lxpack/validators typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation home](https://lxpack.readthedocs.io/en/latest/)
- [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/)
- [Technical specification](https://lxpack.readthedocs.io/en/latest/developer/SPEC/)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
