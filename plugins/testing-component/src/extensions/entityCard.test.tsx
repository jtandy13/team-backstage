import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { testingComponentEntityCard } from './entityCard';

const STATUS_ANNOTATION = 'testing.backstage.io/status';

function renderEntityPage(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), testingComponentEntityCard],
  });
}

describe('testingComponentEntityCard filter', () => {
  it('renders the card for a Component entity with spec.type "service"', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        annotations: { [STATUS_ANNOTATION]: 'ok' },
      },
      spec: { type: 'service', owner: 'team-a' },
    };

    renderEntityPage(entity);

    await expect(
      screen.findByText('Testing component'),
    ).resolves.toBeInTheDocument();
  });

  it('does not render the card for a Component entity with a non-service spec.type', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-library',
        annotations: { [STATUS_ANNOTATION]: 'ok' },
      },
      spec: { type: 'library', owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Testing component')).not.toBeInTheDocument();
  });

  it('does not render the card for a non-Component entity kind', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'test-api',
        annotations: { [STATUS_ANNOTATION]: 'ok' },
      },
      spec: { type: 'service', owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Testing component')).not.toBeInTheDocument();
  });

  it('does not render the card for a Component entity missing spec.type', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-no-type',
        annotations: { [STATUS_ANNOTATION]: 'ok' },
      },
      spec: { owner: 'team-a' },
    };

    renderEntityPage(entity);

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Testing component')).not.toBeInTheDocument();
  });
});
