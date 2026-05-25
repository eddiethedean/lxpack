#!/usr/bin/env bash
# Run lxpack preview from the course root.
set -euo pipefail

ROOT="$(pwd)"
while [[ "$ROOT" != "/" ]]; do
  if [[ -f "$ROOT/course.yaml" ]]; then
    cd "$ROOT"
    break
  fi
  ROOT="$(dirname "$ROOT")"
done

if [[ ! -f course.yaml ]]; then
  echo "error: no course.yaml found" >&2
  exit 1
fi

exec lxpack preview "$@"
