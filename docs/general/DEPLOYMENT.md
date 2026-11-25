# Deployment

History Journeys is a static web application: `npm run build` writes everything it needs (pages, scripts, the
content database, map data, portraits) to `dist/`. No server code and no secrets are involved; the application
routes with the URL hash, so every request is a real file.

## Environments and branches

```
release/test ──(test environment: the mini PC)──► main ──(Coolify auto-deploy)──► production
```

| Environment | Branch | Where | How it updates |
|-------------|--------|-------|----------------|
| Test | `release/test` | the mini PC, `vite preview` on `127.0.0.1:4185`, tailnet only through `tailscale serve` | a timer checks the branch every two minutes and rebuilds when it moved |
| Production | `main` (`https://tarih.melihcelenk.com`) | Coolify application on the Hetzner server, behind Traefik and Cloudflare | Coolify builds the `Dockerfile` on every push to `main` |

Going live is a merge of `release/test` into `main` and a push.

## Production

- `Dockerfile`: a Node stage runs `npm ci` and `npm run build` (the content database is built by `prebuild`), and
  an nginx stage serves `dist/` with `deploy/nginx.conf`.
- Caching (`deploy/nginx.conf`):
  - `assets/` holds files named by their content hash. They are immutable for a year, and a missing one is a plain
    404.
  - The page, the service worker and the manifest are `no-cache`, so a new version reaches visitors at once.
  - The content database, map data and portraits keep their names between versions. They are revalidated by ETag.
- Coolify application settings:
  - Source: this GitHub repository, branch `main`, build pack *Dockerfile*, port 80.
  - Domain: `https://tarih.melihcelenk.com`.
  - Auto-deploy on push needs the repository in the Coolify GitHub App's list of repositories.
- DNS: a proxied (orange cloud) Cloudflare record for the subdomain pointing at the server. The server accepts web
  traffic only from Cloudflare.

## Test environment (mini PC)

One-time setup:

```bash
git -C ~/Kodlar/HistoryJourneys fetch origin
git -C ~/Kodlar/HistoryJourneys checkout release/test
~/Kodlar/HistoryJourneys/scripts/test-env/update.sh --force
cp ~/Kodlar/HistoryJourneys/scripts/test-env/hj-test*.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now hj-test.service hj-test-update.timer
tailscale serve --bg --https=8447 4185
```

- Address: `https://melihcelenk-msi-mini.tailea0055.ts.net:8447` (tailnet only).
- Logs: `journalctl --user -u hj-test-update -n 20` (builds), `journalctl --user -u hj-test -f` (server).
- `scripts/test-env/update.sh` builds into `dist.next/` and swaps it in. A failed build leaves the last good build
  served.

## The 3D scene

The 3D scene is a page of its own, `sahne.html`, listed in Vite's build input (`build.rollupOptions.input`) next to
`index.html`. It is served from the same site under its own path and needs no port of its own; only that page loads
the 3D engine.
