#!/usr/bin/env bash
# Test environment: brings the checkout up to the release/test branch and rebuilds when it moved. Run by a timer;
# the build is served by `vite preview` (hj-test.service). Usage: scripts/test-env/update.sh [--force]
set -euo pipefail

readonly BRANCH="release/test"
readonly DIR="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$DIR"
git fetch --quiet origin "$BRANCH"
local_head="$(git rev-parse HEAD)"
remote_head="$(git rev-parse "origin/$BRANCH")"
if [[ "$local_head" == "$remote_head" && "${1:-}" != "--force" ]]; then
  exit 0
fi

lock_before="$(git rev-parse HEAD:package-lock.json)"
git checkout --quiet "$BRANCH"
git merge --quiet --ff-only "origin/$BRANCH"
if [[ "$lock_before" != "$(git rev-parse HEAD:package-lock.json)" || ! -d node_modules || "${1:-}" == "--force" ]]; then
  npm ci --no-audit --no-fund
fi
# Built into a new folder and swapped in, so the server never serves a half-written build.
# `npm run build` builds the content database first (prebuild), checks types, then Vite builds into dist.next.
npm run --silent build -- --outDir dist.next --emptyOutDir >/dev/null
rm -rf dist.prev
[[ -d dist ]] && mv dist dist.prev
mv dist.next dist
# The preview server reads the folder's files when it starts: restarted to serve the new build.
if systemctl --user is-active --quiet hj-test.service; then
  systemctl --user restart hj-test.service
fi
echo "$(date -Is) built $(git rev-parse --short HEAD)"
