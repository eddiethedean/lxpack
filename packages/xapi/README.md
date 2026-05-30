# @lxpack/xapi

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/xapi)](https://www.npmjs.com/package/@lxpack/xapi)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

xAPI 1.0.3 helpers for LXPack: statement types, ADL verb builders, cmi5/xAPI launch param parsing, LRS transport, and Tin Can `tincan.xml` generation.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/) · [Tracking and completion](https://lxpack.readthedocs.io/en/latest/reference/tracking-and-completion/) · [course.yaml — tracking.xapi](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/).

| Related | Package |
|---------|---------|
| CLI build | [`@lxpack/cli`](https://github.com/eddiethedean/lxpack/blob/main/packages/cli/README.md) (`lxpack build --target xapi`) |
| Packaging | [`@lxpack/scorm`](https://github.com/eddiethedean/lxpack/blob/main/packages/scorm/README.md) |
| Runtime analytics | [`@lxpack/runtime`](https://github.com/eddiethedean/lxpack/blob/main/packages/runtime/README.md) |
| cmi5 manifests | [`@lxpack/cmi5`](https://github.com/eddiethedean/lxpack/blob/main/packages/cmi5/README.md) |

Example course: [examples/xapi-awareness](https://github.com/eddiethedean/lxpack/tree/main/examples/xapi-awareness) · [example README](https://github.com/eddiethedean/lxpack/blob/main/examples/xapi-awareness/README.md).

## Install

```bash
npm install @lxpack/xapi
```

## cmi5 fetch bootstrap

When a cmi5 launch URL includes `fetch=...`, call `bootstrapCmi5LaunchParams()` (or `fetchCmi5AuthToken()`) before sending statements. The AU must **POST** to the fetch URL (GET is not allowed per the cmi5 spec). The JSON response must include `auth-token`, which is sent as the xAPI `Authorization` header on subsequent LRS requests. Tokens are cached in `sessionStorage` keyed by fetch URL to survive page refresh without re-posting.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/xapi build
pnpm --filter @lxpack/xapi test
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/)
- [Technical specification](https://lxpack.readthedocs.io/en/latest/developer/SPEC/)
- [Changelog](https://lxpack.readthedocs.io/en/latest/project/changelog/)

## License

Apache-2.0
