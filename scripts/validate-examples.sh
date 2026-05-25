#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${ROOT}/packages/cli/dist/cli.js"

if [[ ! -f "$CLI" ]]; then
  echo "CLI not built. Run: pnpm build" >&2
  exit 1
fi

for dir in "${ROOT}"/examples/*/; do
  name="$(basename "$dir")"
  echo "==> ${name}"
  (
    cd "$dir"
    node "$CLI" validate
    case "$name" in
      xapi-awareness)
        node "$CLI" validate --target xapi
        ;;
      cmi5-demo)
        node "$CLI" validate --target cmi5
        ;;
    esac
  )
done

echo "✓ All examples validated"
