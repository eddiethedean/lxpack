# @lxpack/lessonkit

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/lessonkit)](https://www.npmjs.com/package/@lxpack/lessonkit)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Optional **LXPack meta-package** — re-exports `@lxpack/api`, `@lxpack/spa-bridge`, interchange validation, and telemetry mapping for integrators who prefer the `@lxpack/*` npm scope.

**React authors:** use [**LessonKit 1.0**](https://github.com/eddiethedean/lessonkit) and **`@lessonkit/lxpack`** for LMS packaging (`lessonkit package`). You do not need `@lxpack/lessonkit` in a standard LessonKit project.

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
  mapLessonkitTelemetryToLxpack,
} from "@lxpack/lessonkit";
```

## Docs

- [LessonKit & React hub](https://lxpack.readthedocs.io/en/latest/guides/lessonkit/)
- [LessonKit packages reference](https://lxpack.readthedocs.io/en/latest/reference/lessonkit-packages/)
- [LessonKit repository](https://github.com/eddiethedean/lessonkit) · [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)
