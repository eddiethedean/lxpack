# LessonKit and LXPack packages (1.0+)

[LessonKit 1.0](https://github.com/eddiethedean/lessonkit) and [LXPack 0.6.3](https://github.com/eddiethedean/lxpack) are complementary: **LessonKit owns React authoring and the author CLI**; **LXPack owns validation, learner runtime, and LMS export**.

**`@lessonkit/lxpack` is not legacy** — it is the primary adapter LessonKit uses to call LXPack.

## LessonKit packages (`@lessonkit/*`)

Published from [github.com/eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit). **Current release: 1.0.0.**

| Package | Description |
|---------|-------------|
| [`@lessonkit/react`](https://www.npmjs.com/package/@lessonkit/react) | Components (`Course`, `Lesson`, `Quiz`, …), hooks, `ThemeProvider` |
| [`@lessonkit/core`](https://www.npmjs.com/package/@lessonkit/core) | Types, identity helpers, telemetry catalog |
| [`@lessonkit/xapi`](https://www.npmjs.com/package/@lessonkit/xapi) | xAPI statements and telemetry mapping |
| [`@lessonkit/lxpack`](https://www.npmjs.com/package/@lessonkit/lxpack) | **LMS packaging** — descriptor → `course.yaml` + SPA copy → `@lxpack/api` |
| [`@lessonkit/cli`](https://www.npmjs.com/package/@lessonkit/cli) | `lessonkit init`, `dev`, `build`, `package` |
| [`@lessonkit/accessibility`](https://www.npmjs.com/package/@lessonkit/accessibility) | Focus trap, roving tabindex, reduced motion |
| [`@lessonkit/themes`](https://www.npmjs.com/package/@lessonkit/themes) | Theme presets and `--lk-*` design tokens |

**Typical install for React + LMS export:**

```bash
npm install @lessonkit/react @lessonkit/core @lessonkit/lxpack @lxpack/api
npm install -D @lessonkit/cli
```

Docs: [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)

## LXPack packages (`@lxpack/*`)

Published from this repository. **Current release: 0.6.3.** Requires Node.js **18+**.

| Package | When to use |
|---------|-------------|
| [`@lxpack/cli`](https://www.npmjs.com/package/@lxpack/cli) | YAML/markdown courses; `lxpack init`, `preview`, `validate`, `build` |
| [`@lxpack/api`](https://www.npmjs.com/package/@lxpack/api) | Programmatic `validateCourse`, `buildCourse`, `packageLessonkit` (used by `@lessonkit/lxpack`) |
| [`@lxpack/lessonkit`](https://www.npmjs.com/package/@lxpack/lessonkit) | **Optional** — re-exports for LXPack-centric integrators |
| [`@lxpack/spa-bridge`](https://www.npmjs.com/package/@lxpack/spa-bridge) | `getLxpackBridge()` in SPA bundles |
| [`@lxpack/runtime`](https://www.npmjs.com/package/@lxpack/runtime) | Learner shell embedded in exported packages |
| [`@lxpack/conformance`](https://www.npmjs.com/package/@lxpack/conformance) | Export-target matrix for shared CI |

## Which packaging API?

| API | Package | Best for |
|-----|---------|----------|
| `packageLessonkitCourse({ descriptor, … })` | `@lessonkit/lxpack` | **LessonKit React projects** — descriptor, theme mapping, staged output |
| `packageLessonkit({ interchange, spaDirs, … })` | `@lxpack/api` | Interchange JSON + SPA dirs without a LessonKit descriptor |
| `buildCourse({ courseDir, target, … })` | `@lxpack/api` | Existing `course.yaml` tree |
| `lxpack build --lessonkit …` | `@lxpack/cli` | Shell/CI when you have interchange + dist paths |

All LMS export paths ultimately call LXPack validators and `@lxpack/scorm` (or xAPI/cmi5 adapters).

## `@lxpack/lessonkit` vs `@lessonkit/lxpack`

These names are easy to confuse:

- **`@lessonkit/lxpack`** (LessonKit repo) — **use this** in LessonKit apps. Wraps descriptors, writes project files, calls `@lxpack/api`.
- **`@lxpack/lessonkit`** (LXPack repo) — thin **re-export facade** for integrators who want LXPack npm scope only:

```ts
import {
  packageLessonkit,
  parseLessonkitInterchange,
  getLxpackBridge,
  mapLessonkitTelemetryToLxpack,
} from "@lxpack/lessonkit";
```

You do **not** need to replace `@lessonkit/lxpack` with `@lxpack/lessonkit` in a LessonKit project.

## Identity and scores

LessonKit uses `courseId`, `lessonId`, and `checkId` — mapped as-is into LXPack lesson and assessment ids. See [LessonKit identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html).

- **Bridge `submitAssessment`:** scores are **0–1** (scaled).
- **Packaged assessment YAML:** `passingScore` may be absolute points when written to disk.

`@lessonkit/lxpack/bridge` and `@lxpack/spa-bridge` share score normalization rules.

## Related

- [LessonKit interoperability](lessonkit-interoperability.md)
- [lessonkit.json interchange](lessonkit-interchange.md)
- [SPA bridge](spa-bridge.md)
- [LessonKit packaging guide](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html)
