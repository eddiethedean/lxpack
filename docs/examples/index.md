# Example courses

Clone the [LXPack repository](https://github.com/eddiethedean/lxpack) and run commands from each example folder.

## LXPack examples

| Example | Demonstrates | Path |
|---------|----------------|------|
| **Security awareness** | Linear course, SCORM 1.2 | [`examples/security-awareness`](https://github.com/eddiethedean/lxpack/tree/main/examples/security-awareness) |
| **Branching demo** | Variables, flow, components, SCORM 2004 | [`examples/branching-demo`](https://github.com/eddiethedean/lxpack/tree/main/examples/branching-demo) |
| **xAPI awareness** | xAPI + `tracking.xapi` | [`examples/xapi-awareness`](https://github.com/eddiethedean/lxpack/tree/main/examples/xapi-awareness) |
| **cmi5 demo** | cmi5 export | [`examples/cmi5-demo`](https://github.com/eddiethedean/lxpack/tree/main/examples/cmi5-demo) |
| **LessonKit SPA** | SPA lesson + bridge API | [`examples/lessonkit-spa`](https://github.com/eddiethedean/lxpack/tree/main/examples/lessonkit-spa) |

```bash
cd examples/security-awareness
lxpack validate
lxpack preview
lxpack build --target scorm12
```

See [Build overview](../guides/build-overview.md) for walkthroughs.

## LessonKit golden example

Full React + LMS packaging workflow:

| Example | Demonstrates |
|---------|----------------|
| [**lxpack-golden**](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) | `@lessonkit/lxpack`, `lessonkit package`, SCORM 12 export |

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit && npm ci && npm run build
npm -w lessonkit-example-lxpack-golden run package:scorm12
```

See [LessonKit & React](../guides/lessonkit/index.md).
