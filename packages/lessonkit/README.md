# @lxpack/lessonkit

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/lessonkit)](https://www.npmjs.com/package/@lxpack/lessonkit)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

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
