# LessonKit SPA example

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)

Demonstrates a **`type: spa`** lesson: a folder with `index.html` (stand-in for a Vite/React build) that reports progress through `window.parent.lxpackBridge.v1`.

**Docs:** [LessonKit interoperability](https://lxpack.readthedocs.io/en/latest/guides/lessonkit-interoperability/) · [Lesson types](https://lxpack.readthedocs.io/en/latest/reference/lesson-types/).

```bash
cd examples/lessonkit-spa
lxpack validate
lxpack build --target scorm12
lxpack preview
```

SPA assets live under `spa/lessons/phishing-101/` (not under `dist/`, which is gitignored in the monorepo). In a real LessonKit workflow, point `path` at your Vite output directory instead.
