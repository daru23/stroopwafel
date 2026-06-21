# Deployment

The app is deployed with Ansible + Docker Compose. The playbook assumes Docker and the Compose plugin are already installed on the target server — it will not install them.

## Prerequisites

- Ansible ≥ 2.14 with the `community.docker` collection:
  ```
  ansible-galaxy collection install community.docker
  ```
- Docker + Docker Compose plugin on the target server
- A user on the server (e.g. `deploy`) who:
  - You can SSH in as with a key
  - Is in the `docker` group (so the playbook can run `docker compose` unprivileged)
  - **Owns** the `tracker_dir` path (default `/home/deploy/dutch-tracker`)
  - Has `sudo` if `tracker_dir` is anywhere root-owned (e.g. `/opt/…`) or if you use the host-Caddy vhost task
- Images pushed to a registry (see [CI workflow](../.github/workflows/build.yml) or push manually — see "Building images" below)

## Setup

```bash
cd deploy/ansible

# Copy and fill in inventory
cp inventory.example.ini inventory.ini
$EDITOR inventory.ini

# Copy and fill in variables (store tracker_api_token in Vault)
cp group_vars/all.yml.example group_vars/all.yml
$EDITOR group_vars/all.yml
```

Generate a token:
```bash
openssl rand -hex 32
```

Encrypt it with Vault (paste the result into `group_vars/all.yml`):
```bash
ansible-vault encrypt_string 'YOUR_TOKEN' --name 'tracker_api_token'
```

### Variables you'll set in `group_vars/all.yml`

| Variable | Default | Notes |
|---|---|---|
| `tracker_web_image` | `ghcr.io/OWNER/dutch-tracker-web` | Replace `OWNER` with your lowercase GitHub username |
| `tracker_api_image` | `ghcr.io/OWNER/dutch-tracker-api` | Same |
| `tracker_tag` | `latest` | Or a specific `v1.0.0`-style tag |
| `tracker_host_port` | `8090` | Bound to `127.0.0.1` only — host Caddy proxies to this |
| `tracker_dir` | `/home/deploy/dutch-tracker` | Must be writable by the SSH user |
| `tracker_domain` | (none — required) | FQDN used in the Caddy vhost, e.g. `app.example.com` |
| `tracker_api_token` | (vault-encrypted) | Shared secret for `Authorization: Bearer …` |

## Building images

Build for the server's architecture (almost always `linux/amd64`) and push to GHCR:

```bash
# 1. Log in to GHCR (one-time). Needs a GitHub PAT with `write:packages`:
#    https://github.com/settings/tokens/new?scopes=write:packages,read:packages
echo 'YOUR_PAT' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 2. Build & push (run from the repo root, not deploy/)
docker buildx build --platform linux/amd64 --target web \
  -t ghcr.io/YOUR_GITHUB_USERNAME/dutch-tracker-web:latest --push .
docker buildx build --platform linux/amd64 --target api \
  -t ghcr.io/YOUR_GITHUB_USERNAME/dutch-tracker-api:latest --push .
```

If the server has no GHCR credentials, **make the packages public** after the first push:

- `https://github.com/users/YOUR_GITHUB_USERNAME/packages/container/dutch-tracker-web/settings`
- `https://github.com/users/YOUR_GITHUB_USERNAME/packages/container/dutch-tracker-api/settings`

Scroll to "Danger Zone" → "Change visibility" → Public.

Alternatively, keep them private and have the server log in via the playbook by setting `tracker_registry_user` and `tracker_registry_token` in `group_vars/all.yml`.

## DNS

Add an A record for `tracker_domain` pointing at your server **before** running the playbook — Caddy needs Let's Encrypt's HTTP-01 challenge to succeed on the first hit. If you're using Cloudflare, set the record to **DNS only (grey cloud)** so Caddy can do its own TLS.

Verify:
```bash
dig +short tracker_domain   # should print your server IP
```

## Deploy

Dry-run first:
```bash
ansible-playbook playbook.yml --check --diff --ask-vault-pass
```

