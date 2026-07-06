import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { deploymentInfoEntityCard } from '../extensions/entityCard';
import { DeploymentInfoFetchError, fetchDeploymentInfo } from '../api';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';

jest.mock('../api', () => ({
  ...jest.requireActual('../api'),
  fetchDeploymentInfo: jest.fn(),
}));

const mockFetchDeploymentInfo = fetchDeploymentInfo as jest.MockedFunction<
  typeof fetchDeploymentInfo
>;

const entityWithAnnotation: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'my-service',
    annotations: {
      [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod',
    },
  },
  spec: { type: 'service', owner: 'team-a' },
};

const entityWithoutAnnotation: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'my-service' },
  spec: { type: 'service', owner: 'team-a' },
};

function renderCard(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), deploymentInfoEntityCard],
  });
}

describe('DeploymentInfoCard', () => {
  beforeEach(() => {
    mockFetchDeploymentInfo.mockReset();
  });

  it('shows a warning when the deployment environment annotation is missing', async () => {
    renderCard(entityWithoutAnnotation);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Missing deployment environment');
    expect(alert.textContent).toContain(DEPLOYMENT_ENVIRONMENT_ANNOTATION);
    expect(mockFetchDeploymentInfo).not.toHaveBeenCalled();
  });

  it('shows a progress indicator under the "Deployment Info" title while loading', async () => {
    mockFetchDeploymentInfo.mockReturnValue(new Promise(() => {}));

    renderCard(entityWithAnnotation);

    expect(await screen.findByText('Deployment Info')).toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error with URL and status details when the API request fails', async () => {
    mockFetchDeploymentInfo.mockRejectedValue(
      new DeploymentInfoFetchError(
        'Request to http://my-service-prod.local/api/v1/info failed with HTTP 503',
        'http://my-service-prod.local/api/v1/info',
        503,
      ),
    );

    renderCard(entityWithAnnotation);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load deployment info');
    expect(alert.textContent).toContain('HTTP status: 503');
    expect(alert.textContent).toContain(
      'http://my-service-prod.local/api/v1/info',
    );
  });

  it('shows hostname, time, and a Kubernetes badge on success', async () => {
    mockFetchDeploymentInfo.mockResolvedValue({
      hostname: 'pod-abc123',
      time: '2026-07-06T00:00:00Z',
      deployed_on: 'kubernetes',
    });

    renderCard(entityWithAnnotation);

    expect(await screen.findByText('pod-abc123')).toBeInTheDocument();
    expect(screen.getByText('2026-07-06T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('Connected to Kubernetes')).toBeInTheDocument();
  });

  it('does not show the Kubernetes badge when deployed_on is not kubernetes', async () => {
    mockFetchDeploymentInfo.mockResolvedValue({
      hostname: 'pod-abc123',
      time: '2026-07-06T00:00:00Z',
      deployed_on: 'bare-metal',
    });

    renderCard(entityWithAnnotation);

    expect(await screen.findByText('pod-abc123')).toBeInTheDocument();
    expect(
      screen.queryByText('Connected to Kubernetes'),
    ).not.toBeInTheDocument();
  });
});
