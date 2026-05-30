# @lxpack/tracking-schema

[![Documentation](https://readthedocs.org/projects/lxpack/badge/?version=latest)](https://lxpack.readthedocs.io/en/latest/?badge=latest)
[![npm version](https://img.shields.io/npm/v/@lxpack/tracking-schema)](https://www.npmjs.com/package/@lxpack/tracking-schema)
[![CI](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lxpack/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lxpack)](https://github.com/eddiethedean/lxpack/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%20%7C%2020-brightgreen)](https://nodejs.org/)

Canonical **tracking event types** for LXPack and adapters — shared between the browser runtime, xAPI reporters, and external tooling so `track()` payloads stay consistent.

Part of [LXPack](https://github.com/eddiethedean/lxpack). **Docs:** [Tracking and completion](https://lxpack.readthedocs.io/en/latest/reference/tracking-and-completion/).

| Related | Package |
|---------|---------|
| Runtime `track()` | [`@lxpack/runtime`](../runtime/README.md) |
| xAPI transport | [`@lxpack/xapi`](../xapi/README.md) |

## Install

```bash
npm install @lxpack/tracking-schema
```

Requires Node.js 18 or 20 (18+) for the build toolchain. The package is dependency-free at runtime.

## Usage

```ts
import {
  TRACK_EVENT_INTERACTION,
  TRACK_EVENT_SIMULATION,
  TRACK_EVENT_ASSESSMENT,
  TRACK_EVENT_XAPI_VERB,
  type TrackEventType,
} from "@lxpack/tracking-schema";

const eventType: TrackEventType = TRACK_EVENT_INTERACTION;
const verb = TRACK_EVENT_XAPI_VERB[eventType]; // "interacted"
```

### Event types

| Constant | `track({ type })` value | xAPI verb (via `TRACK_EVENT_XAPI_VERB`) |
|----------|------------------------|----------------------------------------|
| `TRACK_EVENT_INTERACTION` | `interaction` | `interacted` |
| `TRACK_EVENT_SIMULATION` | `simulation` | `interacted` |
| `TRACK_EVENT_ASSESSMENT` | `assessment` | `answered` |

Lesson navigation and completion are emitted by the runtime analytics layer, not through these `track()` types.

## Development

From the monorepo root:

```bash
pnpm --filter @lxpack/tracking-schema build
pnpm --filter @lxpack/tracking-schema test
pnpm --filter @lxpack/tracking-schema typecheck
```

## Links

- [LXPack repository](https://github.com/eddiethedean/lxpack)
- [Documentation](https://lxpack.readthedocs.io/en/latest/)
- [Changelog](https://github.com/eddiethedean/lxpack/blob/main/CHANGELOG.md)

## License

Apache-2.0
