#!/bin/bash
# Production deploy for nm-ex.com (Next.js) on the shared AWS box.
#
# Pulls latest main from a bare mirror, builds a release, swaps into
# /var/www/nm-ex, restarts systemd nm-ex.service.
#
# Prerequisites:
#   - Node 20+ / npm
#   - Bare mirror at $GIT_REPO with read-only GitHub deploy key
#   - systemd unit nm-ex.service (PORT=3003)
#   - Optional env file /etc/nm-ex.env (REFRESH_SECRET, etc.)

set -euo pipefail

GIT_REPO="${GIT_REPO:-/home/ubuntu/git/nm-ex.git}"
SITE_DIR="${SITE_DIR:-/var/www/nm-ex}"
RELEASES_DIR="${RELEASES_DIR:-/var/www/nm-ex-releases}"
DEPLOY_STATE="${SITE_DIR}/.deployed-commit"
SERVICE_NAME="${SERVICE_NAME:-nm-ex.service}"
KEEP_RELEASES="${KEEP_RELEASES:-3}"
DATA_DIR="${DATA_DIR:-/var/lib/nm-ex}"

export GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -i $HOME/.ssh/nm_ex_deploy -o IdentitiesOnly=yes}"

echo "==> Fetching latest refs"
git --git-dir="$GIT_REPO" fetch origin '+refs/heads/*:refs/remotes/origin/*'

TARGET_REF=""
for ref in refs/remotes/origin/main refs/remotes/origin/master; do
  if git --git-dir="$GIT_REPO" show-ref --verify --quiet "$ref"; then
    TARGET_REF="$ref"
    break
  fi
done
if [ -z "$TARGET_REF" ]; then
  echo "No origin/main or origin/master in $GIT_REPO" >&2
  exit 1
fi

NEW_COMMIT="$(git --git-dir="$GIT_REPO" rev-parse "$TARGET_REF")"
OLD_COMMIT=""
if [ -f "$DEPLOY_STATE" ]; then
  OLD_COMMIT="$(cat "$DEPLOY_STATE")"
fi

FORCE="${FORCE:-0}"
if [ "$FORCE" != "1" ] && [ -n "$OLD_COMMIT" ] && [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
  echo "==> Already deployed $NEW_COMMIT; skipping."
  exit 0
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}-${NEW_COMMIT:0:7}"

echo "==> Building release $RELEASE_DIR"
sudo mkdir -p "$RELEASES_DIR" "$DATA_DIR"
sudo chown ubuntu:ubuntu "$RELEASES_DIR"
sudo chown www-data:www-data "$DATA_DIR"
mkdir -p "$RELEASE_DIR"
git --work-tree="$RELEASE_DIR" --git-dir="$GIT_REPO" checkout -f "$NEW_COMMIT" .

cd "$RELEASE_DIR"
export CI=1

if [ -f /etc/nm-ex.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /etc/nm-ex.env
  set +a
fi

echo "==> Installing dependencies"
npm ci --include=dev --no-audit --no-fund

echo "==> Building Next.js"
NODE_ENV=production npm run build

# Persist spot board data outside the release tree
mkdir -p "$RELEASE_DIR/data"
if [ -f "$DATA_DIR/spot.json" ]; then
  cp "$DATA_DIR/spot.json" "$RELEASE_DIR/data/spot.json"
elif [ -f "$SITE_DIR/data/spot.json" ]; then
  cp "$SITE_DIR/data/spot.json" "$RELEASE_DIR/data/spot.json"
  sudo cp "$SITE_DIR/data/spot.json" "$DATA_DIR/spot.json"
  sudo chown www-data:www-data "$DATA_DIR/spot.json"
fi

echo "==> Swapping into $SITE_DIR"
sudo mkdir -p "$SITE_DIR"
sudo rsync -a --delete \
  --exclude '.next/cache' \
  "$RELEASE_DIR"/ "$SITE_DIR"/

# Keep writable data dir and symlink/copy into site for the running app
sudo mkdir -p "$SITE_DIR/data"
if [ -f "$DATA_DIR/spot.json" ]; then
  sudo cp "$DATA_DIR/spot.json" "$SITE_DIR/data/spot.json"
fi
sudo chown -R www-data:www-data "$SITE_DIR"
sudo chown -R www-data:www-data "$DATA_DIR"

echo "$NEW_COMMIT" | sudo tee "$DEPLOY_STATE" >/dev/null
sudo chown www-data:www-data "$DEPLOY_STATE"

echo "==> Restarting $SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sleep 2
sudo systemctl --no-pager --lines=15 status "$SERVICE_NAME" || true

echo "==> Pruning old releases (keeping last $KEEP_RELEASES)"
ls -1dt "$RELEASES_DIR"/*/ 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "==> Deployed nm-ex commit $NEW_COMMIT to $SITE_DIR"
