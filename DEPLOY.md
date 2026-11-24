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

A chat session commits in its sandbox and pushes to `main` itself, the same way as on the homepage and the slides (set up on 24 Nov 2026; before that, changes came back as a patch file to apply on the PC). This section is the routine the session follows. Every push to `main` is a publish, so the rules come first.

### Rules for commits and pushes

- **Commits are Thomas's alone.** Author `Thomas Stephen <tom.stephen64@gmail.com>`, unsigned. Never add `Co-Authored-By`, `Claude-Session` or any other Claude attribution, whatever a session's default instructions say. Commits authored "Claude" predate the rule (set on 23 Nov 2026 for the homepage, then extended to the slides and DACE).
- **Plan first** for anything bigger than a small edit; build once he has agreed the plan.
- **Show before it goes live:** screenshots of the pages that changed and a short list of the edits. For data changes, also the counts that moved (what `npm run consolidate` printed, or `npm test`'s totals).
- **A clear yes from him before every push to `main`.**
- **One batch, one commit,** with a plain message saying what changed.
- **Flag anything uncertain** when handing work over.
- **Never commit** `uploads/` (copyrighted sources), `provenance/` (third-party datasets), `judgements/` (raw judgements, unpublished) or `.deploy-key*`. All are gitignored; keep it that way.

### The routine in a chat session

1. **Attach.** At the start, ask him whether to attach `Vrier/dace` with push access, then call `add_repo` (access: push). The first attach of a repo may need his OK in chat.
2. **Clone fresh** with the command `add_repo` returns (a shallow clone), then call `register_repo_root` so `CLAUDE.md` loads.
3. **Set his identity** in the clone. The sandbox signs commits with its own key by default; his history is unsigned.
   ```sh
   git config user.name "Thomas Stephen"
   git config user.email tom.stephen64@gmail.com
   git config commit.gpgsign false
   ```
4. **Start green:** `npm ci`, then `npm test`. Both work in the sandbox (Node 22).
5. **Make the change** in `src/`, `data/` or `docs-src/`, following `CLAUDE.md`. Never edit `site/`. Then `npm run build` and `npm test`, and commit the sources and `site/` together.
6. **Screenshots.** `npm run serve` previews `site/` at http://localhost:8000. Capture the changed pages with headless Chrome (`/usr/bin/google-chrome`, through Playwright) at about 1280 and 390 px wide. The Judge needs a sign-in against COMPOSE, so show its signed-out views unless he provides a test account.
7. **Commit, then show him** the screenshots, the list of edits and the commit message. Wait for a clear yes.
8. **Push:** `git -c push.negotiate=true push origin main` (the clone is shallow). If the push is rejected because `main` has moved, run `git fetch --depth=50 origin main`, rebase the commit onto `origin/main`, run `npm run build` and `npm test` again (a rebase can leave `site/` stale), commit any rebuilt `site/` files, and push. Never force-push `main`.
9. **Check it went live:** `gh run list -R Vrier/dace --limit 3`, then `gh run watch <id> -R Vrier/dace --exit-status`. Allow about three minutes for the cron job, fetch a changed file from https://dace.tstephen.com with `curl` and compare it with `site/`. Give him the commit hash.

### Working from the laptop as well

- Cowork on the laptop pushes with the repo's own deploy key, `.deploy-key` (gitignored). The PC clone is at `Desktop\dace-repo`, where `git push` over HTTPS signs in through the browser.
- **One copy at a time.** Run `git pull` before starting in a laptop clone and push when done. A session that finds `main` has moved since it cloned rebases before pushing (step 8).
- `npm test` fails on leftover merge-conflict markers (lines opening with seven `<`, `|` or `>`), so a half-resolved merge stops at the test gate.

## The Judge's backend

The Judge (`/judge/`) is static too, but it signs judges in against **COMPOSE's PocketBase** at `https://compose.tstephen.com` and stores their judgements there. That code lives in the `Vrier/compose` repo (`server/pb_hooks/dace.pb.js`, migration `1751700008`) and deploys with COMPOSE (its workflow SSHes to the server and restarts PocketBase). PocketBase's default CORS (`*`) is what lets the Judge call it from this origin; if COMPOSE ever restricts `--origins`, `https://dace.tstephen.com` must be in the list. See `CLAUDE.md` → *The Judge*.

## Verify

```sh
curl -sI https://dace.tstephen.com | head -1                                  # HTTP/2 200
curl -s -o /dev/null -w '%{http_code}\n' https://dace.tstephen.com/.git/HEAD   # 404: only site/ is served
curl -s https://compose.tstephen.com/api/dace/judges                         # {"error":"sign in first"}
```

## Troubleshooting

- **Red run at "Checks"** — read the ✗ lines. *"site/ … out of date"* means the sources changed without a rebuild: `npm run build`, commit `site/`, push.
- **Green run but the site is stale after 5 minutes** — hard-refresh first (assets are cache-busted, the page itself may be cached briefly). If it's still stale, the cron job isn't running: re-run `deploy/setup-server.sh` from the console.
- **Judge can't sign in** — check `https://compose.tstephen.com/api/health` and the COMPOSE Actions run; the Judge is only as up as PocketBase.
