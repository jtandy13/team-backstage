---
name: frontend-plugin-testing
description: Builds tests for Backstage frontend plugins and extensions using @backstage/frontend-test-utils (renderInTestApp, renderTestApp, createExtensionTester, mockApis, TestApiProvider). Use when writing or fixing frontend plugin tests, React component tests, extension tests, entity card/content tests, route ref tests, or utility API mocking in the new frontend system.
---

# Frontend Plugin Testing

Official reference: [Testing Frontend Plugins](https://backstage.io/docs/frontend-system/building-plugins/testing)

Utility API mocks: [Testing with Utility APIs](https://backstage.io/docs/frontend-system/utility-apis/testing)

Use `@backstage/frontend-test-utils` — not legacy `@backstage/test-utils` patterns.

## Before writing tests

1. Confirm the package uses the **new frontend system** (`backstage.role`: `frontend-plugin` or related extension package).
2. Add devDependencies if missing:
   - `@backstage/frontend-test-utils`
   - `@testing-library/react`
   - `@testing-library/user-event` (interaction tests)
3. Colocate tests as `*.test.tsx` next to the source file.
4. Run tests with `yarn test` in the package directory, or `yarn test --watch path/to/file.test.tsx`.

## Choose the right harness

| What you are testing | Harness |
| --- | --- |
| React component (reusable, not tied to one extension) | `renderInTestApp` |
| Frontend extension in isolation | `createExtensionTester` + `renderInTestApp` |
| Multiple extensions with shared inputs | `createExtensionTester(...).add(...)` |
| Entity card or entity content extension | `renderTestApp` + `createTestEntityPage` |
| Component using `useRouteRef` | `renderInTestApp` / `renderTestApp` + `mountedRoutes` |
| Standalone render without test app | `TestApiProvider` + `@testing-library/react` `render` |
| Extension tree structure | `createExtensionTester(...).snapshot()` |

## Component tests (`renderInTestApp`)

Test components independently of a specific extension. `renderInTestApp` wraps the component in a Backstage test app with default APIs.

```tsx
import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { EntityDetails } from './EntityDetails';

describe('EntityDetails', () => {
  it('renders entity name and owner', async () => {
    await renderInTestApp(<EntityDetails owner="tools" name="test" />);

    await expect(
      screen.findByText('The entity "test" is owned by "tools"'),
    ).resolves.toBeInTheDocument();
  });
});
```

### Mock utility APIs

Pass API overrides via the `apis` option. Prefer `mockApis` helpers; use `[apiRef, implementation]` tuples for custom or plugin APIs.

```tsx
import { screen } from '@testing-library/react';
import { renderInTestApp, mockApis } from '@backstage/frontend-test-utils';
import { identityApiRef } from '@backstage/frontend-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { MyEntitiesList } from './MyEntitiesList';

describe('MyEntitiesList', () => {
  it('renders entities owned by the current user', async () => {
    await renderInTestApp(<MyEntitiesList />, {
      apis: [
        [
          identityApiRef,
          mockApis.identity({ userEntityRef: 'user:default/guest' }),
        ],
        [
          catalogApiRef,
          catalogApiMock({
            entities: [
              {
                apiVersion: 'backstage.io/v1alpha1',
                kind: 'Component',
                metadata: { name: 'my-component' },
                spec: { type: 'service', owner: 'user:default/guest' },
              },
            ],
          }),
        ],
      ],
    });

    await expect(screen.findByText('my-component')).resolves.toBeInTheDocument();
  });
});
```

`mockApis` supports fake instances (`mockApis.config({ data })`) and jest mocks (`mockApis.permission.mock({ authorize: ... })`).

## Extension tests (`createExtensionTester`)

```tsx
import { screen } from '@testing-library/react';
import { createExtensionTester, renderInTestApp } from '@backstage/frontend-test-utils';
import { indexPageExtension } from './plugin';

describe('Index page', () => {
  it('renders the index page', async () => {
    await renderInTestApp(
      createExtensionTester(indexPageExtension).reactElement(),
    );

    expect(screen.getByText('Index Page')).toBeInTheDocument();
  });
});
```

Key points:

- `.reactElement()` uses `coreExtensionData.reactElement` output; use `.get(dataRef)` for other output data.
- Pass `apis` and `config` to `createExtensionTester(extension, { apis, config })`.
- Add related extensions with `.add(otherExtension, { config })`.
- Query sibling extension output with `.query(extension).get(dataRef)`.
- Verify extension hierarchy with `expect(tester.snapshot()).toMatchInlineSnapshot()`.

Multiple extensions:

```tsx
const tester = createExtensionTester(indexPageExtension).add(indexPageHeader);
await renderInTestApp(tester.reactElement());
```

Extension + app config:

```tsx
await renderInTestApp(tester.reactElement(), {
  config: { app: { title: 'Custom app' } },
});
```

## Entity extension tests (`renderTestApp`)

Use `createTestEntityPage` from `@backstage/plugin-catalog-react/testUtils` for entity cards and content extensions.

```tsx
import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { myEntityCard } from './plugin';

describe('MyEntityCard', () => {
  it('renders for Component entities', async () => {
    const entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-service' },
      spec: { type: 'service', owner: 'team-a' },
    };

    renderTestApp({
      extensions: [createTestEntityPage({ entity }), myEntityCard],
    });

    expect(await screen.findByText('My Card Title')).toBeInTheDocument();
  });
});
```

Pass `apis` to `renderTestApp` when the extension uses `EntityRefLinks`, `useRelatedEntities`, or other API dependencies.

## Route ref tests (`mountedRoutes`)

When the component uses `useRouteRef`, mount the route in the test app:

```tsx
await renderInTestApp(<MyComponent />, {
  mountedRoutes: {
    '/my-plugin/details': detailsRouteRef,
  },
});

expect(await screen.findByText('View details')).toHaveAttribute(
  'href',
  '/my-plugin/details',
);
```

## Standalone API context (`TestApiProvider`)

Use only when not using `renderInTestApp` or `renderTestApp`:

```tsx
import { render } from '@testing-library/react';
import { TestApiProvider, mockApis } from '@backstage/frontend-test-utils';

render(
  <TestApiProvider apis={[mockApis.identity({ userEntityRef: 'user:default/guest' })]}>
    <MyComponent />
  </TestApiProvider>,
);
```

Prefer `apis` on `renderInTestApp` / `createExtensionTester` / `renderTestApp` when possible.

## Checklist before finishing

- [ ] Tests use `@backstage/frontend-test-utils`, not legacy test helpers
- [ ] Components tested with `renderInTestApp`; extensions with `createExtensionTester`
- [ ] Utility APIs mocked via `apis` option (not manual context wiring)
- [ ] Entity cards/content use `renderTestApp` + `createTestEntityPage`
- [ ] `useRouteRef` usage covered with `mountedRoutes`
- [ ] Assertions use `@testing-library/react` queries (`findBy*`, `getBy*`)
- [ ] Tests assert user-visible behavior, not implementation details
- [ ] `yarn test` passes in the target package

## Additional resources

- Extended examples, mockApis table, and anti-patterns: [reference.md](reference.md)
