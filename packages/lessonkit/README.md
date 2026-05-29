# @lxpack/lessonkit

LessonKit integration facade for LXPack: `packageLessonkit`, interchange validation, SPA bridge, and telemetry mapping.

## Install

```bash
npm install @lxpack/lessonkit
```

## Usage

```ts
import {
  packageLessonkit,
  parseLessonkitInterchange,
  getLxpackBridge,
  mapLessonkitTelemetryToBridgeAction,
} from "@lxpack/lessonkit";
```

See [LessonKit interoperability](https://lxpack.readthedocs.io/en/latest/guides/lessonkit-interoperability/).
