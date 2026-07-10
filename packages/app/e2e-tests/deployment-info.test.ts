/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    await expect(
      page.getByText('Deployment Info', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Connected to Kubernetes')).toBeVisible();
    await expect(page.getByText('svc-7bdfdc4cb4-tzj2v')).toBeVisible();
    await expect(page.getByText('2026-07-04 10:58:12')).toBeVisible();
  });

  test('does not show the card on a non-service entity', async ({ page }) => {
    await page.goto('/catalog/default/component/example-website');

    await expect(
      page.getByText('Deployment Info', { exact: true }),
    ).not.toBeVisible();
  });
});
