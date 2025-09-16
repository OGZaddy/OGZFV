#!/usr/bin/env bash
set -euo pipefail

# Build a clean distributable without secrets or heavy artifacts

APP_NAME="ogzprime"
STAMP="$(date +%Y%m%d-%H%M%S)"
DIST_DIR="dist/${APP_NAME}-${STAMP}"

echo "➡️  Creating ${DIST_DIR}"
mkdir -p "${DIST_DIR}"

RSYNC_EXCLUDES=(
  --exclude '.git/'
  --exclude 'node_modules/'
  --exclude '.env'
  --exclude 'logs/'
  --exclude 'data/*.json'
  --exclude 'ssl/'
  --exclude 'knowledge/'
  --exclude 'memory/*.json'
  --exclude 'ComfyUI/'
  --exclude '*.tar.gz'
  --exclude 'dist/'
)

rsync -a "${RSYNC_EXCLUDES[@]}" ./ "${DIST_DIR}/"

# Ensure template exists
cp -n ./.env.example "${DIST_DIR}/.env.example" || true

TAR="${DIST_DIR}.tar.gz"
tar -czf "${TAR}" -C dist "$(basename "${DIST_DIR}")"

echo "✅ Package created: ${TAR}"

