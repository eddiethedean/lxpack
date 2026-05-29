# Migrating from `@lessonkit/lxpack` to `@lxpack/lessonkit`

**v0.6.0** adds `@lxpack/lessonkit`, a thin facade over LXPack packaging and bridge APIs.

## Install

```bash
npm install @lxpack/lessonkit
```

## API mapping

| `@lessonkit/lxpack` (legacy) | `@lxpack/lessonkit` / LXPack |
|------------------------------|------------------------------|
| Package descriptor → files | `packageLessonkit({ interchange, spaDirs, target })` |
| Bridge helpers | `getLxpackBridge`, `normalizeScore` from re-export |
| Interchange types | `LessonkitInterchangeV1`, `parseLessonkitInterchange` |
| Telemetry mapping | `mapLessonkitTelemetryToLxpack` |

LessonKit should keep React authoring and Vite CLI; call LXPack for validate/build/preview.

## Conformance

Run the shared matrix in CI:

```bash
pnpm --filter @lxpack/conformance test
```

## See also

- [LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md](../LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md)
- [lessonkit interoperability](lessonkit-interoperability.md)
