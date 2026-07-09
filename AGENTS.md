# AGENTS.md

## Cursor Cloud specific instructions

This is a Backstage developer portal (Yarn 4 monorepo). Standard commands live in `README.md` and root `package.json` scripts; prefer those. The notes below are Cloud-VM-specific caveats.

### Database: native PostgreSQL

Local development uses **native PostgreSQL**, not Docker.

- A native **PostgreSQL 16** is installed on the Cloud VM. It is not auto-started on boot.
- It listens on `127.0.0.1:5432` with user/password `postgres`/`postgres`, matching `.env.example`.
- Ensure `.env` exists (Yarn Berry does not reliably run the `prestart` hook): `cp .env.example .env` if missing.

### Running the app

Prefer the full local stack (starts Postgres if needed, then frontend + backend):

```sh
yarn start:local
```

Or start Postgres yourself, then the app only:

```sh
sudo pg_ctlcluster 16 main start
yarn start   # or yarn start:app — same command
```

- Frontend: http://localhost:3000 — sign in with the **Guest** provider.
- Backend: http://localhost:7007
- The backend creates its `backstage_plugin_*` databases automatically on first start.

### Known-expected behaviors (not bugs)

- The custom **Deployment Info** card on `service` entities (e.g. `example-service`) currently uses static mock data (`deploymentInfoSettings.useMock` in `plugins/deployment-info/src/api.ts`). Set that flag to `false` to resume live fetches against `http://<name>-<env>.local/api/v1/info` (those hosts do not exist in local/Cloud environments).
- **TechDocs generation** uses `techdocs.generator.runIn: local` (no Docker required for docs). `yarn build-image` still requires Docker and will not work in the Cloud VM.
- The Kubernetes plugin logs a warning about missing config (no cluster configured); this is expected.

### Lint / test / build

- Use `yarn lint:all` (the default `yarn lint` only checks files changed `--since origin/main`).
- Use `CI=true yarn test` so Jest does not enter watch mode.
- `yarn tsc` and `yarn build:all` work as documented.
