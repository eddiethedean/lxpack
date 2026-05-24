# @lxpack/runtime

[![npm version](https://img.shields.io/npm/v/@lxpack/runtime)](https://www.npmjs.com/package/@lxpack/runtime)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)

Browser runtime for LXPack courses — lesson navigation, markdown rendering, HTML interactions, assessments, progress tracking, and SCORM 1.2 integration.

Part of [LXPack](https://github.com/eddiethedean/lxpack) — an AI-native learning experience compiler and runtime.

## Install

```bash
npm install @lxpack/runtime
```

Requires Node.js 20+ for the build toolchain. The published bundles run in the browser.

## Package exports

| Export | Description |
|--------|-------------|
| `@lxpack/runtime` | Node/build-time API (`LxpackRuntime`, SCORM helpers, types) |
| `@lxpack/runtime/client` | Self-contained browser bundle (`client.js`) |
| `@lxpack/runtime` (CSS) | `dist/styles.css` — bundled with the client in SCORM/standalone exports |

## Browser client

The CLI and SCORM packager embed `@lxpack/runtime/client` into exported courses. The client:

- Renders markdown lessons and HTML interaction folders
- Runs YAML-defined MCQ assessments with scoring
- Tracks lesson completion and assessment scores
- Persists progress via SCORM `suspend_data` or `localStorage` in preview mode

## SCORM 1.2

```ts
import {
  findLmsApi,
  createScormConnection,
  installScormAPI,
  Scorm12Adapter,
  Scorm12Simulator,
} from "@lxpack/runtime";
```

- **`findLmsApi()`** — walks parent/opener frames to locate the LMS SCORM 1.2 API
- **`createScormConnection(mode)`** — returns an LMS adapter (`scorm12`) or local simulator (`preview`)
- **`installScormAPI()`** — exposes the simulator API on `window` for preview servers

Suspend data is trimmed to stay within the SCORM 1.2 4096-character limit.

## Runtime class

```ts
import { LxpackRuntime, type RuntimeConfig } from "@lxpack/runtime";

const runtime = new LxpackRuntime({
  manifest,
  mode: "scorm12", // or "preview"
});

runtime.completeLesson("intro");
runtime.getAPI().submitAssessment("quiz", 0.85, 0.7);
runtime.getProgress();
```

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/runtime build
pnpm --filter @lxpack/runtime test
```

Build output:

- `dist/client.js` — Vite browser bundle
- `dist/runtime.js` — Node/library entry
- `dist/styles.css` — runtime styles

## License

Apache-2.0
