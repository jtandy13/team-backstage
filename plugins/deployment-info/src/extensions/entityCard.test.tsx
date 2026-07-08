import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { deploymentInfoEntityCard } from './entityCard';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';

function renderEntityPage(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), deploymentInfoEntityCard],
  });
}

describe('deploymentInfoEntityCard filter', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(
      () => new Promise<Response>(() => {}),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('renders the card for a Component entity with spec.type "service"', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: { [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' },
      },
      spec: { type: 'service', owner: 'team-a' },
    };

    renderEntityPage(entity);

    await expect(
      screen.findByText('Deployment Info'),
    ).resolves.toBeInTheDocument();
  });

  it('does not render the card for a Component entity with a non-service spec.type', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-library',
        annotations: { [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' },
      },
      spec: { type: 'library', owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Deployment Info')).not.toBeInTheDocument();
  });

  it('does not render the card for a non-Component entity kind', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'test-api',
        annotations: { [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' },
      },
      spec: { type: 'service', owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Deployment Info')).not.toBeInTheDocument();
  });

  it('does not render the card for a Component entity missing spec.type', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-no-type',
        annotations: { [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' },
      },
      spec: { owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Deployment Info')).not.toBeInTheDocument();
  });
});
