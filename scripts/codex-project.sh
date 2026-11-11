#!/usr/bin/env bash
set -euo pipefail
PROOFWALL_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROOFWALL_REPO_DIR"
export PATH="$PROOFWALL_REPO_DIR/node_modules/.bin:$PATH"
node scripts/process-guard.mjs check-config
# The local definitions are reviewed repository code, checked before this launch.
# Per-invocation automation mode; does not alter global hook trust or approvals.
exec node scripts/codex-project.mjs "$@"
