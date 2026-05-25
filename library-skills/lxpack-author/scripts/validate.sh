#!/usr/bin/env bash
# Run lxpack validate from the course root (directory containing course.yaml).
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
  echo "error: no course.yaml found (walk up from $(pwd))" >&2
  exit 1
fi

TARGET="${1:-}"
if [[ -n "$TARGET" ]]; then
  exec lxpack validate --target "$TARGET"
fi
exec lxpack validate
