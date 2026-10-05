# DEPLOY.md — one-time setup for dace.tstephen.com

This is the **static-project recipe** used for www.tstephen.com and slides.tstephen.com: Caddy serves files straight from a clone on the VPS, and deploying is a `git fetch`/`reset` triggered by GitHub Actions. The only difference is that this repo has a build step — but its output, `site/`, is committed, so the server never builds anything. Caddy serves **only `site/`**, so the rest of the repo (and `.git`) is never public.

Do these in order. The first Actions run will fail at *Update served files* if it runs before step 3 — re-run it from the Actions tab once the server is ready.

## 1. GitHub

1. Create the repository (suggested: `Vrier/dace`). **Public** matches compose and slides, and lets the server fetch without credentials. **Private** works too — see the private-repo variant in step 3.
2. *Settings → Secrets and variables → Actions → New repository secret*: `DEPLOY_SSH_KEY`, with the **same base64 value as the slides repo's secret** (the gha-slides key for `compose@167.233.233.109`). It's a server credential, so sharing it across repos is fine.
3. A write deploy key so Cowork can push (GitHub deploy keys are unique per repo). In the repo folder:

   ```sh
   ssh-keygen -t ed25519 -f .deploy-key -C "cowork-dace"     # press Enter twice: no passphrase
   ```

   Add `.deploy-key.pub` under *Settings → Deploy keys*, tick **Allow write access**, then:

   ```sh
   git config core.sshCommand "ssh -i .deploy-key -o IdentitiesOnly=yes"
   ```

   `.deploy-key` is gitignored — never commit it.

## 2. DNS (Porkbun) — before the Caddy block

Add an A record: `dace` → `167.233.233.109`. Caddy requests the TLS certificate on the first request to the new site block; if the record isn't live yet, issuance fails.

## 3. VPS (as root)

**Public repo:**

```sh
git clone https://github.com/Vrier/dace.git /srv/dace
chown -R compose:compose /srv/dace
```

**Private repo:** the server needs its own read-only key to fetch.

```sh
sudo -u compose ssh-keygen -t ed25519 -N '' -f ~compose/.ssh/dace_read -C dace-read
cat ~compose/.ssh/dace_read.pub     # add on GitHub: Settings → Deploy keys (read-only)
sudo -u compose tee -a ~compose/.ssh/config >/dev/null <<'CFG'
Host github-dace
  HostName github.com
  User git
  IdentityFile ~/.ssh/dace_read
  IdentitiesOnly yes
CFG
sudo -u compose sh -c 'ssh-keyscan github.com >> ~/.ssh/known_hosts'
install -d -o compose -g compose /srv/dace
sudo -u compose git clone github-dace:Vrier/dace.git /srv/dace
```

Then append to `/etc/caddy/Caddyfile` and reload:

```
dace.tstephen.com {
	root * /srv/dace/site
	file_server
	encode gzip
}
```

```sh
systemctl reload caddy
```

## 4. Verify

Push a commit (or re-run the workflow), watch it go green under **Actions**, then:

```sh
curl -sI https://dace.tstephen.com | head -1                                  # HTTP/2 200
curl -s -o /dev/null -w '%{http_code}\n' https://dace.tstephen.com/.git/HEAD   # 404: only site/ is served
```

and open https://dace.tstephen.com and https://dace.tstephen.com/judge/.

## 5. Link it from www.tstephen.com

In the site repo (`Vrier/vrier.github.io`, `index.html`), turn the DACE research card ("In development · Online resource") into a link to https://dace.tstephen.com, like COMPOSE's "Full version ↗". Pushing deploys www.

## 6. Server housekeeping (found while setting this up)

- **www and slides serve their whole clone**, `.git` included (`https://www.tstephen.com/.git/HEAD` and `https://slides.tstephen.com/.git/HEAD` return 200). Low stakes while both repos are public, but worth closing — in both site blocks replace `file_server` with:

  ```
  	file_server {
  		hide .git .github
  	}
  ```

- **`compose/deploy/Caddyfile` has no slides block.** COMPOSE's DEPLOY.md (§9) says to copy that file over `/etc/caddy/Caddyfile` after changes; as written, that would take slides — and now DACE — offline. Add both blocks to that copy so it matches the live file.

## Ongoing workflow

Edit in Cowork / Claude Code → `npm run build` → `npm test` → commit (sources + `site/`) → push to `main` → Actions deploys. Nothing to restart.

## Troubleshooting

- **Red run at "Checks"** — read the ✗ lines. *"site/ … out of date"* means the sources changed without a rebuild: run `npm run build` and commit `site/`.
- **Red run at "Set up SSH key" / "Update served files"** — almost always the `DEPLOY_SSH_KEY` secret, or `/srv/dace` doesn't exist yet (step 3).
- **Site looks stale after a green run** — hard-refresh; assets are cache-busted by content hash, but the page itself may be cached briefly.
- **Certificate errors on first visit** — the DNS record wasn't live when Caddy first tried; check `journalctl -u caddy` and reload.
