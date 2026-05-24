# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-05-24

### Fixed

- Quiz `maxAttempts` now persists across submits and navigation
- SCORM status no longer marks the course failed while quiz retries remain
- SCORM 2004 SCO pages use correct asset `baseUrl` and honor `activityId` on first launch
- SCORM 2004 exports no longer embed all answer keys in every SCO; manifest omits missing `lxpack-components.js`
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

[0.2.1]: https://github.com/eddiethedean/lxpack/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.2.0
[0.1.1]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.1
[0.1.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.0
