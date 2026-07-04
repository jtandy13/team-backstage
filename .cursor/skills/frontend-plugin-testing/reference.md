# Frontend Plugin Testing — Reference

## `renderInTestApp` options

| Option | Purpose |
| --- | --- |
| `apis` | Mock utility APIs (`mockApis.*` or `[apiRef, impl]` tuples) |
| `config` | App config JSON passed to the test app |
| `features` | Additional frontend features to register |
| `initialRouteEntries` | Router initial paths |
| `mountedRoutes` | Map paths to route refs for `useRouteRef` |

## `renderTestApp` options

Same `apis`, `config`, and `mountedRoutes` as `renderInTestApp`, plus:

| Option | Purpose |
| --- | --- |
| `extensions` | Extensions to mount in the test harness |

## Extension tester API

```tsx
const tester = createExtensionTester(myExtension, {
  apis: [[identityApiRef, mockApis.identity({ userEntityRef: 'user:default/guest' })]],
  config: { title: 'Custom' },
})
  .add(relatedExtension, { config: { title: 'Header' } });

await renderInTestApp(tester.reactElement());
const output = tester.query(relatedExtension).get(someDataRef);
expect(tester.snapshot()).toMatchInlineSnapshot();
```

## Core `mockApis` helpers

| API | Usage |
| --- | --- |
| `mockApis.alert()` | Alert collection; `.getAlerts()`, `.waitForAlert()` |
| `mockApis.analytics()` | Event collection; `.getEvents()` |
| `mockApis.config({ data })` | Config from plain JSON |
| `mockApis.discovery({ baseUrl })` | Discovery URLs |
| `mockApis.error(options?)` | Error collection |
| `mockApis.featureFlags(options?)` | In-memory flags |
| `mockApis.fetch(options?)` | Fetch with identity injection |
| `mockApis.identity(options?)` | User ref, ownership, token, profile |
| `mockApis.permission(options?)` | Defaults to ALLOW |
| `mockApis.storage({ data })` | In-memory storage |
| `mockApis.translation()` | Passthrough translations |

Each supports `.mock()` for jest.fn-based assertions.

## Plugin-specific mocks

Import from plugin `/testUtils` entry points when available:

```tsx
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
```

For custom plugin APIs, follow the `attachMockApiFactory` + `createApiMock` pattern (see [Testing with Utility APIs](https://backstage.io/docs/frontend-system/utility-apis/testing)).

## package.json devDependencies template

```json
{
  "devDependencies": {
    "@backstage/frontend-test-utils": "^0.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

Match `@backstage/frontend-test-utils` version to other `@backstage/*` packages in the monorepo.

## Interaction testing

```tsx
import userEvent from '@testing-library/user-event';

await renderInTestApp(<MyForm />);
await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
await expect(screen.findByText('Saved')).resolves.toBeInTheDocument();
```

## Anti-patterns

| Avoid | Use instead |
| --- | --- |
| Legacy `@backstage/test-utils` `renderInTestApp` | `@backstage/frontend-test-utils` |
| Manual `ApiProvider` wiring without test helpers | `renderInTestApp({ apis: [...] })` |
| Testing extension output by copying React tree internals | `createExtensionTester` + `.reactElement()` or `.get(dataRef)` |
| `TestApiProvider` when test app harness is available | `apis` option on `renderInTestApp` / `renderTestApp` |
| Shallow rendering Backstage components | Full render via test app helpers |
| Asserting on Material-UI class names | Query by role, label, or visible text |

## Common failures

**"Api ref not resolved" / missing context** — Add the required API to `apis` using `mockApis.*` or a plugin test mock.

**Route href is `#` or empty** — Add `mountedRoutes` mapping the path to your `RouteRef`.

**Entity card renders nothing** — Use `renderTestApp` with `createTestEntityPage({ entity })`; verify entity kind matches extension filters.

**Extension renders but wrong config** — Pass `config` to `createExtensionTester` and/or `renderInTestApp`.

**Async content not found** — Use `findBy*` queries and `await renderInTestApp(...)` (it returns a promise).
