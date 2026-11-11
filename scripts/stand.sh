#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"
COMPOSE=(docker compose --project-directory "$REPO_DIR" --env-file "$REPO_DIR/.env" -f "$REPO_DIR/docker-compose.yml" -f "$REPO_DIR/compose.sslip.yml")
if [[ "${1:-}" == preflight ]]; then
  umask 077
  RESOLVED_CONFIG=$(mktemp /tmp/proofwall-compose.XXXXXX.yml)
  trap 'rm -f "$RESOLVED_CONFIG"' EXIT
  "${COMPOSE[@]}" config > "$RESOLVED_CONFIG"
  node .claude/hooks/check-ports.cjs "$RESOLVED_CONFIG"
  bash scripts/check-port-conflicts.sh "$RESOLVED_CONFIG"
else
  exec "${COMPOSE[@]}" "$@"
fi
