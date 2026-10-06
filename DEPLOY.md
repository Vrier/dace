# DEPLOY.md — how dace.tstephen.com is served and updated

Caddy on the VPS (`167.233.233.109`, the server that also runs COMPOSE and www/slides) serves **only `site/`** from a clone of this repo at `/srv/dace`. The site is static and `site/` is committed, so the server never builds anything and never needs a GitHub credential.

## How a push reaches the site

1. You push to `main`.
2. GitHub Actions (`.github/workflows/deploy.yml`) runs `npm ci` and `npm test` (the same checks as locally, including "site/ matches the sources").
3. If green, the workflow force-moves branch **`live`** to that commit. Nothing else happens on GitHub's side; there is no SSH key or secret.
4. A cron job on the VPS (`/etc/cron.d/dace`, installed by `deploy/setup-server.sh`) runs every 2 minutes as the `compose` user: `git fetch origin live && git reset --hard FETCH_HEAD` in `/srv/dace`.
5. About 3 minutes after the push, the change is live. Check by fetching a changed file from `https://dace.tstephen.com/…` and comparing it with `site/`.

**Never push to `live` yourself** — the workflow owns it, and the test gate is the only thing standing between a broken `site/` and the server. If a run is red, fix `main` and push again.

## One-time server setup (done)

`deploy/setup-server.sh` does everything the server needs: clone to `/srv/dace`, add the `dace.tstephen.com` block to `/etc/caddy/Caddyfile` (with a safe rollback if Caddy refuses the reload), install the cron job, and wait for the certificate. It is safe to re-run. Run it as root from the Hetzner web console — the two lines at the top of the script use no capitals or shifted symbols, because the console drops those:

```
curl -f --location -o /root/dace-setup.sh raw.githubusercontent.com/vrier/dace/main/deploy/setup-server.sh
bash /root/dace-setup.sh
```

Anything else that ever has to run on the server goes the same way: a script under `deploy/` fetched with `curl`.

DNS (Porkbun): A record `dace` → `167.233.233.109`, in place before Caddy first serves the host, or certificate issuance fails.

## Pushing from a Claude session

Claude's Linux sandbox can't open SSH connections, so deploy keys don't help it push. Changes made there come back as a patch file (`git format-patch`) that you apply on your PC:

```powershell
cd "$env:USERPROFILE\Desktop\dace-repo"
git pull
git am "$env:USERPROFILE\Downloads\<name>.patch"
git log --oneline -1
git push
```

`git push` over HTTPS signs in through the browser. If `git am` fails, `git am --abort` and send the output back.

## The Judge's backend

The Judge (`/judge/`) is static too, but it signs judges in against **COMPOSE's PocketBase** at `https://compose.tstephen.com` and stores their judgements there. That code lives in the `Vrier/compose` repo (`server/pb_hooks/dace.pb.js`, migration `1751700008`) and deploys with COMPOSE (its workflow SSHes to the server and restarts PocketBase). PocketBase's default CORS (`*`) is what lets the Judge call it from this origin; if COMPOSE ever restricts `--origins`, `https://dace.tstephen.com` must be in the list. See `CLAUDE.md` → *The Judge*.

## Verify

```sh
curl -sI https://dace.tstephen.com | head -1                                  # HTTP/2 200
curl -s -o /dev/null -w '%{http_code}\n' https://dace.tstephen.com/.git/HEAD   # 404: only site/ is served
curl -s https://compose.tstephen.com/api/dace/judges                         # {"error":"sign in first"}
```

## Server housekeeping still open

- **www and slides serve their whole clone**, `.git` included (`https://www.tstephen.com/.git/HEAD` returns 200). In both site blocks replace `file_server` with `file_server { hide .git .github }`.
- **`compose/deploy/Caddyfile` has no slides or dace block.** COMPOSE's DEPLOY.md (§9) says to copy that file over `/etc/caddy/Caddyfile` after changes; as written, that would take slides and DACE offline. Add both blocks there so it matches the live file.

## Troubleshooting

- **Red run at "Checks"** — read the ✗ lines. *"site/ … out of date"* means the sources changed without a rebuild: `npm run build`, commit `site/`, push.
- **Green run but the site is stale after 5 minutes** — hard-refresh first (assets are cache-busted, the page itself may be cached briefly). If it's still stale, the cron job isn't running: re-run `deploy/setup-server.sh` from the console.
- **Judge can't sign in** — check `https://compose.tstephen.com/api/health` and the COMPOSE Actions run; the Judge is only as up as PocketBase.
