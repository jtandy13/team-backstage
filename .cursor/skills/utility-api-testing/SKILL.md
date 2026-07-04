---
name: utility-api-testing
description: Builds tests involving Backstage utility APIs using @backstage/frontend-test-utils (mockApis, attachMockApiFactory, createApiMock, TestApiProvider). Use when mocking utility APIs in component or extension tests, creating plugin testUtils mocks, or writing tests for code that consumes or exposes utility APIs in the new frontend system.
---

# Utility API Testing

Official reference: [Testing with Utility APIs](https://backstage.io/docs/frontend-system/utility-apis/testing)

Use `@backstage/frontend-test-utils` — not legacy `@backstage/test-utils` API patterns.

For full component and extension test harnesses, see [frontend-plugin-testing](../frontend-plugin-testing/SKILL.md).

## Before writing tests

1. Confirm the package uses the **new frontend system** (`backstage.role`: `frontend-plugin`, `web-library`, or related).
2. Add devDependencies if missing:
   - `@backstage/frontend-test-utils`
   - `@testing-library/react`
3. Colocate consumer tests as `*.test.tsx` next to the source file.
4. Export plugin mocks from a `/testUtils` entry point (see below).
5. Run tests with `yarn test` in the package directory, or `yarn test --watch path/to/file.test.tsx`.

## Choose fake vs jest mock

| Need | Pattern |
| --- | --- |
| API should behave functionally (return data, collect side effects) | Fake instance — call `mockApis.foo()` or your `myApiMock()` |
| Assert specific methods were called | Jest mock — call `mockApis.foo.mock()` or your `myApiMock.mock()` |

```ts
import { mockApis } from '@backstage/frontend-test-utils';

// Fake — functional behavior
const configApi = mockApis.config({ data: { app: { title: 'Test' } } });
expect(configApi.getString('app.title')).toBe('Test');

const alertApi = mockApis.alert();
alertApi.post({ message: 'hello' });
expect(alertApi.getAlerts()).toHaveLength(1);

// Jest mock — call assertions
const permissionApi = mockApis.permission.mock({
  authorize: async () => ({ result: AuthorizeResult.ALLOW }),
});
// ... exercise component ...
expect(permissionApi.authorize).toHaveBeenCalledTimes(1);
```

## Provide mocks in tests

Prefer the `apis` option on test harnesses over manual context wiring.

### `renderInTestApp`

```tsx
import { renderInTestApp, mockApis } from '@backstage/frontend-test-utils';

await renderInTestApp(<MyComponent />, {
  apis: [
    mockApis.identity({ userEntityRef: 'user:default/guest' }),
    mockApis.config({ data: { app: { title: 'Test App' } } }),
  ],
});
```

Custom or plugin APIs use `[apiRef, implementation]` tuples:

```tsx
import { myCustomApiRef } from '../apis';

await renderInTestApp(<MyComponent />, {
  apis: [
    mockApis.identity({ userEntityRef: 'user:default/guest' }),
    [myCustomApiRef, { fetchItems: async () => [] }],
  ],
});
```

### `renderTestApp` and `createExtensionTester`

Same `apis` format:

```tsx
import { renderTestApp, mockApis } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';

renderTestApp({
  extensions: [createTestEntityPage({ entity }), myEntityCard],
  apis: [mockApis.permission()],
});
```

```tsx
const tester = createExtensionTester(myExtension, {
  apis: [[identityApiRef, mockApis.identity({ userEntityRef: 'user:default/guest' })]],
});
```

### `TestApiProvider` (standalone only)

Use when not using `renderInTestApp`, `renderTestApp`, or `createExtensionTester`:

```tsx
import { render } from '@testing-library/react';
import { TestApiProvider, mockApis } from '@backstage/frontend-test-utils';

render(
  <TestApiProvider
    apis={[
      mockApis.identity({ userEntityRef: 'user:default/guest' }),
      [myCustomApiRef, { myMethod: jest.fn() }],
    ]}
  >
    <MyComponent />
  </TestApiProvider>,
);
```

## Use plugin `/testUtils` mocks

Import plugin-provided mocks when available:

```tsx
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';

await renderInTestApp(<MyEntitiesList />, {
  apis: [
    mockApis.identity({ userEntityRef: 'user:default/guest' }),
    catalogApiMock({ entities: [entity] }),
  ],
});
```

## Create plugin test mocks

If your plugin exposes a utility API, provide mocks following the `mockApis` pattern.

### File layout

```
plugins/my-plugin/
├── src/
│   ├── apis.ts              # apiRef + MyApi interface
│   └── testUtils/
│       └── myApiMock.ts     # mock factory
└── package.json             # export "./testUtils"
```

### Mock factory pattern

```ts
import {
  attachMockApiFactory,
  createApiMock,
} from '@backstage/frontend-test-utils';
import { myApiRef } from '../apis';

// Fake instance with real behavior
export function myApiMock(options?: { greeting?: string }) {
  return attachMockApiFactory(myApiRef, {
    greet: async () => options?.greeting ?? 'Hello!',
  });
}

// Jest mock variant — all methods are jest.fn()
export namespace myApiMock {
  export const mock = createApiMock(myApiRef, () => ({
    greet: jest.fn(),
  }));
}
```

### package.json export

```json
{
  "exports": {
    "./testUtils": "./src/testUtils/index.ts"
  }
}
```

### Consumer usage

```tsx
import { myApiMock } from '@internal/plugin-my-plugin/testUtils';

// Fake with real behavior
await renderInTestApp(<MyComponent />, {
  apis: [myApiMock({ greeting: 'Hi there!' })],
});

// Jest mock for assertions
const api = myApiMock.mock({ greet: async () => 'mocked' });
await renderInTestApp(<MyComponent />, { apis: [api] });
expect(api.greet).toHaveBeenCalledTimes(1);
```

## Core `mockApis` helpers

| API | Fake | Notes |
| --- | --- | --- |
| `mockApis.alert()` | `MockAlertApi` | `.getAlerts()`, `.clearAlerts()`, `.waitForAlert()` |
| `mockApis.analytics()` | `MockAnalyticsApi` | `.getEvents()` |
| `mockApis.config({ data })` | `MockConfigApi` | Plain JSON config object |
| `mockApis.discovery({ baseUrl })` | Inline | `${baseUrl}/api/${pluginId}` |
| `mockApis.error(options?)` | `MockErrorApi` | `.getErrors()`, `.waitForError()` |
| `mockApis.featureFlags(options?)` | `MockFeatureFlagsApi` | `.getState()`, `.setState()` |
| `mockApis.fetch(options?)` | `MockFetchApi` | Identity injection, plugin protocol |
| `mockApis.identity(options?)` | Inline | User ref, ownership, token, profile |
| `mockApis.permission(options?)` | `MockPermissionApi` | Defaults to ALLOW |
| `mockApis.storage({ data })` | `MockStorageApi` | In-memory buckets |
| `mockApis.translation()` | `MockTranslationApi` | Passthrough defaults |

Each supports `.mock()` for jest.fn-based assertions.

## Checklist before finishing

- [ ] Tests use `@backstage/frontend-test-utils`, not legacy test helpers
- [ ] Chose fake vs `.mock()` based on whether behavior or call assertions matter
- [ ] APIs provided via `apis` option on test harness (not manual `ApiProvider` wiring)
- [ ] Plugin mocks use `attachMockApiFactory` + `createApiMock` and export from `/testUtils`
- [ ] `TestApiProvider` used only for standalone renders outside test app harnesses
- [ ] `yarn test` passes in the target package

## Additional resources

- Full mockApis table, tuple syntax details, and anti-patterns: [reference.md](reference.md)
