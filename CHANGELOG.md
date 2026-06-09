# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-06-09

### Added

- **Multi-select MCQ** — assessments support checkbox “select all that apply” questions (`selectionMode: multiple` or inferred from multiple correct choices); partial credit when only correct choices are selected
- **Validators** — multi-select schema validation (at least two correct choices); array answer keys in runtime bundles (`choiceId[]`)
- **Runtime** — checkbox UI, multi-select scoring, mixed single-/multi-select assessments in one quiz
- **Conformance** — SCORM 1.2/2004 multi-select MCQ export and learner-shell pass/fail matrix (`test/fixtures/multi-select-valid/`)

### Changed

- **Docs** — quizzes, assessments, LessonKit interoperability, and validator references updated for multi-select MCQ

## [0.6.4] - 2026-06-01

### Fixed

- **Validators / CLI:** component-lesson bundle check in preview and `--lessonkit` validate/preview paths (parity with `lxpack build`)
- **Runtime / flow:** `any`/`all` flow rules without `from` apply on all inferrable source activities, not just the first nested branch
- **Runtime:** Next button disabled when no reachable next step in a branching course
- **Runtime:** warn when flow `goto` target is not in the current nav list
- **Validators:** flow cycle detection for `interaction.done` aligned with runtime (specific lesson id)
- **Validators:** HTML interactions using `parent.lxpackBridge` no longer warn incorrectly
- **API:** `packageLessonkit()` resolves relative output against `configDir` by default
- **CLI:** reject relative paths in `--spa-lesson`

## [0.6.3] - 2026-05-30

### Added

- **Flow:** optional `from` on flow rules limits when a rule is evaluated (activity id the learner is on); `interaction.done` and `assessment.passed` rules infer `from` when omitted
- **Validators:** warn when `variable.eq` flow rules omit `from` (migration hint)

### Fixed

- **Runtime:** position-aware flow navigation — persistent variables no longer redirect learners on unrelated steps; branching-demo basic path skips `component_lesson`
- **Runtime:** sidebar disabled state matches click reachability; Prev/Next buttons disabled when flow blocks the target
- **CLI:** `lxpack preview --lessonkit` fails on invalid `lxpack.config.json` (parity with validate/build)
- **CLI:** malformed `--spa-lesson` values exit with a clear error instead of an uncaught exception
- **CLI:** `findCourseDir` and unexpected build errors print friendly messages and exit 1

## [0.6.2] - 2026-05-30

### Fixed

- **Runtime:** clear content area when navigating so stale async renders no longer leave the previous lesson visible; delayed iframe `track()` resolves html/spa lessons by interaction id (with fallback for sub-step ids on the current lesson)
- **CLI:** `lxpack init --force` removes stale `lessonkit.json` and `lxpack.import.json`
- **Validators:** `lessonkit.json` / `lxpack.import.json` no longer trigger false “included in export” warnings
- **API:** `packageLessonkit()` accepts optional `configDir` and resolves `target` / `outputBaseDir` from `lxpack.config.json` when omitted (CLI parity)

### Changed

- **Node.js:** all `@lxpack/*` packages and the CLI now support **Node.js 18 and 20** (`engines.node` is `>=18`). CI runs lint, build, typecheck, test, examples, conformance, and coverage on both versions.
- **Validators:** markdown validation warns on `vbscript:` and `data:text/html` URIs (aligned with runtime sanitizer)

## [0.6.1] - 2026-05-29

### Fixed

- **Runtime:** assessment UI no longer renders into the wrong activity after fast navigation (`isStale` guard on assessment load)
- **SCORM packaging:** `lessonkit.json` and `lxpack.import.json` are omitted from LMS export ZIPs (parity with preview)
- **cmi5:** `fetchCmi5AuthToken` always uses POST even when `RequestInit.method` is overridden
- **CLI:** `--lessonkit` build/validate/preview load `lxpack.config.json` from the interchange file’s directory, not only `process.cwd()`
- **API / exports:** `readRuntimeBundle` merges `@lxpack/components` CSS like preview (`loadLearnerStyles` shared with CLI)
- **xAPI:** preserve `Bearer` authorization headers; terminal flush retries after an in-flight flush completes
- **SCORM bridges:** honor LMS `Initialize` / `Commit` / `Finish` failures; skip persist/restore when the session is not ready
- **SCORM 2004:** `Scorm2004Adapter` blocks Get/Set after `Terminate` (matches SCORM 1.2 adapter behavior)
- **CLI:** `lxpack init --force` removes stale `course.yaml`, `lxpack.config.json`, `.lxpack/`, and `.gitignore` at the project root

