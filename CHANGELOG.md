# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- Completes Phase 1 (MVP). Phase 2 (v0.2.x) targets SCORM 2004 sequencing, branching, variables, quiz engine upgrades, and `@lxpack/components` — see [docs/ROADMAP.md](docs/ROADMAP.md).
- Phase 3+ covers xAPI, cmi5, themes, hot reload, and plugins.
- The runtime browser bundle is ESM (`client.js`); legacy LMS environments without module support are not targeted in this release.

[0.1.1]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.1
[0.1.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.0
