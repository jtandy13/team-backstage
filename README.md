# Backstage Developer Portal

An internal [Backstage](https://backstage.io) developer portal built as a Yarn workspaces monorepo. It provides a unified interface for service discovery, software templates, TechDocs, search, and custom catalog extensions.

## Tech stack

| Layer               | Technology                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Framework**       | [Backstage](https://backstage.io) v1.52.0                                                  |
| **Runtime**         | Node.js 22 or 24                                                                           |
| **Package manager** | Yarn 4.13 (Berry, `node-modules` linker)                                                   |
| **Language**        | TypeScript ~5.8                                                                            |
| **Frontend**        | React 18, Material UI v4, Backstage new frontend system (`@backstage/frontend-plugin-api`) |
| **Backend**         | Backstage backend system (`@backstage/backend-defaults`)                                   |
| **Database**        | PostgreSQL 16+ (native local install)                                                      |
| **Search**          | PostgreSQL-backed search engine                                                            |
| **Auth**            | Guest provider (development only)                                                          |
| **Testing**         | Jest, React Testing Library, Playwright (e2e)                                              |
| **CI/CD**           | GitHub Actions                                                                             |
| **Git hooks**       | Husky + lint-staged                                                                        |

### Enabled Backstage features

- **Software Catalog** — entity discovery and ownership
- **Scaffolder** — software templates with GitHub integration
- **TechDocs** — documentation built and generated locally (no Docker required)
- **Search** — catalog and TechDocs collators
- **Kubernetes** — cluster visibility (backend plugin installed)
- **Notifications & Signals** — real-time updates
- **Permissions** — permission framework enabled (allow-all policy in dev)
- **MCP Actions** — AI agent tooling for catalog and scaffolder

### Custom plugins

| Plugin                                        | Type     | Description                                                       |
| --------------------------------------------- | -------- | ----------------------------------------------------------------- |
| [`deployment-info`](plugins/deployment-info/) | Frontend | Entity card showing live deployment info for `service` components |

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Developer browser                        │
│                     http://localhost:3000                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  packages/app  (frontend host)                                  │
│  • createApp() with feature discovery (app.packages: all)       │
│  • Auto-discovers plugins from packages/app dependencies        │
│  • Custom nav module, sign-in page                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / SSE
┌────────────────────────────▼────────────────────────────────────┐
│  packages/backend  (Node backend)                               │
│  • createBackend() — plugin-per-module architecture             │
│  • Catalog, Auth, Scaffolder, TechDocs, Search, K8s, etc.       │
│  • Serves built frontend via @backstage/plugin-app-backend      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  PostgreSQL  (native, 127.0.0.1:5432)                            │
│  • Plugin databases (backstage_plugin_*)                        │
│  • Search index                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo layout

```text
backstage/
├── packages/
│   ├── app/          # Frontend host application
│   └── backend/      # Backend host application
├── plugins/
│   └── deployment-info/   # Custom frontend plugin
├── catalog/          # Catalog entity definitions
├── examples/         # Sample entities, org data, and scaffolder templates
├── app-config.yaml   # Base configuration (development)
├── app-config.production.yaml
└── .env.example      # Environment variable template
```

### Frontend system

The app uses Backstage's **new frontend system**:

- Plugins are registered via `FrontendPlugin` exports (`./alpha` entry points).
- Feature discovery is enabled with `app.packages: all` in `app-config.yaml`, so plugins listed as dependencies of `packages/app` are installed automatically — no manual imports required in `App.tsx`.
- The host app composes core features (`catalog`, custom nav, sign-in page) via `createApp()`.

### Backend system

The backend uses Backstage's **new backend system**:

- Each capability is a separate backend plugin module added in `packages/backend/src/index.ts`.
- Database migrations run automatically per plugin on startup.
- Configuration is driven by `app-config.yaml` with environment variable substitution.

## Prerequisites

- **Node.js** 22 or 24 ([engines](package.json))
- **Yarn** 4.13 — installed automatically via Corepack:
  ```sh
  corepack enable
  ```
- **PostgreSQL** 16+ — native install listening on `127.0.0.1:5432` with user/password matching `.env.example` (`postgres`/`postgres` by default)
- **Docker** — optional; only required for TechDocs generation and `yarn build-image`

## Getting started

### 1. Install dependencies

```sh
yarn install
```

### 2. Start PostgreSQL

PostgreSQL must be running before you start Backstage. You can either start it yourself, or use `yarn start:local` (step 4) which starts it for you.

**macOS (Homebrew):**

```sh
brew install postgresql@16
brew services start postgresql@16
# Ensure a role/password matching .env.example (postgres/postgres), e.g.:
# createuser -s postgres
# psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

**Linux / Cloud VM:**

```sh
sudo pg_ctlcluster 16 main start
```

### 3. Configure environment

Copy the example environment file (also done automatically by `yarn start` / `yarn start:local`):

```sh
cp .env.example .env
```

Edit `.env` if your PostgreSQL connection differs from the defaults.

### 4. Start Backstage

**Full local stack** (starts native PostgreSQL if needed, then frontend + backend):

```sh
yarn start:local
```

**App only** (assumes PostgreSQL is already running). If `pg_isready` is installed, fails fast when the database is unreachable:

```sh
yarn start
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:7007 |

Sign in with the **Guest** provider in development (`auth.environment: development`). Stop the app with Ctrl+C. Manage PostgreSQL with your OS tools (for example `brew services stop postgresql@16` or `sudo pg_ctlcluster 16 main stop`).

## Scripts

### Daily development

| Script             | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `yarn start:local` | Start native PostgreSQL (if needed), then Backstage frontend and backend  |
| `yarn start`       | Start Backstage frontend and backend (PostgreSQL must already be running) |
| `yarn start:app`   | Alias of `yarn start`                                                     |
| `yarn db:status`   | Inspect plugin databases, connections, and recent catalog migrations      |
| `yarn new`         | Scaffold a new plugin or package interactively                            |

### Build

| Script               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `yarn build:all`     | Build all packages (frontend, backend, plugins) |
| `yarn build:backend` | Build the backend package only                  |
| `yarn build-image`   | Build a production Docker image for the backend |

### Quality

| Script                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `yarn test`           | Run unit and integration tests across the monorepo |
| `yarn test:all`       | Run tests with coverage                            |
| `yarn test:e2e`       | Run Playwright end-to-end tests                    |
| `yarn lint`           | Lint packages changed since `origin/main`          |
| `yarn lint:all`       | Lint every package                                 |
| `yarn fix`            | Auto-fix lint issues                               |
| `yarn prettier:check` | Check formatting                                   |
| `yarn tsc`            | Type-check the monorepo                            |
| `yarn clean`          | Remove build artifacts                             |

### Git hooks

- **pre-commit** — runs `lint-staged` (ESLint + Prettier on staged files)
- **pre-push** — runs `yarn lint --since origin/main`

## Environment variables

Defined in `.env` (see `.env.example`):

| Variable            | Default     | Description       |
| ------------------- | ----------- | ----------------- |
| `POSTGRES_HOST`     | `127.0.0.1` | PostgreSQL host   |
| `POSTGRES_PORT`     | `5432`      | PostgreSQL port   |
| `POSTGRES_USER`     | `postgres`  | Database user     |
| `POSTGRES_PASSWORD` | `postgres`  | Database password |

Additional variables referenced in `app-config.yaml` (set in `.env` as needed):

| Variable       | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `GITHUB_TOKEN` | GitHub PAT for catalog integrations and scaffolder actions |

## Configuration

| File                         | Purpose                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `app-config.yaml`            | Base config — development defaults, guest auth, TechDocs local generator, example catalog locations |
| `app-config.production.yaml` | Production overrides — guest auth disabled, no sign-in provider, production auth environment        |
| `backstage.json`             | Backstage version pin                                                                               |

Catalog entity locations, auth providers, TechDocs settings, and integrations are all configured in `app-config.yaml`. See the [Backstage configuration docs](https://backstage.io/docs/conf/) for reference.

## Working with plugins

### Create a new plugin

```sh
yarn new
```

Follow the interactive prompts. New plugins are created under `plugins/` and must be added as a dependency of `packages/app` (frontend) or registered in `packages/backend/src/index.ts` (backend).

### Develop a frontend plugin in isolation

```sh
yarn workspace @internal/backstage-plugin-deployment-info start
```

### Project conventions

- **No community plugins** — new features are built in this repo using official `@backstage/*` packages.
- **Tests required** — new features ship with colocated `*.test.ts` / `*.test.tsx` files.
- **README required** — each plugin or significant component has its own `README.md`.

## Testing

The project uses two test layers: **Jest** for unit and component tests, and **Playwright** for end-to-end browser tests.

### Testing packages

| Package                                          | Scope                   | Used for                                                              |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------- |
| **jest**                                         | Root                    | Test runner for all unit and component tests                          |
| **@types/jest**                                  | Root                    | TypeScript types for Jest                                             |
| **jsdom** / **@jest/environment-jsdom-abstract** | Root                    | DOM environment for React component tests                             |
| **@testing-library/react**                       | `packages/app`, plugins | Rendering and querying React components                               |
| **@testing-library/jest-dom**                    | `packages/app`, plugins | DOM matchers (`toBeInTheDocument`, etc.)                              |
| **@testing-library/user-event**                  | `packages/app`, plugins | Simulating user interactions                                          |
| **@backstage/frontend-test-utils**               | `packages/app`, plugins | `renderTestApp`, extension testing helpers                            |
| **@backstage/plugin-catalog-react** (testUtils)  | Plugins                 | `createTestEntityPage` for entity card tests                          |
| **@playwright/test**                             | Root, `packages/app`    | Browser-based end-to-end tests                                        |
| **@backstage/e2e-test-utils**                    | Root                    | `generateProjects()` — discovers `e2e-tests/` folders across packages |

Test files live next to the code they cover (`*.test.ts`, `*.test.tsx`). End-to-end specs live in `e2e-tests/` directories (currently `packages/app/e2e-tests/`).

### When tests run

| Trigger                 | What runs                                                                    |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Locally (on demand)** | `yarn test`, `yarn test:all`, or `yarn test:e2e`                             |
| **Pre-commit hook**     | Lint-staged only — tests are **not** run automatically                       |
| **Pre-push hook**       | `yarn lint --since origin/main` only — tests are **not** run automatically   |
| **GitHub Actions CI**   | `yarn test` (Jest) on every push, pull request, and manual workflow dispatch |
| **GitHub Actions CI**   | `yarn test:e2e` (Playwright) is **not** currently run in CI                  |

### Run tests locally

#### All unit and component tests (monorepo)

```sh
CI=true yarn test
```

`CI=true` prevents Jest from entering watch mode, which is important in non-interactive terminals.

With coverage:

```sh
CI=true yarn test:all
```

#### Single package

```sh
# Frontend host app
CI=true yarn workspace app test

# Custom plugin
CI=true yarn workspace @internal/backstage-plugin-deployment-info test
```

#### Single test file

```sh
CI=true yarn workspace app test src/App.test.tsx
CI=true yarn workspace @internal/backstage-plugin-deployment-info test src/api.test.ts
```

#### End-to-end tests (Playwright)

Playwright starts the frontend and backend dev servers automatically when run locally (see `playwright.config.ts`).

```sh
yarn test:e2e
```

To run a single e2e spec:

```sh
yarn test:e2e packages/app/e2e-tests/app.test.ts
```

E2e HTML reports are written to `e2e-test-report/`.

### Testing in GitHub Actions

Unit and component tests run in the **Continuous Integration** job of the [CI/CD Pipeline](.github/workflows/ci-cd.yml).

**Triggers:**

- Every push (all branches)
- Pull requests targeting `main`
- Manual runs via **Actions → CI/CD Pipeline → Run workflow**

**CI test step:**

```yaml
- name: Run Automated Tests
  run: yarn test
  env:
    CI: true
```

The `CI=true` environment variable ensures Jest runs once and exits — the same behaviour you get locally with `CI=true yarn test`.

**Where tests sit in the pipeline** (CI job runs these steps in order):

1. Checkout repository
2. Setup Node.js 22 with Yarn cache
3. `yarn install --immutable`
4. `yarn lint:all`
5. `yarn prettier:check`
6. `yarn npm audit` (critical severity)
7. **`yarn test`** ← unit and component tests
8. `yarn tsc`
9. `yarn build:all`
10. Upload build artifacts (main branch pushes only)

End-to-end tests are not part of this pipeline yet. Run `yarn test:e2e` locally before merging changes that affect user-facing flows.

## CI/CD

The [CI/CD Pipeline](.github/workflows/ci-cd.yml) runs on every push and pull request:

1. **CI** — install, lint, format check, security audit, tests, type-check, build (see [Testing in GitHub Actions](#testing-in-github-actions))
2. **Code review** — automated Cursor code review on pull requests to `main`
3. **CD** — simulated deployment on pushes to `main` (placeholder until a hosting provider is configured)

## Useful links

- [Backstage documentation](https://backstage.io/docs/)
- [Creating plugins (frontend)](https://backstage.io/docs/frontend-system/building-plugins/)
- [Creating plugins (backend)](https://backstage.io/docs/backend-system/building-backends/)
- [Software Catalog](https://backstage.io/docs/features/software-catalog/)
- [Scaffolder](https://backstage.io/docs/features/software-templates/)
- [TechDocs](https://backstage.io/docs/features/techdocs/)
