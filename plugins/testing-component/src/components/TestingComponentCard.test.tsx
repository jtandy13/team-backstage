import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { testingComponentEntityCard } from '../extensions/entityCard';

const STATUS_ANNOTATION = 'testing.backstage.io/status';

function createServiceEntity(annotations?: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-service',
      annotations,
    },
    spec: {
      type: 'service',
      owner: 'team-a',
    },
  };
}

function renderTestingComponentCard(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), testingComponentEntityCard],
  });
}

describe('TestingComponentCard', () => {
  it('renders the card title and "ok" status label', async () => {
    renderTestingComponentCard(
      createServiceEntity({ [STATUS_ANNOTATION]: 'ok' }),
    );

    await expect(
      screen.findByText('Testing component'),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText('Testing component (OK)')).toBeInTheDocument();
  });

  it('renders the "degraded" status label', async () => {
    renderTestingComponentCard(
      createServiceEntity({ [STATUS_ANNOTATION]: 'degraded' }),
    );

    await expect(
      screen.findByText('Testing component (Degraded)'),
    ).resolves.toBeInTheDocument();
  });
});
