# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- Phase 1 MVP: SCORM 2004, xAPI, cmi5, themes, and hot reload are planned for later releases.
- The runtime browser bundle is ESM (`client.js`); legacy LMS environments without module support are not targeted in this release.

[0.1.0]: https://github.com/eddiethedean/lxpack/releases/tag/v0.1.0