Apply:
```bash
ansible-playbook playbook.yml --ask-vault-pass
```

(Add `--ask-become-pass` if the SSH user's sudo isn't passwordless and you use the host-Caddy task.)

## Verify

```bash
# Health (via the loopback port, as the playbook does)
ssh USER@SERVER 'curl -s http://127.0.0.1:8090/api/health'
# → {"ok":true}

# Through Caddy + TLS
curl https://YOUR_DOMAIN/api/health
# → {"ok":true}

# Authenticated read
curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_DOMAIN/api/state
```

Then open `https://YOUR_DOMAIN/` in a browser and paste the token in the Sync gate.

## Re-deploy after image update

The playbook always pulls latest images (`pull: always`). To ship a code change:

```bash
# 1. Build & push the updated images (run in the repo root)
docker buildx build --platform linux/amd64 --target web \
  -t ghcr.io/YOUR_USERNAME/dutch-tracker-web:latest --push .
docker buildx build --platform linux/amd64 --target api \
  -t ghcr.io/YOUR_USERNAME/dutch-tracker-api:latest --push .

# 2. Re-run the playbook — it pulls and recreates only what changed
ansible-playbook playbook.yml --ask-vault-pass
```

Or tag a `v*` release and let the [GitHub Actions workflow](../.github/workflows/build.yml) build and push for you, then re-run the playbook.

## Backups

All app data lives in the Docker named volume `dutch-tracker_tracker-data`, mounted at `/data` inside the api container (it holds `tracker.db`).

### Snapshot the volume

```bash
ssh deploy@YOUR_SERVER 'docker run --rm \
  -v dutch-tracker_tracker-data:/data \
  -v /tmp:/backup \
  alpine tar czf /backup/tracker-$(date +%F).tar.gz -C /data .'

scp deploy@YOUR_SERVER:/tmp/tracker-*.tar.gz ./backups/
```

### Restore from a snapshot

```bash
# Push the archive back
scp ./backups/tracker-YYYY-MM-DD.tar.gz deploy@YOUR_SERVER:/tmp/

# Stop the api, restore, restart
ssh deploy@YOUR_SERVER 'cd ~/dutch-tracker && docker compose stop api && \
  docker run --rm -v dutch-tracker_tracker-data:/data -v /tmp:/backup \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/tracker-YYYY-MM-DD.tar.gz -C /data" && \
  docker compose start api'
```

### Backup via the API instead (no SSH needed)

The `/api/export` endpoint returns a portable JSON of your whole state. Easy to cron:

```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_DOMAIN/api/export > tracker-$(date +%F).json
```

Restore by `POST`ing to `/api/import` or importing in the UI.

## Multi-tenant servers (host Caddy)

If the target server already runs Caddy as a host-level reverse proxy (as set up by this playbook), each project sits behind a vhost block in `/etc/caddy/Caddyfile`:

```
project-a.example.com { reverse_proxy 127.0.0.1:8080 }
project-b.example.com { reverse_proxy 127.0.0.1:8090 }
```

Our playbook appends its vhost block (marked `# BEGIN ANSIBLE MANAGED: dutch-tracker`) and reloads Caddy via `systemctl reload caddy` — graceful reload, zero downtime for other vhosts. Other projects are isolated by hostname and port.

If you ever fully decommission this deployment, remove the managed block from the host Caddyfile so Caddy stops trying to renew the cert:

```bash
ssh deploy@YOUR_SERVER 'sudo sed -i "/# BEGIN ANSIBLE MANAGED: dutch-tracker/,/# END ANSIBLE MANAGED: dutch-tracker/d" /etc/caddy/Caddyfile && sudo systemctl reload caddy'
```

## Isolation

The stack uses a dedicated Docker Compose project (`dutch-tracker`) with its own network and named volume (`tracker-data`). Only `127.0.0.1:tracker_host_port` is published on the host (default 8090) — it's not directly reachable externally, only through the host Caddy vhost. The API container is not published at all.
