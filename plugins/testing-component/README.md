# testing-component

**Type:** Frontend Plugin

**Description:** Adds a "Testing component" content card to the entity page of `Component` entities with `spec.type: service`, displaying a status label derived from a catalog annotation.

## Interface Contract

### Parameters / Inputs

| Name                                                  | Type                              | Required | Description                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entity` (via `useEntity()` context)                  | `Entity`                          | Y        | The catalog entity being viewed; must be a `Component` with `spec.type === 'service'` for the card to render (enforced by the extension filter).                                                                                                                                |
| `metadata.annotations['testing.backstage.io/status']` | `string` (`'ok'` \| `'degraded'`) | N        | Annotation read from the entity. Determines the status label shown on the card (`ok` → `OK`, `degraded` → `Degraded`). If absent, the annotation value defaults to `'unknown'` internally, which does not match any known status — see Side Effects for the resulting behavior. |

### Return / Output

- `testingComponentPlugin` — a `FrontendPlugin` (from `@backstage/frontend-plugin-api`) with `pluginId: 'testing-component'`, registering the `testingComponentEntityCard` extension. Also exported as the default export of `./alpha` for frontend feature discovery.
- `testingComponentEntityCard` — an `EntityCardBlueprint` extension instance named `entity-card:testing-component/testing-component`, of `type: 'content'`, that lazily loads and renders `TestingComponentCard`.
- `TestingComponentCard` — a React component that renders an `InfoCard` titled **"Testing component"** with body text `Testing component ({statusLabel})`, e.g. `Testing component (OK)`.

### Side Effects

- Reads the current entity from catalog context via `useEntity()` (`@backstage/plugin-catalog-react`); performs no writes.
- **Known limitation:** if the entity's `testing.backstage.io/status` annotation is missing or set to a value other than `ok`/`degraded`, the status lookup (`Array.prototype.find`) returns `undefined` and the component throws when reading `.label`, causing the card to crash at render time. Ensure the annotation is set to a supported value before attaching this card to an entity.

## Usage Example

Register the plugin's alpha feature in the app (new frontend system), matching how it's wired in `packages/app`:

```yaml
# app-config.yaml
app:
  extensions:
    - entity-card:deployment-info/deployment-info
    - entity-card:testing-component/testing-component
```

```ts
// packages/app/package.json (dependency)
{
  "dependencies": {
    "@internal/backstage-plugin-testing-component": "workspace:^"
  }
}
```

Annotate a `service` Component entity so the card renders a known status:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: example-service
  annotations:
    testing.backstage.io/status: ok
spec:
  type: service
  lifecycle: production
  owner: guests
```

Local development with the standalone dev app (`dev/index.tsx`):

```tsx
import { createDevApp } from '@backstage/frontend-dev-utils';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import testingComponentPlugin from '../src/alpha';

createDevApp({
  features: [catalogPlugin, testingComponentPlugin],
});
```

## Dependencies

- `@backstage/frontend-plugin-api` — `createFrontendPlugin` for plugin definition.
- `@backstage/plugin-catalog-react` (including `/alpha`) — `useEntity` hook and `EntityCardBlueprint` extension point.
- `@backstage/catalog-model` — `Entity` type used by the entity filter.
- `@backstage/core-components` — `InfoCard` used for the card UI.
- Runtime dependency on the software catalog: entities must be `Component` kind with `spec.type: 'service'` and the `testing.backstage.io/status` annotation for correct rendering.
