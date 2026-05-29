# SPA bridge (`lxpackBridge.v1`)

Embedded SPA lessons run in an iframe. The parent LXPack runtime exposes **`window.lxpackBridge.v1`** for completion, assessments, and tracking.

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
```

## Score semantics

| API | Scale |
|-----|--------|
| `submitAssessment` via bridge | **0–1** (use `normalizeScore` when sending raw points) |
| `passingScore` in bridge payload | **0–1** default `0.7` |
| YAML assessment `passingScore` | **Absolute points** (native LXPack quizzes only) |

## Versioning

- Current: **`v1`** on `window.lxpackBridge.v1`
- Future versions will be added alongside v1; use `supportedBridgeVersions()` from `@lxpack/spa-bridge`

## See also

- [lessonkit.json interchange](lessonkit-interchange.md)
- [LessonKit interoperability](../guides/lessonkit-interoperability.md)
