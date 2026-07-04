# Backend Plugin Testing — Reference

## Module test example

Backend modules register against a plugin; pass the module (and plugin if required) in `features`:

```ts
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogPlugin } from '@backstage/plugin-catalog-backend';
import { myCatalogModule } from './module';

describe('myCatalogModule', () => {
  it('registers without error', async () => {
    await startTestBackend({
      features: [
        catalogPlugin(),
        myCatalogModule(),
        mockServices.rootConfig.factory({ data: {} }),
      ],
    });
  });
});
```

## Verifying multiple service calls

```ts
const mockReader = mockServices.urlReader.mock();

await startTestBackend({
  features: [myPlugin(), mockReader],
});

expect(mockReader.readUrl).toHaveBeenCalledWith('https://backstage.io');
```

## Testing with dynamic port

```ts
const { server } = await startTestBackend({ features: [myPlugin()] });
const port = server.port();
const response = await fetch(`http://127.0.0.1:${port}/api/example/health`);
expect(response.ok).toBe(true);
```

## package.json devDependencies template

```json
{
  "devDependencies": {
    "@backstage/backend-test-utils": "^1.10.0",
    "@types/supertest": "^6.0.0",
    "msw": "^2.0.0",
    "supertest": "^7.0.0"
  }
}
```

Match `@backstage/backend-test-utils` version to other `@backstage/*` packages in the monorepo.

## Anti-patterns

| Avoid | Use instead |
| --- | --- |
| Manually constructing `createBackend()` in tests | `startTestBackend` |
| Mocking fetch/axios at the client layer for integration tests | `msw` at the HTTP boundary |
| Creating multiple `TestDatabases.create()` in one file | One instance per test file |
| Testing against production URLs | `msw` handlers or `startTestBackend` mocks |
| Legacy `@backstage/backend-common` test helpers | `@backstage/backend-test-utils` |
| Skipping `registerMswTestHooks` with `msw` | Always register — prevents leaked network calls |

## Common failures

**`startTestBackend` hangs or times out** — Check for unresolved async init in plugin `registerInit` hooks; ensure mocked services supply required dependencies.

**Database tests pass locally, fail in CI** — Local runs only hit SQLite; CI runs all configured engines. Use `it.each(databases.eachSupportedId())` and fix dialect-specific SQL.

**404 on route tests** — Confirm the plugin registers routes via `httpRouter` and the path matches what the plugin exposes (often under `/api/<plugin-id>/...`).

**Missing service dependency** — Add the corresponding `mockServices.*.factory()` to `features`, or use `ServiceFactoryTester` with explicit dependencies.
