Embedded SPA lessons run in an iframe. The parent LXPack runtime exposes **`window.lxpackBridge.v1`** for completion, assessments, and tracking.

Requires **LXPack v0.7.0+** and **`@lxpack/spa-bridge`** in SPA bundles.

## Child SDK (`@lxpack/spa-bridge`)

```ts
import { getLxpackBridge, normalizeScore } from "@lxpack/spa-bridge";

const bridge = getLxpackBridge();
bridge?.completeLesson("lesson_id");
bridge?.submitAssessment({
  id: "quiz_id",
  score: 0.9,
  passingScore: 0.7,
});
bridge?.track?.({ type: "interaction", id: "step_completed" });
```

## Bridge methods (v1)

| Method | Purpose |
|--------|---------|
| `completeLesson(lessonId)` | Mark one SPA lesson complete in suspend data and runtime progress |
| `completeCourse()` | Mark in-scope lessons complete, pass assessments at thresholds, set interaction keys for html/spa lessons |
| `submitAssessment({ id, score, passingScore?, maxScore?, passed? })` | Report quiz/check results to parent runtime |
| `track?(event)` | Send canonical `@lxpack/tracking-schema` events |

Full contract: [API stability](../developer/api-stability.md).

## Score semantics

| API | Scale |
|-----|--------|
| `submitAssessment` via bridge | **0–1** when `maxScore` is omitted (use `normalizeScore` when sending raw points) |
| `passingScore` in bridge payload | **0–1** (default `0.7`) |
| YAML assessment `passingScore` | **Absolute points** (native LXPack quizzes only) |

When `maxScore` is set on `submitAssessment`, `score` and `passingScore` are raw points if **> 1**, otherwise treated as already scaled **0–1**.

## LessonKit integration

In React apps, `@lessonkit/react` forwards completion and quiz events when the bridge is present (`config.lxpack.bridge`, default on).

```ts
import { notifyLxpackLessonComplete } from "@lessonkit/lxpack/bridge";

notifyLxpackLessonComplete("intro");
```

Disable forwarding: `config.lxpack.bridge = "off"` on `LessonkitProvider`.

LessonKit telemetry maps to bridge actions via `mapLessonkitTelemetryToBridgeAction` from `@lxpack/tracking-schema` (used in `@lessonkit/lxpack/bridge`).

## HTML and SPA `track()`

Non-React SPAs can call `track()` directly:

```js
window.parent.lxpackBridge.v1?.track({
  type: "interaction",
  id: "phishing_lab",
});
```

The parent runtime resolves html/spa lesson completion by interaction `id` (including sub-step ids while on the current lesson).

## Versioning

- Current: **`v1`** on `window.lxpackBridge.v1`
- Future versions will be added alongside v1; use `supportedBridgeVersions()` from `@lxpack/spa-bridge`
- Breaking bridge changes require a new version namespace (for example `v2`) — see [API stability](../developer/api-stability.md)

## Related

- [lessonkit.json interchange](lessonkit-interchange.md)
- [LessonKit interoperability](lessonkit-interoperability.md)
- [SCORM SPA recipes](../guides/scorm-spa-recipes.md)
- [LessonKit LXPack bridge](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-bridge.html)
