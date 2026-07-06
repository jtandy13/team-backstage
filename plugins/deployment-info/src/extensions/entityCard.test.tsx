import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { deploymentInfoEntityCard } from './entityCard';
import { fetchDeploymentInfo } from '../api';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  fetchDeploymentInfo: jest.fn(),
}));

const mockFetchDeploymentInfo = fetchDeploymentInfo as jest.MockedFunction<
  typeof fetchDeploymentInfo
>;

function renderForEntity(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), deploymentInfoEntityCard],
  });
}

describe('deploymentInfoEntityCard', () => {
  beforeEach(() => {
    mockFetchDeploymentInfo.mockReset();
    mockFetchDeploymentInfo.mockResolvedValue({
      hostname: 'pod-abc123',
      time: '2026-07-06T00:00:00Z',
    });
  });

  it('renders for a Component entity of spec.type service', async () => {
    renderForEntity({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-service' },
      spec: { type: 'service', owner: 'team-a' },
    });

    expect(await screen.findByText('Deployment Info')).toBeInTheDocument();
  });

  it('does not render for a Component entity of a different spec.type', async () => {
    renderForEntity({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-library' },
      spec: { type: 'library', owner: 'team-a' },
    });

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Deployment Info')).not.toBeInTheDocument();
  });

  it('does not render for a non-Component entity kind', async () => {
    renderForEntity({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: { name: 'my-api' },
      spec: { type: 'openapi', owner: 'team-a', lifecycle: 'production' },
    });

    expect(await screen.findByTestId('empty-entity-page')).toBeInTheDocument();
    expect(screen.queryByText('Deployment Info')).not.toBeInTheDocument();
  });
});
