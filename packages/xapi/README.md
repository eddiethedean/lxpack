# @lxpack/xapi

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/xapi)](https://www.npmjs.com/package/@lxpack/xapi)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)

xAPI 1.0.3 helpers for LXPack: statement types, ADL verb builders, cmi5/xAPI launch param parsing, LRS transport, and Tin Can `tincan.xml` generation.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Export to LMS](https://lxpack.readthedocs.io/en/latest/guides/export-to-lms/) · [Tracking and completion](https://lxpack.readthedocs.io/en/latest/reference/tracking-and-completion/) · [course.yaml — tracking.xapi](https://lxpack.readthedocs.io/en/latest/reference/course-yaml/).

| Related | Package |
|---------|---------|
| CLI build | [`@lxpack/cli`](../cli/README.md) (`lxpack build --target xapi`) |
| Packaging | [`@lxpack/scorm`](../scorm/README.md) |
| Runtime analytics | [`@lxpack/runtime`](../runtime/README.md) |
| cmi5 manifests | [`@lxpack/cmi5`](../cmi5/README.md) |

Example course: [examples/xapi-awareness](https://github.com/eddiethedean/lxpack/tree/main/examples/xapi-awareness) · [example README](../../examples/xapi-awareness/README.md).

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
- [Documentation home](https://lxpack.readthedocs.io/en/latest/)
- [CLI reference](https://lxpack.readthedocs.io/en/latest/reference/cli/)
- [Technical specification](https://lxpack.readthedocs.io/en/latest/developer/SPEC/)

## License

Apache-2.0
