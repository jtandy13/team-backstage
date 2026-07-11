# github-actions

**Type:** Frontend Plugin

**Description:** Adds a "GitHub Actions" card to the catalog overview page for `Api` entities, showing recent workflow runs (workflow name, status, branch, and time). By default the card serves static mock data; live fetching against a real GitHub Actions endpoint is not yet implemented.

## Interface Contract

### Parameters / Inputs

| Name                                  | Type      | Required     | Description                                                                                                                                          |
| -------------------------------------- | --------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entity `kind`                          | `string`  | Y (implicit) | Card only renders for entities where `kind.toLocaleLowerCase('en-US') === 'api'` (`isApiEntity` filter on the `EntityCardBlueprint`).                    |
| `entityName` (`fetchGithubActionsRuns`) | `string`  | Y            | The entity's `metadata.name`, passed in by `GithubActionsCard` via `useEntity`. Currently unused when `githubActionsSettings.useMock` is `true`; reserved for the live implementation. |
| `githubActionsSettings.useMock`        | `boolean` | N            | Module-level flag (default `true`) read by `fetchGithubActionsRuns`. When `true`, returns `MOCK_GITHUB_ACTIONS_RUNS`. When `false`, the function throws, since live fetching is not implemented yet. |

### Return / Output

- **`./alpha` entry point (`@backstage/FrontendPlugin`)** — default-exports **`githubActionsPlugin`**, a `FrontendPlugin` created via `createFrontendPlugin` with `pluginId: 'github-actions'` and `extensions: [githubActionsEntityCard]`. This is the canonical entry point for installation via feature discovery.
- **`.` entry point** — has **no default export**. It only re-exports named symbols for direct consumption:

  - **`githubActionsPlugin`** — same `FrontendPlugin` instance as above.
  - **`githubActionsEntityCard`** — an `EntityCardBlueprint` extension (`name: 'github-actions'`, `type: 'content'`) that lazily loads and renders `GithubActionsCard` on entities matching the `isApiEntity` filter (`kind === 'api'`, case-insensitive).
  - **`GithubActionsCard`** — a React component rendering:
    - A loading spinner (`InfoCard` + `Progress`) while fetching.
    - A `WarningPanel` if the fetch fails or returns no data.
    - On success, an `InfoCard` titled "GitHub Actions" (with a `GitHubIcon`) containing a table of runs, each row showing workflow name, status (`StatusOK` for `success` / `StatusError` for `failed`), branch, and relative time.
  - **`fetchGithubActionsRuns(entityName)`** — returns `Promise<GithubActionsRun[]>`. When `githubActionsSettings.useMock` is `true` (the current default), it resolves immediately to `MOCK_GITHUB_ACTIONS_RUNS`, ignoring `entityName`. When `false`, it throws `Error('Live GitHub Actions fetch is not implemented. Set githubActionsSettings.useMock to true.')` — no live integration exists yet.

    ```ts
    type GithubActionsRunStatus = 'success' | 'failed';

    type GithubActionsRun = {
      workflow: string;
      status: GithubActionsRunStatus;
      branch: string;
      timeAgo: string;
    };
    ```

  - **`githubActionsSettings`** — `{ useMock: boolean }` mutable settings object exported from `./api`. Defaults to `{ useMock: true }`. This single flag controls whether `fetchGithubActionsRuns` (and therefore `GithubActionsCard`) serves mock data or attempts a live fetch.
  - **`MOCK_GITHUB_ACTIONS_RUNS`** — a static `GithubActionsRun[]` constant exported from `./mockData`, used as the mock response:

    ```ts
    const MOCK_GITHUB_ACTIONS_RUNS: GithubActionsRun[] = [
      { workflow: 'deploy-grpc-prod', status: 'success', branch: 'main', timeAgo: '2 hours ago' },
      { workflow: 'deploy-grpc-staging', status: 'success', branch: 'main', timeAgo: '4 hours ago' },
      { workflow: 'pr-validation', status: 'failed', branch: 'feature/auth-update', timeAgo: '5 hours ago' },
    ];
    ```

  - **`GithubActionsRun`**, **`GithubActionsRunStatus`** — the TypeScript types shown above, exported from `./api`.

There is no `createFrontendModule({ pluginId: 'catalog' })` module in this package — the entity card is registered directly on the plugin's own `extensions` array (per the `EntityCardBlueprint` filter, not a catalog-page module attachment).

### Side Effects