## [0.6.0] - 2026-05-29

### Added

- **`@lxpack/spa-bridge`** — typed child SDK (`getLxpackBridge`), score normalization, `createLxpackBridgeHost` for the runtime
- **`@lxpack/tracking-schema`** — `mapLessonkitTelemetryToLxpack` / `mapLessonkitTelemetryToBridgeAction` for LessonKit event names (including `course_completed` → `completeCourse`)
- **Theme presets** — `runtime.themePreset` in interchange (`lessonkit:default`, `lessonkit:brand`) resolves to `cssVariables`
- **CLI** — `lxpack preview --lessonkit` and `lxpack validate --lessonkit` with `--spa-lesson` / `--spa-dist`
- **`@lxpack/conformance`** — shared export-target matrix runner for CI
- **`@lxpack/lessonkit`** — meta-package re-exporting package, bridge, interchange, and telemetry APIs
- **Docs** — [SPA bridge](https://lxpack.readthedocs.io/en/latest/reference/spa-bridge/), [SCORM SPA recipes](https://lxpack.readthedocs.io/en/latest/guides/scorm-spa-recipes/), [API stability](https://lxpack.readthedocs.io/en/latest/developer/api-stability/)

### Changed

- Runtime bridge host uses `@lxpack/spa-bridge`; `completeCourse()` on `lxpackBridge.v1` marks in-scope lessons, passes assessments, and sets html/spa interaction suspend keys
- Interchange `tracking.xapi` supported in `lessonkit.json` v1
- SPA validators warn when `index.html` omits `lxpackBridge` references
- **`packageLessonkit`:** drops temp staging after successful build unless `debug` or explicit `courseDir`; resolves output paths against project cwd via `outputAnchorDir`

### Fixed

- **Runtime / SPA bridge:** bridge `track` uses the same wrapper as `window.lxpack` (flow + interaction completion); bridge completions refresh nav/progress; `completeCourse()` respects SCORM 2004 per-SCO launch scope
- **SPA bridge:** score normalization when `maxScore` is set but values are already 0–1; non-finite scores rejected; optional `passed` honored on `submitAssessment`
- **LessonKit:** validate SPA destination paths before copy (path escape); interchange warnings on build/preview/API when assessments are injected; preview `--lessonkit` respects `lxpack.config.json` default export target; merge `course.title` from interchange
- **LessonKit schema:** reject invalid SPA paths, duplicate lesson ids, and `path` / `build.outputDir` conflicts at parse time; warn on unknown `themePreset`
- **CLI:** reject unknown or missing `--spa-lesson` ids up front
- **Preview:** guard async markdown renders against stale navigation

## [0.5.0] - 2026-05-29

### Added

- **`packageLessonkit()`** (`@lxpack/api`) — materialize `course.yaml`, copy SPA build folders with path containment, and build LMS packages without a hand-authored project tree
- **LessonKit interchange schema (v1)** — Zod-validated `lessonkit.json` (`format: lessonkit`, `version: 1`); `parseLessonkitInterchange`, `interchangeToManifest`, `materializeLessonkitProject` in `@lxpack/validators`
- **Interchange-only validation** — `validateCourseWithInterchange` accepts courses with interchange but no `course.yaml`
- **CLI** — `lxpack build --lessonkit <path> --spa-lesson id=/abs/dist` (and `--spa-dist` for single-SPA courses)
- **Docs** — [lessonkit.json interchange reference](https://lxpack.readthedocs.io/en/latest/reference/lessonkit-interchange/)
- **Example** — `examples/lessonkit-spa/scripts/package-via-api.mjs`

### Changed

- Interchange files must declare `format: "lessonkit"` and `version: "1"` (invalid interchange fails with path-qualified Zod errors)
- `mergeInterchangeIntoManifest` merges `runtime.cssVariables` and interchange assessment refs

## [0.4.0] - 2026-05-27

### Added

- **`type: spa` lessons** — package built web app folders (`path/index.html`) across all export targets; parent bridge API `window.parent.lxpackBridge.v1` for completion, assessments, and tracking
- **`@lxpack/api`** — programmatic `validateCourse` and `buildCourse` with typed results, optional injected assessments, and interchange merge
- **`@lxpack/tracking-schema`** — shared track event types for runtime and adapters
- **`lessonkit.json` / `lxpack.import.json`** — optional interchange metadata merged at validate/build (CLI and API)
- **Example** — `examples/lessonkit-spa/` demonstrating SPA + markdown in one course

### Changed

- CLI validate/build/preview merge `lessonkit.json` via shared `@lxpack/validators` interchange module (parity with `@lxpack/api`)
- Documentation and library skills updated for v0.4.0 LessonKit interoperability

### Fixed

- **SCORM 1.2:** `imsmanifest.xml` now lists `lxpack-components.js` when a components bundle is shipped
- **SCORM 2004:** removed duplicate `<file>` entries for `lxpack-runtime.js` / `lxpack-components.js` in `shared_assets`
- **Interchange validation:** `validateCourseWithInterchange` no longer returns stale pre-merge errors after `lessonkit.json` fixes the manifest; preview failure diagnostics use interchange merge (same as validate/build)
- **Runtime navigation:** Prev button no longer linear-back into flow-skipped lessons; numeric flow conditions reject non-finite values (`NaN`)
- **SPA lessons:** `interaction.done` parity with HTML lessons in runtime, validators, and docs
- **Preview security:** block `lessonkit.json`, `lxpack.import.json`, and `node_modules/` under `/course/`; interchange files validated with packagable-path rules (symlink escape blocked)
- **CLI:** `validate` and `preview` default export target aligned with `build` (`scorm12`); `build` prints validation issues on failure; component lessons fail validation when `@lxpack/components` bundle is unavailable

## [0.3.6] - 2026-05-26

### Fixed

- SCORM/LMS: browser client bundle inlines validators subset instead of bare `@lxpack/validators` import ([#3](https://github.com/eddiethedean/lxpack/issues/3))

## [0.3.5] - 2026-05-26

### Fixed

- Runtime client bundle: SCORM/LMS launch no longer throws `ReferenceError: process is not defined` (Vitest bootstrap guard)
- Flow: sidebar navigation respects branching rules when `flow` is defined
- Flow: `interaction.done` uses the same explicit completion rules as HTML auto-complete
- Flow: Prev button respects branching reachability (cannot linear-back into skipped activities)
- Flow: boolean variable equality is strict (`true`/`false` only; `0`/`1` no longer match)
- Progress: empty compact `{}` suspend_data restores without corrupt-data warnings
- SCORM 2004 / 1.2: zero-progress sessions set `incomplete` CMI instead of leaving stale LMS status
- cmi5: AU session bootstrap via `fetch` launch URL (POST + `auth-token`; cached in `sessionStorage` for refresh)

### Security

- Validate `assessments[].file` must live under `assessments/`; exports and preview block manifest paths
- Preview: case-insensitive blocks, manifest-driven denylist, backslash-normalized URLs; block URL aliases to sensitive realpaths
- Harden `course.yaml` and `lxpack.config.json` load against symlink escapes
- Reject symlinks and hard links on markdown lessons, assessments, and packaged files; reject in-tree aliases to `assessments/` or manifest paths
- Reject hard links under `interactions/` and symlinks/hard links on component overrides
- Markdown lesson paths use safe relative-path rules
- Packaging requires an assessment bundle when the course defines assessments
- Packaging skips `assessments/` case-insensitively (aligned with preview)

### Changed

- `validate` warns on `javascript:` URIs in markdown lesson links/images
- `validate` normalizes backslashes in HTML interaction paths
- Preview validation failures print `[warning]` / `[error]` labels like `lxpack validate`

### Notes

- HTML interaction iframes still use `allow-same-origin` (trusted author content)

## [0.3.4] - 2026-05-25

### Fixed

- SCORM 2004: per-SCO completion/CMI when launched with `activityId`
- Preview: decode and normalize `%`-encoded `/course/` paths before blocklist
- Components: quote-safe HTML escaping in builtin widgets
- SCORM 1.2: `incomplete` when progress exists at 0% score; trim `suspend_data` on direct `LMSSetValue`
- Progress: empty compact `{}` suspend_data no longer resets state
- Build: missing xAPI IRI throws `CoursePackagingError`
- Learner shell: graceful error when config JSON is invalid

### Changed

- `validate` / `preview` respect `lxpack.config.json` `defaultTarget` like `build`; `preview` gains `--target`
- Validate output distinguishes warnings vs errors
- Validator warning for cmi5 `fetch` limitation; preview warns on non-loopback host

### Security

- `safeJsonForHtml` also escapes `>`
- Markdown links/images: block `javascript:` URIs

### Notes

- HTML interaction iframes still use `allow-same-origin` (trusted author content); cmi5 `fetch` AU bootstrap remains future work

## [0.3.3] - 2026-05-27

### Fixed

- SCORM minimal/trim suspend_data preserves flow `interaction_*` and `v:*` keys
- `lxpack validate` applies xapi/cmi5 rules from `lxpack.config.json` `defaultTarget`
- HTML interaction auto-complete only on explicit completion (aligns with flow `interaction.done`)
- SCORM 2004: failed assessments no longer set `completion_status` to `completed`
- xAPI launch params: merge query string and hash (hash wins on duplicates)
- `examples/xapi-awareness` and `examples/cmi5-demo` `defaultTarget` match demo purpose

### Changed

- `scripts/validate-examples.sh` checks `scorm12` / `scorm2004` targets for linear and branching demos

## [0.3.2] - 2026-05-26

### Fixed

- Branching demo `choose-path` interaction uses `window.parent.lxpack` so variable branching works inside iframe labs (preview and SCORM)
- Restored `@lxpack/cli` coverage thresholds with tests for `loadLearnerStyles()` and preview xAPI/cmi5 validation paths

### Changed

- Default learner UI: expanded markdown typography, quiz layout, dark-theme shell polish, and built-in component styling in preview and exports
- Preview and SCORM builds embed full learner styles via `loadLearnerStyles()` (runtime + component CSS when needed)
- `lxpack init` and example HTML interactions use a consistent modern lab theme inside interaction frames
- `validate` warns when HTML interaction `index.html` calls `window.lxpack` instead of `window.parent.lxpack`

## [0.3.1] - 2026-05-25

### Fixed

- Flow `interaction.done` now recognizes html lesson completion when interactions call `track()` with an event id different from the lesson id (init and examples used mismatched ids). The preview runtime mirrors completion onto the lesson id without duplicate xAPI statements
- HTML interaction `track({ data: false })` no longer marks the lesson done for flow `interaction.done`
- `isInteractionDone` treats only truthy values as done (not `0` or `""`)
- Preview server blocks normalized path traversal (`..`, `//`, `./`) to `course.yaml`, `lxpack.config.json`, assessments, `.lxpack/`, dotfiles, and `lxpack.config.ts`
- Preview and packaging reject course paths that escape the course directory via symlinks
- `collectFiles` rejects symlinks; blocks `.env` and `.git` from export packages
- `output.dir` and `build -o` paths resolve with `realpath` containment
- SCORM suspend pruning preserves `interaction_*` keys referenced in manifest `flow`
- xAPI statement queue uses `fetch` `keepalive` on terminate for best-effort LRS delivery
- Corrupt SCORM `suspend_data` logs a warning instead of failing silently
- `validateCourse` runs xAPI tracking checks when `tracking.xapi` is set or export target is xapi/cmi5
- HTML interaction directories validated for nested symlink escapes
- `lxpack init --force` clears prior `assessments/` and `interactions/` content before rescaffolding
- `build` / `preview` load `lxpack.config.json` after resolving export target validation needs

### Changed

- `lxpack init` and example phishing labs use the lesson id in `track()` for consistency with `interaction.done`
- `examples/xapi-awareness`: correct course title and `activityIri` metadata
- `examples/cmi5-demo`: correct course title metadata
- Documentation: security notes reflect DOMPurify markdown sanitization (shipped in 0.3.0); preview blocking, export TOC order, SCORM 2004 completion semantics, cmi5 `fetch` limitation

### Notes

- cmi5 `fetch` launch parameter is parsed but AU session bootstrap via `fetch` is not implemented in v0.3.1 (runtime warns when present)

## [0.3.0] - 2026-05-24

### Added
- DOMPurify-based markdown sanitization in the browser runtime
- `installScorm2004API()` for preview SCORM 2004 simulation

### Changed

- `lxpack.config.json` `exports.defaultTarget` may be `xapi` or `cmi5`
- Runtime client build externalizes `@lxpack/validators` (type-only imports) to keep the browser bundle Node-free
- `lxpack validate --target` rejects unknown export targets (same as `build`)
- Preview server blocks `/course/course.yaml`, `/course/lxpack.config.json`, and `/course/.lxpack/*`
- HTML interaction paths validated for safe characters; iframe `src` escaped
- Flow `variable.eq` respects manifest variable `type` when comparing values
- Runtime applies `lxpack-theme-{theme}` class from `course.yaml` `runtime.theme`
- CI runs `pnpm test:coverage` with per-package thresholds

### Fixed

- cmi5 launch `fetch` query param no longer used as the xAPI LRS `endpoint`
- LRS transport re-queues statements after a failed POST instead of dropping them
- Preview xAPI `onStatement` callback no longer fires twice per statement
- Browser client passes `activityIri` and `xapi` config through to `LxpackRuntime`
- `lxpack validate` checks xAPI tracking when `--target xapi|cmi5` or `tracking.xapi` is present
- Preview YAML assessment fetch includes `maxAttempts`, `shuffleChoices`, and `showFeedback`
- SCORM minimal suspend snapshot preserves `assessment_attempts_*` keys when scores exist
- `interaction.done` flow conditions require a truthy interaction value
- xAPI `buildInteracted` avoids duplicate simulation keys in statement extensions
- Activity lists for xAPI analytics delegate to `enumerateActivities` from `@lxpack/validators`
- Preview can use SCORM 1.2 / 2004 simulators via config (default remains `local` / localStorage)
- Documentation synced for Phase 3 (shipped) and preview SCORM behavior

### Notes

- cmi5 `fetch` launch parameter is parsed but session bootstrap via `fetch` is not implemented in v0.3.0 (runtime warns when present)

## [0.2.2] - 2026-05-24

### Fixed

- Flow cycle detection now analyzes real flow-jump graphs (context-aware for `assessment.passed` and `interaction.done`); replaces broken rule-index heuristic
- `submitAssessment` and `track({ type: "assessment" })` enforce `maxAttempts` and ignore submissions after pass
- Quiz UI shows correct attempts remaining, blocks exhausted forms, and prevents double-submit
- SCORM suspend pruning preserves `assessment_attempts_*` and `assessment_passing_*` keys
- SCORM 2004 single-SCO mode restricts sidebar navigation to the launch activity
- Flow navigation falls back to linear next/prev when `goto` target is invalid
- SCORM 2004 `suspend_data` trimmed to 4096 characters (parity with SCORM 1.2)
- Duplicate assessment IDs no longer parse the second file; empty `all`/`any` conditions rejected
- Activity IDs restricted to safe characters for SCORM paths; duplicate question/choice IDs rejected
- `interaction.done` flow conditions must reference html interaction lessons only

### Changed

- Root `pnpm test` runs `pnpm build` first via `pretest` to avoid stale `dist/` failures

## [0.2.1] - 2026-05-24

### Fixed

- Quiz `maxAttempts` now persists across submits and navigation
- SCORM status no longer marks the course failed while quiz retries remain
- SCORM 2004 SCO pages use correct asset `baseUrl` and honor `activityId` on first launch
- SCORM 2004 exports no longer embed all answer keys in every SCO; manifest omits missing `lxpack-components.js`
- SCORM 2004 lesson SCOs no longer embed quiz questions, feedback, or configs (assessment content only on assessment launch pages)
- SCORM `suspend_data` serialization uses a parse-safe minimal snapshot instead of byte-truncating JSON
- Exported packages error clearly when an assessment is missing from embedded config (no silent YAML fetch)
- Preview reuses validated assessment bundle from a single `validateCourse` pass (same as build)
- `lxpack build --dir --target scorm2004` produces a valid multi-SCO tree; directory builds include the components bundle when used
- Flow cycles, duplicate lesson/assessment IDs, and invalid flow references fail validation
- Preview blocks direct access to `assessments/*.yaml` source files
- Flow navigation race after “Mark complete” corrected; manifest variables restored after suspend data load

## [0.2.0] - 2026-05-23

### Added

- Manifest `variables` and `flow` with a small condition AST (`variable.eq`, `assessment.passed`, `interaction.done`, `all` / `any`)
- Flow-aware navigation in `@lxpack/runtime` (linear fallback when `flow` is omitted)
- Quiz engine upgrades: `maxAttempts`, `shuffleChoices`, `showFeedback` (immediate | end | never)
- `@lxpack/components` — built-in widgets (`callout`, `image-card`, `checklist`), registry, and browser bundle
- Lesson type `component` with optional `props`
- SCORM 2004 multi-SCO export (`lxpack build --target scorm2004`) with per-activity launch pages and IMS Simple Sequencing subset
- SCORM 2004 Run-Time API adapter (`API_1484_11`) and preview simulator
- Example course at `examples/branching-demo`

### Changed

- Assessment configs and feedback text are embedded in runtime config at build time (author YAML still excluded from ZIPs)
- `lxpack init` scaffolds a `components/` directory and documents optional `variables` / `flow` keys

### Notes

- Completes Phase 2 (runtime expansion). Phase 3+ covers xAPI, cmi5, themes, hot reload, and plugins.
- SCORM 2004 sequencing uses a supported rule subset; validate packages in SCORM Cloud or Moodle before production rollout.

## [0.1.1] - 2026-05-23

### Fixed

- Escape `<` in embedded JSON config (preview + export) to prevent script-breakout
- Stop shipping assessment answer keys as fetchable YAML; embed sanitized assessments in runtime config
- Path containment for `lxpack init --dir` and `lxpack.config.json` output directory
- Symlink path traversal in course validation
- SCORM progress: compact suspend data, safe truncation, `lesson_location` fallback
- SCORM status committed after assessment submission
- Assessment `track()` parity, navigation race guard, double `LMSFinish`
- Stricter assessment sub-schemas; preview fails on validation errors like build
- SCORM manifest identifier collisions; build reuses validated manifest

### Security

- Markdown sanitization remains basic; only use trusted author content until DOMPurify support lands

## [0.1.0] - 2026-05-23

### Added

- `@lxpack/cli` — `init`, `preview`, `validate`, and `build` commands
- `@lxpack/validators` — strict Zod schemas, path containment, assessment validation
- `@lxpack/runtime` — browser client with markdown lessons, HTML interactions, MCQ assessments, progress tracking
- `@lxpack/scorm` — SCORM 1.2 and standalone HTML ZIP/directory export
- Real SCORM 1.2 LMS API discovery with preview simulator fallback
- `lxpack.config.json` for default export target and output directory
- Example course at `examples/security-awareness`
- CI checks (lint, build, typecheck, test) and release workflow with pre-publish gates

### Notes

- Completes Phase 1 (MVP). Phase 2 shipped in v0.2.0 — see [Roadmap](https://lxpack.readthedocs.io/en/latest/developer/ROADMAP/).
- Phase 3+ covers xAPI, cmi5, themes, hot reload, and plugins.
- The runtime browser bundle is ESM (`client.js`); legacy LMS environments without module support are not targeted in this release.

[0.2.2]: https://github.com/eddiethedean/lxpack/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/eddiethedean/lxpack/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.2.0
[0.1.1]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.1
[0.1.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.0
