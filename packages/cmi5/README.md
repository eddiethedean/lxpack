# @lxpack/cmi5

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/cmi5)](https://www.npmjs.com/package/@lxpack/cmi5)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

cmi5 manifest generation for LXPack courses: one assignable unit per course, blocks per lesson/assessment, `moveOn` rules.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/) · [Tracking and completion](https://lxpack.readthedocs.io/en/latest/reference/tracking-and-completion/) · [course.yaml — tracking.xapi](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/).

Packaging (ZIP/dir) is handled by [`@lxpack/scorm`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) via `lxpack build --target cmi5`. See [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/).

| Related | Package |
|---------|---------|
| xAPI statements | [`@lxpack/xapi`](https://github.com/eddiethedean/lxpack/blob/main/packages/xapi/README.md) |
| CLI build | [`@lxpack/cli`](https://github.com/eddiethedean/lxpack/blob/main/packages/cli/README.md) |

Example course: [examples/cmi5-demo](https://github.com/eddiethedean/lxpack/tree/main/examples/cmi5-demo) · [example README](https://github.com/eddiethedean/lxpack/blob/main/examples/cmi5-demo/README.md).

## Install

```bash
npm install @lxpack/cmi5
```

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/cmi5 build
pnpm --filter @lxpack/cmi5 test
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/)
- [Technical specification](https://lxpack.readthedocs.io/en/latest/developer/SPEC/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0
