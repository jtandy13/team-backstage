# deployment-info

**Type:** Frontend Plugin

**Description:** Adds a "Deployment Info" card to the catalog overview page for Component entities of type `service`, showing live deployment details (pod hostname, deployment time, and Kubernetes connectivity) fetched directly from the running service.

## Interface Contract

### Parameters / Inputs

| Name                                     | Type                         | Required     | Description                                                                                                                                      |
| ---------------------------------------- | ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deployment.backstage.io/environment`    | Entity annotation (`string`) | Y            | Deployment environment (e.g. `dev`, `prod`) used to build the info endpoint URL. If absent, the card renders a warning instead of fetching data. |
| Entity `kind`                            | `string`                     | Y (implicit) | Card only renders for entities where `kind === 'Component'`.                                                                                     |
| Entity `spec.type`                       | `string`                     | Y (implicit) | Card only renders for entities where `spec.type === 'service'`.                                                                                  |
| `entityName` (`buildDeploymentInfoUrl`)  | `string`                     | Y            | The entity's `metadata.name`, used as part of the constructed URL host.                                                                          |
| `environment` (`buildDeploymentInfoUrl`) | `string`                     | Y            | Value of the environment annotation, used as part of the constructed URL host.                                                                   |
| `url` (`fetchDeploymentInfo`)            | `string`                     | Y            | Fully-built deployment info endpoint URL to fetch.                                                                                               |

### Return / Output

- **`./alpha` entry point (`@backstage/FrontendPlugin`)** — default-exports **`deploymentInfoPlugin`**, a `FrontendPlugin` created via `createFrontendPlugin` with `pluginId: 'deployment-info'` and `extensions: [deploymentInfoEntityCard]`. This is the canonical entry point for installation via feature discovery.
- **`.` entry point** — has **no default export**. It only re-exports named symbols for direct consumption:

  - **`deploymentInfoPlugin`** — same `FrontendPlugin` instance as above.
  - **`deploymentInfoEntityCard`** — an `EntityCardBlueprint` extension (`type: 'content'`) that lazily loads and renders `DeploymentInfoCard` on entities matching the `isServiceComponent` filter (Component + `spec.type === 'service'`).
  - **`DeploymentInfoCard`** — a React component rendering:
    - A warning panel if the environment annotation is missing.
    - A loading spinner (`InfoCard` + `Progress`) while fetching.
    - An error panel if the fetch fails or returns no data.
    - On success, an `InfoCard` titled "Deployment Info" with a "Connected to Kubernetes" chip (shown only when `deployed_on === 'kubernetes'`) and a `StructuredMetadataTable` showing `Live Pod Hostname` and `Deployment Time`.
  - **`buildDeploymentInfoUrl(entityName, environment)`** — returns `string`, e.g. `http://my-service-prod.local/api/v1/info`.
  - **`fetchDeploymentInfo(url)`** — returns `Promise<DeploymentInfo>`:

    ```ts
    interface DeploymentInfo {
      hostname: string;
      time: string;
      deployed_on?: string;
      app_name?: string;
      env?: string;
      message?: string;
    }
    ```

  - **`DEPLOYMENT_ENVIRONMENT_ANNOTATION`** — `string` constant, value `'deployment.backstage.io/environment'`.

There is no `createFrontendModule({ pluginId: 'catalog' })` module in this package — the entity card is registered directly on the plugin's own `extensions` array (per the `EntityCardBlueprint` filter, not a catalog-page module attachment).

### Side Effects

- Issues an HTTP `GET` request to `http://{entity-name}-{environment}.local/api/v1/info` to retrieve live deployment information for the entity (`fetchDeploymentInfo`).
- Reads the current entity's annotations and spec via `useEntity` from `@backstage/plugin-catalog-react` (no writes to the catalog).

## Usage Example

The plugin follows the canonical `/alpha` frontend-plugin pattern. `package.json` marks `./alpha` as a `@backstage/FrontendPlugin` in both `exports` and `backstage.features`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./alpha": {
      "backstage": "@backstage/FrontendPlugin",
      "import": "./src/alpha.ts",
      "types": "./src/alpha.ts",
      "default": "./src/alpha.ts"
    }
  },
  "backstage": {
    "role": "frontend-plugin",
    "pluginId": "deployment-info",
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

...and the package is listed as a dependency of `packages/app` (`@internal/backstage-plugin-deployment-info: workspace:^`), Backstage automatically discovers and installs `deploymentInfoPlugin` from the `./alpha` entry point.

For local plugin development, `dev/index.tsx` imports the plugin directly from `../src/alpha`:

```tsx
import { createDevApp } from '@backstage/frontend-dev-utils';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import deploymentInfoPlugin from '../src/alpha';

createDevApp({
  features: [catalogPlugin, deploymentInfoPlugin],
});
```

For the card to render, the target `Component` entity must be `spec.type: service` and carry the environment annotation:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    deployment.backstage.io/environment: prod
spec:
  type: service
  lifecycle: production
  owner: team-a
```

Calling the API helpers directly, e.g. in a custom component, uses the `.` entry point's named exports (no default export is available from `.`):

```ts
import {
  buildDeploymentInfoUrl,
  fetchDeploymentInfo,
} from '@internal/backstage-plugin-deployment-info';

const url = buildDeploymentInfoUrl('my-service', 'prod');
// 'http://my-service-prod.local/api/v1/info'

const info = await fetchDeploymentInfo(url);
// { hostname: 'pod-abc123', time: '2026-07-07T10:00:00Z', deployed_on: 'kubernetes' }
```

## Dependencies

- `@backstage/frontend-plugin-api` — `createFrontendPlugin`.
- `@backstage/plugin-catalog-react` — `useEntity`, `EntityCardBlueprint` (via `/alpha`).
- `@backstage/catalog-model` — `Entity` type used for the entity card filter.
- `@backstage/core-components` — `InfoCard`, `Progress`, `StructuredMetadataTable`, `WarningPanel`.
- `@backstage/theme`, `@backstage/ui` — plugin theming/UI primitives.
- `@material-ui/core` — `Chip`, `Grid` used in the card layout.
- `react-use` (`useAsync`) — async data fetching in `DeploymentInfoCard`.
- Host app must have `app.packages: all` (or otherwise discover this package) in `app-config.yaml`, and depend on `@internal/backstage-plugin-deployment-info`, for the `./alpha` `FrontendPlugin` to be installed automatically.
