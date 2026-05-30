# @lxpack/spa-bridge

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/spa-bridge)](https://www.npmjs.com/package/@lxpack/spa-bridge)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Typed parent/child SDK for LXPack SPA lessons (`window.parent.lxpackBridge.v1`).

## Install

```bash
npm install @lxpack/spa-bridge
```

## Usage (SPA child)

```ts
import { getLxpackBridge } from "@lxpack/spa-bridge";

const bridge = getLxpackBridge();
bridge?.completeLesson("my_spa_lesson");
bridge?.submitAssessment({ id: "quiz", score: 0.9, maxScore: 10 });
bridge?.track({ type: "interaction", id: "my_spa_lesson", data: { done: true } });
```

See [SPA bridge reference](https://lxpack.readthedocs.io/en/latest/reference/spa-bridge/) and [API stability](https://lxpack.readthedocs.io/en/latest/developer/api-stability/).
