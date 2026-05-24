# @lxpack/runtime

[![npm version](https://img.shields.io/npm/v/@lxpack/runtime)](https://www.npmjs.com/package/@lxpack/runtime)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Browser runtime for LXPack courses — lesson navigation, markdown rendering, HTML interactions, assessments, progress tracking, and SCORM 1.2 integration.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime.

| Related | Package |
|---------|---------|
| CLI / preview | [`@lxpack/cli`](../cli/README.md) |
| Validation & bundles | [`@lxpack/validators`](../validators/README.md) |
| Export shell | [`@lxpack/scorm`](../scorm/README.md) |

## Install

```bash
npm install @lxpack/runtime
```

Requires Node.js 20+ for the build toolchain. Published bundles run in modern browsers (ESM `client.js`).

## Package exports

| Import | Description |
|--------|-------------|
| `@lxpack/runtime` | Node/build-time API (`LxpackRuntime`, SCORM helpers, progress serialization, types) |
| `@lxpack/runtime/client` | Self-contained browser bundle (`dist/client.js`) |
| `dist/styles.css` | Bundled with the client in SCORM/standalone exports |

## Browser client

The CLI and SCORM packager embed `@lxpack/runtime/client` into exported courses. The client:

- Renders markdown lessons and HTML interaction folders
- Loads assessments from the embedded config (`assessments` + `answerKeys`); does not fetch author YAML in production exports
- Scores MCQ submissions with `scoreAssessment()`
- Tracks lesson completion and assessment scores
- Persists progress via SCORM `suspend_data` (compact JSON, 4096-char safe) or `localStorage` in preview mode

Config is injected by the packager using [`safeJsonForHtml`](../scorm/README.md) from `@lxpack/scorm`.

## SCORM 1.2

```ts
import {
  findLmsApi,
  createScormConnection,
  installScormAPI,
  Scorm12Adapter,
  Scorm12Simulator,
  SCORM_SUSPEND_DATA_MAX,
} from "@lxpack/runtime";
```

| API | Description |
|-----|-------------|
| `findLmsApi()` | Walk parent/opener frames to locate the LMS SCORM 1.2 API |
| `createScormConnection(mode)` | LMS adapter (`scorm12`) or local simulator (`preview`) |
| `installScormAPI()` | Expose the simulator API on `window` for preview servers |
| `trimSuspendData(data)` | Truncate suspend data to `SCORM_SUSPEND_DATA_MAX` (4096) |

Progress uses a compact suspend-data format with legacy fallback parsing. Assessment submission updates completion status before persisting to the LMS.

## Runtime class

```ts
import { LxpackRuntime, type RuntimeConfig } from "@lxpack/runtime";

const runtime = new LxpackRuntime({
  manifest,
  mode: "scorm12", // or "preview"
  defaultPassingScores: { quiz: 0.7 },
});

runtime.completeLesson("intro");
runtime.getAPI().submitAssessment("quiz", 0.85, 0.7);
runtime.getProgress();
```

`LxpackAPI` methods include `track()`, `submitAssessment()`, `getProgress()`, and `terminate()` (guarded against double `LMSFinish`).

## Build output

| Artifact | Role |
|----------|------|
| `dist/client.js` | Vite browser bundle (embedded in packages) |
| `dist/runtime.js` | Node/library entry |
| `dist/styles.css` | Runtime styles |
| `dist/*.d.ts` | Type declarations |

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/runtime build
pnpm --filter @lxpack/runtime test
pnpm --filter @lxpack/runtime typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
