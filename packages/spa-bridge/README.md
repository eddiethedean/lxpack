# @lxpack/spa-bridge

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
