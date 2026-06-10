# Deployment

The app is deployed with Ansible + Docker Compose. The playbook assumes Docker and the Compose plugin are already installed on the target server — it will not install them.

## Prerequisites

- Ansible ≥ 2.14 with the `community.docker` collection:
  ```
  ansible-galaxy collection install community.docker
  ```
- Docker + Docker Compose plugin on the target server
- Images pushed to a registry (see [CI workflow](../.github/workflows/build.yml) or push manually)

## Setup

```bash
cd deploy/ansible

# Copy and fill in inventory
cp inventory.example.ini inventory.ini
$EDITOR inventory.ini

# Copy and fill in variables (store tracker_api_token in Vault)
mkdir -p group_vars
cp group_vars/all.yml.example group_vars/all.yml
$EDITOR group_vars/all.yml
```

Generate a token:
```bash
openssl rand -hex 32
```

Encrypt it with Vault:
```bash
ansible-vault encrypt_string 'YOUR_TOKEN' --name 'tracker_api_token' >> group_vars/all.yml
```

## Deploy

Dry-run first:
```bash
ansible-playbook playbook.yml --check --diff
```

Apply:
```bash
ansible-playbook playbook.yml
```

With vault password:
```bash
ansible-playbook playbook.yml --ask-vault-pass
```

## Verify

```bash
curl http://YOUR_SERVER:8080/api/health
# → {"ok":true}

curl -H "Authorization: Bearer YOUR_TOKEN" http://YOUR_SERVER:8080/api/state
```

## Re-deploy after image update

The playbook always pulls latest images (`pull: always`). Running it again is idempotent — a second run reports zero changes if nothing has changed.

## Isolation

The stack uses a dedicated Docker Compose project (`dutch-tracker`) with its own network and named volume (`tracker-data`). Only port `tracker_host_port` (default 8080) is published on the host. The API container is not reachable externally.
