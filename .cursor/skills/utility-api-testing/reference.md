# Utility API Testing — Reference

## `apis` array formats

The `apis` option accepts two entry shapes (both work in `renderInTestApp`, `renderTestApp`, `createExtensionTester`, and `TestApiProvider`):

**Built-in or plugin mocks with embedded factory** — pass the mock directly:

```tsx
apis: [
  mockApis.identity({ userEntityRef: 'user:default/guest' }),
  myApiMock({ greeting: 'Hi' }),
  myApiMock.mock({ greet: async () => 'mocked' }),
]
```

**Raw tuple** — pass `[apiRef, implementation]` for ad-hoc or partial mocks:

```tsx
apis: [[myCustomApiRef, { fetchItems: jest.fn().mockResolvedValue([]) }]]
```

## `attachMockApiFactory` vs `createApiMock`

| Helper | Returns | Use when |
| --- | --- | --- |
| `attachMockApiFactory(apiRef, impl)` | Mock with embedded `ApiFactory` | Fake instances that need real (simplified) behavior |
| `createApiMock(apiRef, () => jestMocks)` | `ApiMock<T>` with `.mock()` factory | Every method should be `jest.fn()` for call assertions |

`createApiMock` attaches the factory symbol automatically. Consumers pass the result of `.mock()` or the fake from `attachMockApiFactory` directly to `apis`.

## `mockApis.identity` options

Common options for auth-dependent components:

```tsx
mockApis.identity({
  userEntityRef: 'user:default/guest',
  ownershipEntityRefs: ['group:default/team-a'],
  getCredentials: async () => ({ token: 'test-token' }),
  profile: { displayName: 'Guest User', email: 'guest@example.com' },
})
```

## `mockApis.fetch` with identity

Use when components call backend APIs through the fetch API:

```tsx
mockApis.fetch({
  baseUrl: 'http://localhost:7007',
  identityApi: mockApis.identity({ userEntityRef: 'user:default/guest' }),
})
```

Pair with `registerMswTestHooks` from `@backstage/frontend-test-utils` when stubbing HTTP responses (see frontend plugin testing docs).

## `mockApis.permission` handler

```tsx
mockApis.permission({
  authorize: async request => ({
    result: request.permission.name === 'catalog.entity.read'
      ? AuthorizeResult.ALLOW
      : AuthorizeResult.DENY,
  }),
})
```

## Testing API implementation classes directly

When unit-testing the API factory or class in isolation (no React render), instantiate directly with mocked dependencies — no `renderInTestApp` needed:

```ts
import { MyApiImpl } from './MyApiImpl';

describe('MyApiImpl', () => {
  it('returns greeting', async () => {
    const api = new MyApiImpl({
      discoveryApi: mockApis.discovery(),
      fetchApi: mockApis.fetch(),
    });
    await expect(api.greet()).resolves.toBe('Hello!');
  });
});
```

Use core `mockApis.*` as dependency stubs. Reserve `attachMockApiFactory` / `createApiMock` for mocks you export to other packages.

## package.json template

```json
{
  "devDependencies": {
    "@backstage/frontend-test-utils": "^0.4.0",
    "@testing-library/react": "^16.0.0"
  },
  "exports": {
    ".": "./src/index.ts",
    "./testUtils": "./src/testUtils/index.ts"
  }
}
```

Match `@backstage/frontend-test-utils` version to other `@backstage/*` packages in the monorepo.

## Anti-patterns

| Avoid | Use instead |
| --- | --- |
| Legacy `@backstage/test-utils` `TestApiRegistry` | `@backstage/frontend-test-utils` `mockApis` |
| Manual `ApiProvider` + `ApiRegistry` wiring | `apis` option on test harness |
| `TestApiProvider` when `renderInTestApp` is available | `apis` on `renderInTestApp` |
| Inline `{ myMethod: jest.fn() }` in every test file | Reusable `myApiMock` in `/testUtils` |
| `.mock()` when test needs functional API behavior | Fake instance via `mockApis.foo()` or `myApiMock()` |
| Fake instance when you need call-count assertions | `.mock()` variant |

## Common failures

**"Api ref not resolved" / missing context** — Add the required API to `apis`. Check which `useApi(apiRef)` calls the component makes.

**Mock not picked up by test app** — Use `attachMockApiFactory` or `createApiMock` so the mock carries an embedded factory; raw objects need `[apiRef, impl]` tuple syntax.

**Jest mock methods not tracked** — Use `.mock()` variant, not a plain object with `jest.fn()` properties outside `createApiMock`.

**Plugin mock not importable** — Verify `package.json` exports `"./testUtils"` and the mock is re-exported from `src/testUtils/index.ts`.

**Permission-gated UI hidden** — Add `mockApis.permission()` (defaults to ALLOW) or a custom handler.

**Fetch calls fail or hit real network** — Use `mockApis.fetch()` and/or MSW hooks; set `discovery` base URL consistently.
