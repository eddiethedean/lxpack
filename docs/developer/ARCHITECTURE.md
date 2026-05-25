# LXPack architecture (v0.3.3)

Internal layout after the SOLID refactor. Current release **v0.3.3**.

## Package boundaries

| Package | Role | Extension points |
|---------|------|------------------|
| `@lxpack/validators` | `course.yaml` schema (Zod), `validateCourse`, `validateXapiTracking`, assessment parsing, `enumerateActivities` | `lessonValidators` registry, Zod `superRefine` on variables |
| `@lxpack/xapi` | xAPI statement types, verb builders, launch params, LRS transport, Tin Can XML | `StatementQueue`, `onStatement` hook |
| `@lxpack/cmi5` | cmi5.xml + block definitions from manifest activities | `generateCmi5Xml` |
| `@lxpack/runtime` | Browser runtime, LMS bridges, **analytics reporters**, progress codec, quiz UI | `LmsBridge`, `AnalyticsReporter`, `AssessmentHost`, `lessonRenderers` |
| `@lxpack/scorm` | ZIP/dir export, SCORM/xAPI/cmi5 manifests, HTML shells | `assemblePackage` + `PackageSink` |
| `@lxpack/cli` | `lxpack` commands | `getZipPackager` / `getDirPackager` registry |
| `@lxpack/components` | Built-in widgets and browser bundle | component registry |

## Runtime (`@lxpack/runtime`)

- **`LxpackRuntime`** — facade wiring config, `ProgressState`, `CompletionEvaluator`, one **`LmsBridge`**, and one **`AnalyticsReporter`**.
- **`analytics/`** — `NoopReporter` (SCORM/standalone default), `XapiReporter` (xAPI/cmi5/preview with `activityIri`), `createAnalyticsReporter` factory.
- **`lms/`** — SCORM 1.2/2004 adapters; `xapi`/`cmi5` use `LocalBridge` for progress only (statements go to analytics).
- **`progress/`** — `ProgressCodec`, size policy, suspend data limits.
- **Subpaths:** `./client` (bundle), `./scorm12`, `./scorm2004` for LMS adapters.

## Validators (`@lxpack/validators`)

- **`xapi-validate.ts`** — `validateXapiTracking`, `getCourseActivityIri` for xAPI/cmi5 builds.
- **`activities.ts`** — `enumerateActivities` (canonical activity list for Node tooling).

## SCORM / export (`@lxpack/scorm`)

- **`assemblePackage`** — dispatches `scorm2004`, `xapi`/`cmi5` (Tin Can or cmi5.xml), or single-index `scorm12`/`standalone`.
- **`page-template.ts`** — shared learner HTML shell with `mode`, optional `activityIri`.

## CLI (`@lxpack/cli`)

- **`packagers/`** — all five export targets registered for zip and dir output.
- Preview embeds `activityIri` and `xapi.preview` settings when present in config/manifest.

## Adding features

1. **New lesson type** — extend Zod `lessonSchema`, validators, client lesson registry.
2. **New export target** — extend `ExportTarget`, `assemblePackage`, CLI packagers.
3. **New analytics backend** — implement `AnalyticsReporter`, register in `analytics/factory.ts`.
4. **New LMS** — implement `LmsBridge`, register in `lms/factory.ts`.

See also [REFACTORING.md](./REFACTORING.md) for invariants and CI commands.
