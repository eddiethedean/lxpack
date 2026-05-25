# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-05-24

### Added

- **`@lxpack/xapi`** — xAPI 1.0.3 statement types, ADL verb builders, launch param parsing, LRS transport with queue/flush, Tin Can `tincan.xml` generation
- **`@lxpack/cmi5`** — cmi5.xml generation with per-activity blocks (`moveOn` rules for lessons and assessments)
- Export targets **`xapi`** and **`cmi5`** (`lxpack build --target xapi|cmi5`) — Tin Can or cmi5 manifest + shared HTML/asset layout
- Optional `tracking.xapi` in `course.yaml` (`activityIri`, `displayName`) with build-time validation for xAPI/cmi5 targets
- Runtime **`AnalyticsReporter`** port with **`XapiReporter`** — statements on launch, experience, interaction (including simulation payloads), lesson completion, and assessment submit
- Preview xAPI logging via `lxpack.config.json` → `xapi.preview` (`logStatements`, `mockLrs`) and `localStorage` statement queue
- Examples: `examples/xapi-awareness`, `examples/cmi5-demo`; fixtures `test/fixtures/xapi-valid`, `test/fixtures/missing-xapi-iri`
- `lxpack.config.json` → `preview.scormMode` (`local` | `scorm12` | `scorm2004`) for SCORM API simulators during `lxpack preview`
- Root script `pnpm examples:validate` to validate all example courses
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

- Completes Phase 1 (MVP). Phase 2 shipped in v0.2.0 — see [docs/ROADMAP.md](docs/ROADMAP.md).
- Phase 3+ covers xAPI, cmi5, themes, hot reload, and plugins.
- The runtime browser bundle is ESM (`client.js`); legacy LMS environments without module support are not targeted in this release.

[0.2.2]: https://github.com/eddiethedean/lxpack/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/eddiethedean/lxpack/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.2.0
[0.1.1]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.1
[0.1.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.0
