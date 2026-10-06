#!/usr/bin/env bash
# ===========================================================================
# DACE — one-time server setup. Run as root from the Hetzner web console:
#
#   curl -f --location -o /root/dace-setup.sh raw.githubusercontent.com/vrier/dace/main/deploy/setup-server.sh
#   bash /root/dace-setup.sh
#
# Those two lines use no capitals or shifted symbols, which the web console
# can drop. Safe to run again. It:
#   1. clones https://github.com/Vrier/dace into /srv/dace, owned by compose;
#   2. adds a dace.tstephen.com block to /etc/caddy/Caddyfile and reloads
#      Caddy (if the reload fails, the previous Caddyfile is put back and
#      Caddy carries on serving the old config);
#   3. installs /etc/cron.d/dace: every 2 minutes, as compose, the clone
#      moves to branch "live", which GitHub Actions updates only after
#      `npm test` passes. No SSH key or GitHub secret is involved.
# ===========================================================================
set -euo pipefail

REPO="https://github.com/Vrier/dace.git"
SITE="dace.tstephen.com"
DIR="${DACE_DIR:-/srv/dace}"
CADDYFILE="${DACE_CADDYFILE:-/etc/caddy/Caddyfile}"
CRONFILE="${DACE_CRONFILE:-/etc/cron.d/dace}"

[ "$(id -u)" -eq 0 ] || { echo "Run this as root."; exit 1; }
id compose >/dev/null 2>&1 || { echo "There is no 'compose' user on this server."; exit 1; }

echo "== 1/3  Repository -> $DIR"
if [ -d "$DIR/.git" ]; then
  echo "   already cloned"
elif [ -e "$DIR" ] && [ -n "$(ls -A "$DIR")" ]; then
  echo "   $DIR exists but isn't a clone of the repo: move it aside and run this again."
  exit 1
else
  git clone -q "$REPO" "$DIR"
  echo "   cloned"
fi
chown -R compose:compose "$DIR"

echo "== 2/3  Caddy: serve $DIR/site at https://$SITE"
BACKUP=""
if grep -q "^$SITE" "$CADDYFILE"; then
  echo "   site block already in $CADDYFILE"
else
  BACKUP="$CADDYFILE.before-dace"
  cp -a "$CADDYFILE" "$BACKUP"
  printf '\n%s {\n    root * %s/site\n    file_server\n    encode gzip\n}\n' "$SITE" "$DIR" >> "$CADDYFILE"
  echo "   added the site block (previous file saved as $BACKUP)"
fi
if systemctl reload caddy; then
  echo "   Caddy reloaded"
else
  if [ -n "$BACKUP" ]; then
    cp -a "$BACKUP" "$CADDYFILE"
    echo "   reload FAILED: previous Caddyfile restored, Caddy still serving the old config"
  fi
  journalctl -u caddy -n 20 --no-pager || true
  exit 1
fi

echo "== 3/3  Auto-update: $CRONFILE"
cat > "$CRONFILE" <<EOF
# DACE: every 2 minutes, move the served clone to branch "live" on GitHub.
# GitHub Actions moves "live" only after npm test passes. Installed by deploy/setup-server.sh.
*/2 * * * * compose cd $DIR && git fetch -q origin live 2>/dev/null && git reset -q --hard FETCH_HEAD
EOF
chmod 644 "$CRONFILE"
systemctl is-active --quiet cron && echo "   installed" || echo "   installed, but cron isn't running: start it with  systemctl enable --now cron"

echo "== Checking https://$SITE (the first certificate can take a minute)"
code=""
for _ in $(seq 1 24); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "https://$SITE/" || true)"
  [ "$code" = "200" ] && break
  sleep 5
done
if [ "$code" = "200" ]; then
  echo "   LIVE: https://$SITE"
else
  echo "   not answering yet (last status: ${code:-none}). Try it in a browser in a few minutes."
fi
