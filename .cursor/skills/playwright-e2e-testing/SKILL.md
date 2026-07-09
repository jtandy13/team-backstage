---
name: playwright-e2e-testing
description: Writes Playwright end-to-end tests for Backstage features (frontend plugins, backend plugins, app routes, entity pages, scaffolder flows). Use when the user asks for e2e tests, Playwright tests, browser tests, or end-to-end coverage for a feature. When loaded automatically during unrelated feature work, the agent must ask the user before creating tests.
---

# Playwright E2E Testing

Browser-based end-to-end tests for this Backstage monorepo. E2e tests complement — do not replace — unit/component tests covered by [frontend-plugin-testing](../frontend-plugin-testing/SKILL.md) and [backend-plugin-testing](../backend-plugin-testing/SKILL.md).

## Invocation policy

Determine how this skill was loaded **before writing any test files**.

| How loaded | Required behavior |
| --- | --- |
| **Explicit** — user attached this skill, invoked it by name (e.g. `/playwright-e2e-testing`), or clearly asked to use this skill | Proceed with the workflow below. Create the tests the user requested. |
| **Intelligent** — you loaded this skill from its description while working on another task (feature implementation, bug fix, refactor) | **Do not create or modify e2e test files.** Ask the user first: whether they want Playwright e2e tests, which feature or flow to cover, and where tests should live. Only proceed after explicit approval. |

When asking, briefly propose test scope (user flows, key assertions, target package) so the user can confirm or adjust.

## Before writing tests

1. **Identify the feature under test** — plugin route, entity card, catalog page, scaffolder template, backend API surfaced in the UI, etc.
2. **Choose the package** — see [Where to put tests](#where-to-put-tests).
3. **Confirm dependencies** — target package needs `@playwright/test` in `devDependencies` (already on root and `packages/app`).
4. **Inspect existing patterns** — read `packages/app/e2e-tests/app.test.ts` and any colocated `e2e-tests/` specs.
5. **Prefer user-visible behavior** — navigate, click, and assert what a user sees; avoid testing implementation details better covered by unit tests.

## Where to put tests

Playwright discovers specs via `generateProjects()` in root `playwright.config.ts`. Any workspace package with an `e2e-tests/` folder becomes a Playwright project.

| Feature type | Preferred location |
| --- | --- |
| App-wide navigation, auth, cross-plugin flows | `packages/app/e2e-tests/` |
| Plugin UI integrated into the app (entity cards, routes registered in app) | `packages/app/e2e-tests/<feature>.test.ts` unless the plugin is reused across apps |
| Standalone plugin package with its own e2e surface | `<plugin-dir>/e2e-tests/` + add `@playwright/test` devDependency |
| Backend-only HTTP APIs | Prefer `startTestBackend` + `supertest` ([backend-plugin-testing](../backend-plugin-testing/SKILL.md)). Use Playwright only when validating behavior through the UI or a full stack flow. |

Name files `<feature>.test.ts` (e.g. `deployment-info.test.ts`).

## Test file template

Match the pattern in `packages/app/e2e-tests/app.test.ts`:

```ts
import { test, expect, type Page } from '@playwright/test';

async function enterApp(page: Page) {
  await page.goto('/');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
}

test.describe('Feature name', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('describes the user-visible outcome', async ({ page }) => {
    // navigate and assert
  });
});
```

### `failOnBrowserErrors()` — omit in this app

`@backstage/e2e-test-utils/playwright` provides `failOnBrowserErrors()` to fail on uncaught exceptions and `console.error` messages. **Do not use it in this repo's e2e specs today.** Guest sign-in uses Material-UI controls that emit `findDOMNode` deprecation warnings logged as console errors, which fail every spec before assertions run. Existing specs omit it for this reason.

Revisit only if sign-in stops emitting those warnings or Backstage provides a filtered variant.

## Writing good e2e tests

### Selectors

Prefer accessible selectors:

- `page.getByRole('button', { name: 'Enter' })`
- `page.getByRole('link', { name: 'Catalog', exact: true })`
- `page.getByRole('heading', { name: '...' })` — for page titles and card sections that expose heading roles

**InfoCard titles** (common on entity cards) often render as plain text, not a heading. Use `page.getByText('Card Title', { exact: true })` instead of `getByRole('heading', ...)`. When unsure, run the spec once and read the accessibility tree in Playwright's failure output (`error-context.md` under `node_modules/.cache/e2e-test-results/`).

Avoid brittle CSS/XPath unless no accessible alternative exists.

### Navigation patterns

- **Catalog entity page**: `/catalog/default/component/<entity-name>` (adjust namespace/kind as needed).
- **Plugin routes**: use the route path registered in the app; grep the plugin or `packages/app` for route refs.
- **Example entities**: see `examples/entities.yaml` for catalog fixtures (e.g. `example-service`).

### Scope

Cover happy-path user flows and one meaningful error or empty state when relevant. Do not duplicate every unit-test case at browser level.

For entity cards with kind/type filters, a useful e2e pair is: matching entity shows the card; non-matching entity does not.

When a plugin uses mock data locally (e.g. `deploymentInfoSettings.useMock`), assert against values in that plugin's `mockData.ts` — no live backend required.

### Auth

Local dev uses the Guest provider. The welcome-page **Enter** flow in `app.test.ts` is the standard login helper for e2e specs.

## Running tests

Playwright starts frontend and backend dev servers locally via `playwright.config.ts` (`yarn start app` + `yarn start backend`). Ensure `.env` exists (`cp .env.example .env`).

```bash
# All e2e specs
yarn test:e2e

# Single spec
yarn test:e2e packages/app/e2e-tests/app.test.ts
```

In CI-style runs, use `.github/scripts/run-e2e.sh` or set `CI=true` and `PLAYWRIGHT_URL=http://localhost:3000` as documented in `README.md`.

HTML reports: `e2e-test-report/`.

## Workflow

Copy and track:

```
E2E progress:
- [ ] Confirm invocation mode (explicit vs intelligent)
- [ ] Identify feature, flows, and target package
- [ ] Create or update e2e-tests/<feature>.test.ts
- [ ] Add @playwright/test devDependency if new package
- [ ] Run yarn test:e2e <path-to-spec>
- [ ] Fix failures and re-run until green
```

## Checklist before finishing

- [ ] Invocation policy followed (asked user first if intelligently invoked)
- [ ] Spec lives in an `e2e-tests/` folder under the correct package
- [ ] `failOnBrowserErrors()` omitted (known MUI sign-in console noise in this app)
- [ ] Tests use role-based or text selectors verified against the accessibility tree
- [ ] `yarn test:e2e` passes for the new or changed spec(s)
- [ ] No duplication of coverage already adequate at unit/component level

## Additional resources

- Example specs and entity-navigation notes: [reference.md](reference.md)
- Root config: `playwright.config.ts`
- Existing app specs: `packages/app/e2e-tests/app.test.ts`, `packages/app/e2e-tests/deployment-info.test.ts`
