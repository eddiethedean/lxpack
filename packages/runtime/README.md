# @lxpack/runtime

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/runtime)](https://www.npmjs.com/package/@lxpack/runtime)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Browser runtime for LXPack courses — lesson navigation, markdown and HTML lessons, component widgets, branching flow, quiz engine, progress tracking, and SCORM 1.2 / 2004 integration.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Lesson types](https://lxpack.readthedocs.io/en/latest/reference/lesson-types/) · [Tracking and completion](https://lxpack.readthedocs.io/en/latest/reference/tracking-and-completion/) · [Branching](https://lxpack.readthedocs.io/en/latest/guides/branching-and-paths/).

| Related | Package |
|---------|---------|
| CLI / preview | [`@lxpack/cli`](https://github.com/eddiethedean/lxpack/blob/main/packages/cli/README.md) |
| Programmatic build | [`@lxpack/api`](https://github.com/eddiethedean/lxpack/blob/main/packages/api/README.md) |
| Validation & bundles | [`@lxpack/validators`](https://github.com/eddiethedean/lxpack/blob/main/packages/validators/README.md) |
| Export shell | [`@lxpack/scorm`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) |
| UI widgets | [`@lxpack/components`](https://github.com/eddiethedean/lxpack/blob/main/packages/components/README.md) |
| Track event types | [`@lxpack/tracking-schema`](https://github.com/eddiethedean/lxpack/blob/main/packages/tracking-schema/README.md) |

## Install

```bash
npm install @lxpack/runtime
```

Requires Node.js 18 or 20 (18+) for the build toolchain. Published bundles run in modern browsers (ESM `client.js`).

## Package exports

| Import | Description |
|--------|-------------|
| `@lxpack/runtime` | Node/build-time API (`LxpackRuntime`, flow, variables, SCORM helpers, progress serialization, types) |
| `@lxpack/runtime/client` | Self-contained browser bundle (`dist/client.js`) |
| `dist/styles.css` | Bundled with the client in SCORM/standalone exports |

## Browser client

Authoring HTML labs: [Building interactions](https://lxpack.readthedocs.io/en/latest/guides/building-interactions/). Quizzes: [Quizzes and assessments](https://lxpack.readthedocs.io/en/latest/guides/quizzes-and-assessments/).

The CLI and SCORM packager embed `@lxpack/runtime/client` into exported courses. The client:

- Renders markdown lessons, HTML interaction folders, **`type: spa`** lessons (iframe to `path/index.html`), and `type: component` lessons (via `window.__LXPACK_COMPONENTS__`)
- Applies optional `manifest.runtime.cssVariables` as CSS custom properties on the learner shell root
- Resolves **next/previous** navigation with the flow engine when `course.yaml` defines `flow`; otherwise linear lesson order
- Loads assessments from embedded config (`assessments`, `answerKeys`, `configs`, `feedback`); does not fetch author YAML in production exports
- Renders quizzes with `renderAssessment()` — retakes, choice shuffle, and feedback modes from per-assessment config
- Tracks lesson completion, manifest variables (`v:` prefix in suspend data), and assessment scores
- Persists progress via SCORM `suspend_data` / CMI (compact JSON, size-safe) or `localStorage` in preview mode

Config is injected by the packager using [`safeJsonForHtml`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) from `@lxpack/scorm`.

### SPA lessons and bridge API

SPA lessons load in an iframe. Embedded apps should call the parent bridge (not `window.lxpack` inside the iframe):

```js
window.parent?.lxpackBridge?.v1?.completeLesson("phishing_101");
window.parent?.lxpackBridge?.v1?.submitAssessment({
  id: "final_quiz",
  score: 0.9,
  passingScore: 0.7,
  passed: true,
});
window.parent?.lxpackBridge?.v1?.track({ type: "interaction", id: "clicked", data: { ok: true } });
```

Custom lesson renderers can register on `window.__LXPACK_LESSON_RENDERERS__` before the client boots.

## Flow and variables

```ts
import {
  evaluateCondition,
  resolveFlowGoto,
  resolveNextActivityId,
  initManifestVariables,
  readManifestVariable,
  writeManifestVariable,
} from "@lxpack/runtime";
```

| Module | Role |
|--------|------|
| `flow.ts` | Condition evaluation (`variable.eq`, `assessment.passed`, `interaction.done`, `all` / `any`) and `goto` resolution |
| `variables.ts` | Manifest variable defaults and `v:` namespaced storage in progress |

`LxpackRuntime` exposes `setVariable()` / `getVariable()` on the learner API when the manifest declares `variables`.

## Quiz module

```ts
import {
  renderAssessment,
  scoreAssessmentForm,
  getAttemptCount,
  shuffleQuestions,
} from "@lxpack/runtime";
// Re-exported from client as scoreAssessment
```

Supports `maxAttempts`, `shuffleChoices`, and `showFeedback` (`immediate` | `end` | `never`) from the build-time assessment bundle.

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

## SCORM 2004

```ts
import {
  findScorm2004Api,
  createScorm2004Connection,
  Scorm2004Adapter,
  Scorm2004Simulator,
} from "@lxpack/runtime";
```

| API | Description |
|-----|-------------|
| `findScorm2004Api()` | Locate `API_1484_11` in parent/opener frames |
| `createScorm2004Connection(mode)` | LMS adapter (`scorm2004`) or preview simulator |
| CMI mapping | Progress and completion mapped for multi-SCO packages |

Use `mode: "scorm2004"` in `RuntimeConfig` when embedding the runtime in SCORM 2004 launch pages.

## Runtime class

```ts
import { LxpackRuntime, type RuntimeConfig } from "@lxpack/runtime";

const runtime = new LxpackRuntime({
  manifest,
  mode: "scorm12", // "scorm2004" | "preview"
});

runtime.completeLesson("intro");
runtime.getAPI().setVariable("track", "advanced");
runtime.getAPI().submitAssessment("quiz", 0.85, 0.7);
runtime.getProgress();
runtime.terminate();
```

`LxpackAPI` methods include `track()`, `submitAssessment()`, `getProgress()`, and `setVariable()` / `getVariable()`. Call `runtime.terminate()` once when tearing down a SCORM session (guarded against double finish).

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
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [Preview and review](https://lxpack.readthedocs.io/en/latest/guides/preview-and-review/)
- [Technical specification](https://lxpack.readthedocs.io/en/latest/developer/SPEC/)
- [Architecture](https://lxpack.readthedocs.io/en/latest/developer/ARCHITECTURE/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0
