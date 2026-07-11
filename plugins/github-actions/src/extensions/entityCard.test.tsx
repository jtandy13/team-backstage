import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { githubActionsEntityCard } from './entityCard';

function renderEntityPage(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), githubActionsEntityCard],
  });
}

describe('githubActionsEntityCard filter', () => {
  // Mock mode is on by default (see `githubActionsSettings.useMock` in
  // `../api`), so the card resolves immediately with mock data and `fetch`
  // is never called. These tests only care whether the card mounts.

  it('renders the card for an API entity', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'test-api',
      },
      spec: {
        type: 'grpc',
        owner: 'team-a',
        lifecycle: 'production',
        definition: '',
      },
    };

    renderEntityPage(entity);

    await expect(
      screen.findByText('GitHub Actions'),
    ).resolves.toBeInTheDocument();
  });

  it('renders the card for an API entity kind regardless of casing', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Api',
      metadata: {
        name: 'test-api-lowercase',
      },
      spec: {
        type: 'grpc',
        owner: 'team-a',
        lifecycle: 'production',
        definition: '',
      },
    };

    renderEntityPage(entity);

    await expect(
      screen.findByText('GitHub Actions'),
    ).resolves.toBeInTheDocument();
  });

  it('does not render the card for a Component entity', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
      },
      spec: { type: 'service', owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('GitHub Actions')).not.toBeInTheDocument();
  });

  it('does not render the card for a Resource entity', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Resource',
      metadata: {
        name: 'test-resource',
      },
      spec: { type: 'database', owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('GitHub Actions')).not.toBeInTheDocument();
  });
});
