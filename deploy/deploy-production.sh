#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/survey-app}"
BRANCH="${BRANCH:-main}"
PM2_NAME="${PM2_NAME:-survey-api-porsline-self}"
NODE_BIN_DIR="${NODE_BIN_DIR:-/root/.nvm/versions/node/v24.14.1/bin}"
BACKUP_ROOT="${BACKUP_ROOT:-/root/porsline-deploy-backups}"

export PATH="$NODE_BIN_DIR:$PATH"
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Missing git checkout at $APP_DIR" >&2
  exit 2
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Missing production environment file: $APP_DIR/.env" >&2
  exit 3
fi

for bin in git node corepack pm2 curl; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing required command: $bin" >&2; exit 4; }
done

mkdir -p "$BACKUP_ROOT"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="$BACKUP_ROOT/$stamp"
mkdir -p "$backup_dir"

cd "$APP_DIR"
git rev-parse HEAD > "$backup_dir/previous-commit.txt" 2>/dev/null || true
for path in artifacts/api-server/dist artifacts/survey-app/dist; do
  if [[ -d "$path" ]]; then
    tar -C "$APP_DIR" -czf "$backup_dir/$(echo "$path" | tr '/' '-').tgz" "$path"
  fi
done

rollback() {
  rc=$?
  if [[ $rc -ne 0 ]]; then
    echo "Deployment failed (exit $rc). Existing process was not intentionally removed. Backup: $backup_dir" >&2
  fi
  exit $rc
}
trap rollback EXIT

git -c http.proxy= -c https.proxy= fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

corepack pnpm install --frozen-lockfile

set -a
# shellcheck disable=SC1091
source ./.env
set +a

corepack pnpm --filter @workspace/db run push
corepack pnpm --filter @workspace/api-server run build
PORT=5173 BASE_PATH=/ NODE_ENV=production corepack pnpm --filter @workspace/survey-app run build

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start artifacts/api-server/dist/index.mjs --name "$PM2_NAME" --cwd "$APP_DIR" --update-env
fi
pm2 save

for i in 1 2 3 4 5; do
  if curl -fsS --max-time 5 http://127.0.0.1:8080/api/healthz >/dev/null; then
    echo "Porsline API health check: OK"
    trap - EXIT
    exit 0
  fi
  sleep 2
done

echo "API health check failed after deployment" >&2
exit 5
