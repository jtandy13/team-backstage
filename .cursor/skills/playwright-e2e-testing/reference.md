# Playwright E2E Reference

## Existing app specs

- `packages/app/e2e-tests/app.test.ts` — welcome page, Guest login, sidebar links
- `packages/app/e2e-tests/deployment-info.test.ts` — entity card on catalog page (working reference)

## Example: entity card flow

For a plugin entity card on a `service` component (e.g. deployment-info on `example-service`):

```ts
import { test, expect, type Page } from '@playwright/test';

async function enterApp(page: Page) {
  await page.goto('/');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
}

test.describe('Deployment Info entity card', () => {
  test.beforeEach(async ({ page }) => {
    await enterApp(page);
  });

  test('shows mock deployment info on a service entity page', async ({
    page,
  }) => {
    await page.goto('/catalog/default/component/example-service');

    // InfoCard title is plain text, not a heading role
    await expect(page.getByText('Deployment Info', { exact: true })).toBeVisible();
    await expect(page.getByText('Connected to Kubernetes')).toBeVisible();
    await expect(page.getByText('svc-7bdfdc4cb4-tzj2v')).toBeVisible();
  });

  test('does not show the card on a non-service entity', async ({ page }) => {
    await page.goto('/catalog/default/component/example-website');

    await expect(
      page.getByText('Deployment Info', { exact: true }),
    ).not.toBeVisible();
  });
});
```

Adjust entity name, namespace, and assertions to match the feature. With `deploymentInfoSettings.useMock` enabled, assert values from `plugins/deployment-info/src/mockData.ts`.

## Debugging selector failures

When `toBeVisible()` times out, open the failure artifact:

```
node_modules/.cache/e2e-test-results/<test-name>/error-context.md
```

The YAML accessibility tree shows how Playwright sees the page — use it to pick `getByRole`, `getByText`, or `getByLabel` before guessing.

## Example: plugin route

If a plugin registers a top-level route (e.g. `/my-plugin`):

```ts
test('renders plugin page', async ({ page }) => {
  await enterApp(page);
  await page.goto('/my-plugin');
  await expect(page.getByRole('heading', { name: 'My Plugin' })).toBeVisible();
});
```

Find the path in the plugin's route extension or app registration. Page-level headings usually do expose heading roles; entity InfoCard titles often do not.

## Adding e2e-tests to a plugin package

1. Create `plugins/my-plugin/e2e-tests/my-feature.test.ts`.
2. Add devDependency in `plugins/my-plugin/package.json`:

```json
"@playwright/test": "^1.32.3"
```

3. Run from repo root: `yarn test:e2e plugins/my-plugin/e2e-tests/my-feature.test.ts`

`generateProjects()` picks up the folder automatically; no change to `playwright.config.ts` needed.

## When not to use Playwright

| Scenario | Use instead |
| --- | --- |
| React component rendering, extension isolation | [frontend-plugin-testing](../frontend-plugin-testing/SKILL.md) |
| Backend HTTP route, service factory | [backend-plugin-testing](../backend-plugin-testing/SKILL.md) |
| Utility API contract | [utility-api-testing](../utility-api-testing/SKILL.md) |

## CI notes

- E2e runs locally via `yarn test:e2e`; CI uses `.github/scripts/run-e2e.sh` when triggered.
- `PLAYWRIGHT_URL` defaults to `http://localhost:3000` (frontend). Backend listens on `7007`.
- Screenshots on failure; traces on first retry (`playwright.config.ts`).
