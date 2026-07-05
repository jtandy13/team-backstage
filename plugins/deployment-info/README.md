# deployment-info

**Type:** Frontend Plugin

**Description:** Shows live deployment details (pod hostname, deployment time, and platform) on service entity pages by fetching a runtime info endpoint derived from the entity name and its deployment environment annotation.

## Interface Contract

### Parameters / Inputs

| Name                                                          | Type                                            | Required | Description                                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deployment.backstage.io/environment` (entity annotation)     | `string`                                        | Y        | Deployment environment (e.g. `dev`, `prod`) read from `entity.metadata.annotations`. Used to build the info endpoint URL. If absent, the card renders a warning instead of fetching data. |
| Entity filter (`entity-card:deployment-info/deployment-info`) | `{ kind: 'component', 'spec.type': 'service' }` | —        | The extension only attaches to catalog entities of `kind: Component` with `spec.type: service`; it is not configurable by consumers.                                                      |
| `entityName` (`buildDeploymentInfoUrl` arg)                   | `string`                                        | Y        | The catalog entity's `metadata.name`, used as the subdomain prefix in the built URL.                                                                                                      |
| `environment` (`buildDeploymentInfoUrl` arg)                  | `string`                                        | Y        | The deployment environment value, used as the subdomain suffix in the built URL.                                                                                                          |
| `url` (`fetchDeploymentInfo` arg)                             | `string`                                        | Y        | Fully-qualified URL to fetch deployment info JSON from.                                                                                                                                   |

### Return / Output

- **`deploymentInfoPlugin`** (default export from `./alpha`): a `FrontendPlugin` (from `@backstage/frontend-plugin-api`) with `pluginId: 'deployment-info'`, registering the `deployment-info` entity card extension.
- **`DeploymentInfoCard`**: a React component rendering an `InfoCard` titled "Deployment Info" with three states:
  - Missing annotation → a `WarningPanel` prompting the user to add `deployment.backstage.io/environment`.
  - Loading → a `Progress` indicator.
  - Loaded → hostname and deployment time (`Live Pod Hostname`, `Deployment Time`), plus a "Connected to Kubernetes" `Chip` when `deployed_on === 'kubernetes'`.
  - Error → a `WarningPanel` with the fetch error message.
- **`buildDeploymentInfoUrl(entityName, environment)`**: returns `` `http://${entityName}-${environment}.local/api/v1/info` ``.
- **`fetchDeploymentInfo(url)`**: returns `Promise<DeploymentInfo>` parsed from the JSON response, or throws `Error('HTTP {status} from {url}')` on a non-OK response.
- **`DeploymentInfo`** type:

```ts
interface DeploymentInfo {
  hostname?: string;
  time?: string;
  deployed_on?: string;
  app_name?: string;
  env?: string;
  message?: string;
}
```

- **`DEPLOYMENT_ENVIRONMENT_ANNOTATION`**: the string constant `'deployment.backstage.io/environment'`.

### Side Effects

- Performs an unauthenticated `fetch(url)` HTTP GET to `http://{entity-name}-{environment}.local/api/v1/info` whenever the card renders for an entity with the environment annotation set.
- Reads the current entity from catalog context via `useEntity()` (`@backstage/plugin-catalog-react`); no writes to the catalog.

## Usage Example

Register the plugin in the app (new frontend system), as done in `packages/app/src/App.tsx`:

```tsx
import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import deploymentInfoPlugin from '@internal/plugin-deployment-info/alpha';

export const app = createApp({
  features: [catalogPlugin, deploymentInfoPlugin],
});

export default app.createRoot();
```

The card automatically appears on the catalog overview tab for any `Component` entity with `spec.type: service` that carries the environment annotation:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service-prod
  annotations:
    deployment.backstage.io/environment: prod
spec:
  type: service
  lifecycle: production
  owner: guests
```

The helpers can also be used directly, e.g. in a test or a custom component:

```ts
import {
  buildDeploymentInfoUrl,
  fetchDeploymentInfo,
} from '@internal/plugin-deployment-info';

const url = buildDeploymentInfoUrl('my-service', 'prod');
// => 'http://my-service-prod.local/api/v1/info'

const info = await fetchDeploymentInfo(url);
// => { hostname: 'pod-abc123', time: '2026-07-05T10:00:00Z', deployed_on: 'kubernetes', ... }
```

## Dependencies

- `@backstage/frontend-plugin-api` — `createFrontendPlugin` for plugin definition.
- `@backstage/plugin-catalog-react` (including `/alpha` entry point) — `EntityCardBlueprint` for the entity card extension and `useEntity` for reading the current entity.
- `@backstage/core-components` — `InfoCard`, `Progress`, `WarningPanel` used by `DeploymentInfoCard`.
- `@backstage/catalog-model` — entity type definitions.
- `@material-ui/core` — `Box`, `Chip`, `Grid`, `Typography` layout primitives.
- `react-use` (`useAsync`) — manages the async fetch lifecycle (loading/error/value) inside the card.
- An external deployment info HTTP service reachable at `http://{entity-name}-{environment}.local/api/v1/info`, expected to return a JSON body matching the `DeploymentInfo` shape.
