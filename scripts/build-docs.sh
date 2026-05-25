#!/usr/bin/env bash
# Build MkDocs site with zero Material/MkDocs warnings (see NO_MKDOCS_2_WARNING).
set -euo pipefail

cd "$(dirname "$0")/.."

export NO_MKDOCS_2_WARNING=1

if [[ "${DOCS_VERBOSE:-}" == "1" ]]; then
  exec mkdocs build --strict "$@"
fi

exec mkdocs build --strict -q "$@"
