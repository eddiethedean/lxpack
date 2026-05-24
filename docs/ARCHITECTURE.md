# LXPack architecture (v0.2.1)

Internal layout after the SOLID refactor. Public behavior and package versions remain at **0.2.1** until a separate release.

## Package boundaries

| Package | Role | Extension points |
|---------|------|------------------|
| `@lxpack/validators` | `course.yaml` schema (Zod), `validateCourse`, assessment parsing, `enumerateActivities` | `lessonValidators` registry, Zod `superRefine` on variables |
| `@lxpack/runtime` | Browser runtime, LMS bridges, progress codec, quiz UI | `LmsBridge`, `AssessmentHost`, `lessonRenderers`, flow condition handlers |
| `@lxpack/scorm` | ZIP/dir export, manifests, HTML shells | `assemblePackage` + `PackageSink`, `sliceAssessmentBundleForActivity` |
| `@lxpack/cli` | `lxpack` commands | `getZipPackager` / `getDirPackager` registry |

## Runtime (`@lxpack/runtime`)

- **`LxpackRuntime`** — facade wiring config, `ProgressState`, `CompletionEvaluator`, and one **`LmsBridge`** (`scorm12`, `scorm2004`, `local`).
- **`progress/`** — `ProgressCodec`, size policy, `SCORM_SUSPEND_DATA_MAX` (no import from SCORM API in persistence).
- **`quiz/`** — `AssessmentHost` port; `render.ts` depends on the port, not the facade.
- **`client/`** — shell, nav, lesson renderer registry, `app.ts` orchestration; **`client.ts`** entry re-exports and auto-bootstraps.
- **`flow-conditions.ts`** — handler map for `evaluateCondition` (OCP for new condition kinds).
- **Subpaths:** `./client` (bundle), optional `./scorm12`, `./scorm2004` for LMS adapters.

## Validators (`@lxpack/validators`)

- **`course-paths.ts`** — safe path resolution shared with assessments.
- **`validate/`** — per-lesson-type validators composed via **`lessonValidators`**.
- **`course-assessments.ts`** — single parse pass: `loadParsedAssessments` → bundle builders.
- **`activities.ts`** — `enumerateActivities` (canonical activity list).
- **`html.ts`** — shared `escapeHtml` for Node exporters.

## SCORM (`@lxpack/scorm`)

- **`assemblePackage`** — dispatches `scorm2004` multi-SCO vs single-index `scorm12`/`standalone`.
- **`assessment-slice.ts`** — per-SCO learner bundle (moved from validators).
- **`page-template.ts`** — shared learner HTML shell (preview + export).

## CLI (`@lxpack/cli`)

- **`lib/validated-course.ts`** — one validation + assessment bundle per build/preview.
- **`lib/`** — course discovery, bundle I/O, lxpack config, HTML helper.
- **`packagers/`** — target → zip/dir packager registry.

## Adding features

1. **New lesson type** — extend Zod `lessonSchema`, add `validate/*` module, register in `lessonValidators`, add `client/lessons/*` + registry entry.
2. **New export target** — implement packager, register in `cli/src/packagers/index.ts`, extend `assemblePackage` if layout differs.
3. **New flow condition** — extend `conditionSchema` in validators, add handler in `flow-conditions.ts` and manifest validation in `flow-validate.ts`.
4. **New LMS** — implement `LmsBridge`, register in `lms/factory.ts`.

See also [REFACTORING.md](./REFACTORING.md) for invariants and CI commands.
