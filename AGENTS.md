# AGENTS.md

## Cursor Cloud specific instructions

This is a Backstage developer portal (Yarn 4 monorepo). Standard commands live in `README.md` and root `package.json` scripts; prefer those. The notes below are Cloud-VM-specific caveats.

### Database: use native PostgreSQL, not Docker

Docker is **not** available in the Cloud VM, so the documented `yarn start` (which runs `docker compose -f docker-compose.local.yaml up`) will fail on the compose step. Instead:

- A native **PostgreSQL 16** is installed. Start it (it is not auto-started on boot):
  ```sh
  sudo pg_ctlcluster 16 main start
  ```
- It listens on `127.0.0.1:5432` with user/password `postgres`/`postgres`, matching `.env.example`.
- Ensure `.env` exists (Yarn Berry does not reliably run the `prestart` hook): `cp .env.example .env` if missing.

### Running the app

Run the app **without** the Docker step, since Postgres is already running natively:

```sh
yarn start:app   # runs `dotenv -e .env -- backstage-cli repo start`
```

- Frontend: http://localhost:3000 — sign in with the **Guest** provider.
- Backend: http://localhost:7007
- The backend creates its `backstage_plugin_*` databases automatically on first start.

### Known-expected behaviors (not bugs)

- The custom **Deployment Info** card on `service` entities (e.g. `example-service`) shows "Could not load deployment info". This is expected: it fetches a fictional host `http://<name>-<env>.local/api/v1/info` that does not exist in any environment.
- **TechDocs generation** (`techdocs.generator.runIn: docker`) and `yarn build-image` require Docker and will not work in the Cloud VM. Core catalog/search/scaffolder features work without them.
- The Kubernetes plugin logs a warning about missing config (no cluster configured); this is expected.

### Lint / test / build

- Use `yarn lint:all` (the default `yarn lint` only checks files changed `--since origin/main`).
- Use `CI=true yarn test` so Jest does not enter watch mode.
- `yarn tsc` and `yarn build:all` work as documented.
