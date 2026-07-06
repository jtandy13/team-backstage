# deployment-info

**Type:** Frontend Plugin

**Description:** Adds a "Deployment Info" overview card to Component/Service catalog entities, showing live deployment data (pod hostname, deployment time) fetched from a per-environment status endpoint derived from the entity's `deployment.backstage.io/environment` annotation.

## Interface Contract

### Parameters / Inputs

| Name                                                                    | Type                                            | Required | Description                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deployment.backstage.io/environment` (entity annotation)               | `string`                                        | Y        | Read from `entity.metadata.annotations` by `DeploymentInfoCard`. Selects the environment segment (e.g. `dev`, `prod`) used to build the deployment info URL. If missing, the card renders a warning instead of fetching. |
| Entity card filter                                                      | `{ kind: 'component', 'spec.type': 'service' }` | —        | `deploymentInfoEntityCard` only attaches to catalog entities matching this `EntityCardBlueprint` filter; it is not attached to other kinds/types.                                                                        |
| `entityName` (arg to `buildDeploymentInfoUrl` / `fetchDeploymentInfo`)  | `string`                                        | Y        | Catalog entity name. Supplied automatically as `entity.metadata.name` inside `DeploymentInfoCard`, or passed directly when calling the exported functions standalone.                                                    |
| `environment` (arg to `buildDeploymentInfoUrl` / `fetchDeploymentInfo`) | `string`                                        | Y        | Deployment environment segment. Supplied automatically from the annotation inside `DeploymentInfoCard`, or passed directly when calling the exported functions standalone.                                               |

### Return / Output

- **`deploymentInfoPlugin`** (default export) — a `FrontendPlugin` (`pluginId: 'deployment-info'`) registering the `deploymentInfoEntityCard` extension. Passed to `createApp({ features: [...] })`.
- **`deploymentInfoEntityCard`** — an `EntityCardBlueprint` extension (`name: 'deployment-info'`) that lazily loads and renders `DeploymentInfoCard` as an entity overview card.
- **`DeploymentInfoCard`** — a React component rendering an `InfoCard` titled "Deployment Info" with four states:
  - Missing annotation → `WarningPanel` instructing the user to add the annotation.
  - Loading → `Progress` indicator.
  - Fetch error → `WarningPanel` with the error message, HTTP status (if available), and request URL.
  - Success → `StructuredMetadataTable` showing `Live Pod Hostname` and `Deployment Time`, plus a "Connected to Kubernetes" `Chip` when the response's `deployed_on` field equals `'kubernetes'`.
- **`buildDeploymentInfoUrl(entityName, environment): string`** — builds `http://{entityName}-{environment}.local/api/v1/info`.
- **`fetchDeploymentInfo(entityName, environment): Promise<DeploymentInfo>`** — fetches that URL and resolves with the parsed JSON body, or rejects with `DeploymentInfoFetchError`.
- **`DeploymentInfo`** (type) — shape of the fetched payload:

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

- **`DeploymentInfoFetchError`** — an `Error` subclass thrown on network failure or a non-OK HTTP response. Adds `url: string` and `status?: number` fields.
- **`DEPLOYMENT_ENVIRONMENT_ANNOTATION`** — the string constant `'deployment.backstage.io/environment'`.

### Side Effects

- Issues an unauthenticated browser `fetch()` to `http://{entity-name}-{environment}.local/api/v1/info` whenever `DeploymentInfoCard` mounts, and re-fetches whenever `entity.metadata.name` or the environment annotation changes (via `useAsync`).
- No catalog writes, no persisted local state, no other network or database access.

## Usage Example

Register the plugin's default export as a feature in the app (as done in `packages/app/src/App.tsx`):

```tsx
import { createApp } from '@backstage/frontend-defaults';
import deploymentInfoPlugin from '@internal/backstage-plugin-deployment-info';

export default createApp({
  features: [deploymentInfoPlugin],
}).createRoot();
```

The card appears automatically on the overview page of any `Component`/`service` entity that carries the environment annotation:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: example-service
  annotations:
    deployment.backstage.io/environment: dev
spec:
  type: service
  lifecycle: production
  owner: team-a
```

With that annotation present, `DeploymentInfoCard` fetches `http://example-service-dev.local/api/v1/info` and renders the returned hostname/time.

The lower-level API can also be used directly, e.g. from another component:

```ts
import {
  fetchDeploymentInfo,
  DeploymentInfoFetchError,
} from '@internal/backstage-plugin-deployment-info';

try {
  const info = await fetchDeploymentInfo('example-service', 'dev');
  console.log(info.hostname, info.time);
} catch (error) {
  if (error instanceof DeploymentInfoFetchError) {
    console.error(`Failed to reach ${error.url} (status ${error.status})`);
  }
}
```

## Dependencies

- `@backstage/frontend-plugin-api` — `createFrontendPlugin` for the plugin definition.
- `@backstage/plugin-catalog-react` (`/alpha`) — `EntityCardBlueprint` for the entity card extension, `useEntity` for reading the current entity.
- `@backstage/core-components` — `InfoCard`, `Progress`, `StructuredMetadataTable`, `WarningPanel`.
- `@backstage/theme`, `@backstage/ui` — theming/UI primitives used by the plugin's styling.
- `@material-ui/core` — `Box`, `Chip`.
- `react-use` — `useAsync` for data fetching/loading/error state.
- `react` (peer dependency).
