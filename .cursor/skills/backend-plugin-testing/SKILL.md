---
name: backend-plugin-testing
description: Builds tests for Backstage backend plugins and modules using @backstage/backend-test-utils (startTestBackend, mockServices, TestDatabases, ServiceFactoryTester, registerMswTestHooks). Use when writing or fixing backend plugin tests, backend module tests, service factory tests, database tests, or HTTP route tests for the new backend system.
---

# Backend Plugin and Module Testing

Official reference: [Testing Backend Plugins and Modules](https://backstage.io/docs/backend-system/building-plugins-and-modules/testing)

Use `@backstage/backend-test-utils` — not legacy backend testing patterns.

## Before writing tests

1. Confirm the package under test is a backend plugin or module (`backstage.role`: `backend-plugin` or `backend-plugin-module`).
2. Add devDependencies if missing:
   - `@backstage/backend-test-utils`
   - `supertest` and `@types/supertest` (HTTP route tests)
   - `msw` (remote HTTP interaction tests)
3. Colocate tests as `*.test.ts` next to the source file.
4. Run tests with `CI=true yarn test` in the package directory (see [yarn-test-ci](../yarn-test-ci/SKILL.md)). For a single file: `CI=true yarn test path/to/file.test.ts`.

## Choose the right harness

| What you are testing | Harness |
| --- | --- |
| Plugin/module HTTP routes or init behavior | `startTestBackend` |
| Calls to core services (logger, urlReader, etc.) | `startTestBackend` + `mockServices.*.mock()` |
| Outgoing HTTP to remote APIs | `msw` + `registerMswTestHooks` |
| Database access (Knex, migrations, queries) | `TestDatabases` |
| Plugin code that uses the database service | `TestDatabases` + `startTestBackend` + `mockServices.database.factory({ knex })` |
| A custom service factory in isolation | `ServiceFactoryTester` |

## Plugin and module tests (`startTestBackend`)

`startTestBackend` boots a backend harness with default mock services. Pass the plugin or module under test in `features`, plus any service overrides.

```ts
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { myPlugin } from './plugin';

describe('myPlugin', () => {
  it('serves config values', async () => {
    const fakeConfig = { myPlugin: { value: 7 } };
    const mockLogger = mockServices.logger.mock();

    const { server } = await startTestBackend({
      features: [
        myPlugin(),
        mockServices.rootConfig.factory({ data: fakeConfig }),
        mockLogger.factory,
      ],
    });

    const response = await request(server).get('/api/example/get-value');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ value: 7 });
    expect(mockLogger.info).toHaveBeenCalledWith('Starting myPlugin');
  });
});
```

Key points:

- `features` accepts backend plugins, modules, and service factory overrides.
- `server` works with `supertest`; use `server.port()` for lower-level network tests.
- Override config with `mockServices.rootConfig.factory({ data: fakeConfig })`.
- Verify service interactions with `mockServices.<name>.mock()` — use `.factory` in `features` and assert on the mock object after startup.

Available mock service factories: `auth`, `cache`, `database`, `discovery`, `events`, `httpAuth`, `httpRouter`, `lifecycle`, `logger`, `permissions`, `rootConfig`, `rootHealth`, `rootHttpRouter`, `rootLifecycle`, `rootLogger`, `scheduler`, `urlReader`, `userInfo`.

Partial mock implementations:

```ts
const partialImpl = jest.fn();
await startTestBackend({
  features: [
    myPlugin(),
    mockServices.urlReader.mock({ readUrl: partialImpl }),
  ],
});
```

## Remote HTTP tests (`msw`)

Mock remote servers at the HTTP layer — not local client stubs. Use `registerMswTestHooks` so unmatched requests fail and lifecycle is handled.

```ts
import { registerMswTestHooks } from '@backstage/backend-test-utils';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

describe('read from remote', () => {
  const worker = setupServer();
  registerMswTestHooks(worker);

  it('authenticates and reads successfully', async () => {
    worker.use(
      http.get('https://remote-server.com/api/v3/foo', ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer fake');
        return HttpResponse.json({ value: 7 });
      }),
    );

    // Exercise plugin/service with real HTTP clients
  });
});
```

Prefer `msw` v2 APIs (`http`, `HttpResponse`) unless the package already uses `rest` from v1.

## Database tests (`TestDatabases`)

Create **one** `TestDatabases` instance per test file inside `describe`. Spinning up engines is expensive.

```ts
import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';

describe('MyDatabaseClass', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_18', 'POSTGRES_14', 'SQLITE_3', 'MYSQL_8'],
  });

  async function createSubject(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    const subject = new MyDatabaseClass({ database: knex });
    await subject.runMigrations();
    return { knex, subject };
  }

  it.each(databases.eachSupportedId())(
    'returns rows on %p',
    async databaseId => {
      const { knex, subject } = await createSubject(databaseId);
      await knex('foo').insert({ value: 2 });
      await expect(subject.foos()).resolves.toEqual([{ value: 2 }]);
    },
  );
});
```

Local runs use SQLite only; when `CI` is set, all configured engines run.

Pass the test database into a plugin harness:

```ts
const { knex } = await createSubject(databaseId);
const { server } = await startTestBackend({
  features: [myPlugin(), mockServices.database.factory({ knex })],
});
```

Custom CI databases via env vars (when Docker/testcontainers unavailable):

- `BACKSTAGE_TEST_DATABASE_POSTGRES17_CONNECTION_STRING`
- `BACKSTAGE_TEST_DATABASE_POSTGRES13_CONNECTION_STRING`
- `BACKSTAGE_TEST_DATABASE_MYSQL8_CONNECTION_STRING`

## Service factory tests (`ServiceFactoryTester`)

```ts
import { mockServices, ServiceFactoryTester } from '@backstage/backend-test-utils';
import { myServiceFactory } from './myServiceFactory';

describe('myServiceFactory', () => {
  it('reads configured value', async () => {
    const fakeConfig = { myConfiguredValue: 7 };
    const tester = ServiceFactoryTester.from(myServiceFactory, {
      dependencies: [mockServices.rootConfig.factory({ data: fakeConfig })],
    });

    const myService = await tester.get('test-plugin');
    expect(myService.getValue()).toBe(7);
  });
});
```

`ServiceFactoryTester` provides default mocks for most core services when dependencies are omitted.

## Checklist before finishing

- [ ] Test file uses `@backstage/backend-test-utils`, not ad-hoc backend bootstrapping
- [ ] Plugin/module passed to `startTestBackend({ features: [...] })`
- [ ] Service overrides use `mockServices.*.factory()` or `.mock()` correctly
- [ ] HTTP routes tested with `supertest(server)`
- [ ] Remote HTTP stubbed with `msw` + `registerMswTestHooks`
- [ ] Database tests use a single `TestDatabases.create()` per file
- [ ] Tests assert behavior, not implementation details unrelated to the feature
- [ ] `CI=true yarn test` passes in the target package

## Additional resources

- Extended examples and anti-patterns: [reference.md](reference.md)