- **Mock mode (`githubActionsSettings.useMock === true`, the current default)** — no network request is made. `fetchGithubActionsRuns` synchronously resolves to `MOCK_GITHUB_ACTIONS_RUNS`.
- **Live mode (`githubActionsSettings.useMock === false`)** — not implemented; `fetchGithubActionsRuns` throws instead of making a request.
- Reads the current entity's `metadata.name` and `kind` via `useEntity` from `@backstage/plugin-catalog-react` (no writes to the catalog).

## Usage Example

The plugin follows the canonical `/alpha` frontend-plugin pattern. `package.json` marks `./alpha` as a `@backstage/FrontendPlugin` in both `exports` and `backstage.features`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./alpha": "./src/alpha.ts",
    "./package.json": "./package.json"
  },
  "backstage": {
    "role": "frontend-plugin",
    "pluginId": "github-actions",
    "features": {
      "./alpha": "@backstage/FrontendPlugin"
    }
  }
}
```

Because of this, the host app does **not** need to import or register the plugin manually in `packages/app/src/App.tsx`. As long as the app has feature discovery enabled in `app-config.yaml`:

```yaml
app:
  packages: all
```

...and the package is listed as a dependency of `packages/app` (`@internal/backstage-plugin-github-actions: workspace:^`), Backstage automatically discovers and installs `githubActionsPlugin` from the `./alpha` entry point.

For local plugin development, `dev/index.tsx` imports the plugin directly from `../src/alpha`:

```tsx
import { createDevApp } from '@backstage/frontend-dev-utils';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import githubActionsPlugin from '../src/alpha';

createDevApp({
  features: [catalogPlugin, githubActionsPlugin],
});
```

For the card to render, the target entity must have `kind: API` (case-insensitive):

```yaml
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: my-api
spec:
  type: openapi
  lifecycle: production
  owner: team-a
  definition: |
    openapi: "3.0.0"
```

Calling the API helpers directly, e.g. in a custom component, uses the `.` entry point's named exports (no default export is available from `.`):

```ts
import {
  fetchGithubActionsRuns,
  githubActionsSettings,
} from '@internal/backstage-plugin-github-actions';

const runs = await fetchGithubActionsRuns('my-api');
// Mock mode (default): resolves to MOCK_GITHUB_ACTIONS_RUNS regardless of entityName.
// [
//   { workflow: 'deploy-grpc-prod', status: 'success', branch: 'main', timeAgo: '2 hours ago' },
//   { workflow: 'deploy-grpc-staging', status: 'success', branch: 'main', timeAgo: '4 hours ago' },
//   { workflow: 'pr-validation', status: 'failed', branch: 'feature/auth-update', timeAgo: '5 hours ago' },
// ]
```

### Mock mode

`githubActionsSettings.useMock` currently defaults to `true`, so `GithubActionsCard` and `fetchGithubActionsRuns` always render `MOCK_GITHUB_ACTIONS_RUNS` without making a network call — this is expected while the live GitHub Actions integration is unbuilt.

Setting the flag to `false` does **not** enable live fetching yet; it makes `fetchGithubActionsRuns` throw instead, since no live implementation exists:

```ts
export const githubActionsSettings = {
  useMock: false, // fetchGithubActionsRuns will now throw
};
```

Since `githubActionsSettings` is also exported from the package's `.` entry point, consumers can flip it at runtime instead of editing source, e.g. in a dev harness or test setup:

```ts
import { githubActionsSettings } from '@internal/backstage-plugin-github-actions';

githubActionsSettings.useMock = false; // subsequent fetchGithubActionsRuns calls throw until live fetch is implemented
```

## Dependencies

- `@backstage/frontend-plugin-api` — `createFrontendPlugin`.
- `@backstage/plugin-catalog-react` — `useEntity`, `EntityCardBlueprint` (via `/alpha`).
- `@backstage/catalog-model` — `Entity` type used for the entity card filter.
- `@backstage/core-components` — `InfoCard`, `Progress`, `WarningPanel`, `GitHubIcon`, `StatusOK`, `StatusError`.
- `@backstage/theme` — plugin theming.
- `@material-ui/core` — `Box`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableRow`, `Typography`, `makeStyles` used in the card layout.
- `react-use` (`useAsync`) — async data fetching in `GithubActionsCard`.
- Host app must have `app.packages: all` (or otherwise discover this package) in `app-config.yaml`, and depend on `@internal/backstage-plugin-github-actions`, for the `./alpha` `FrontendPlugin` to be installed automatically.
