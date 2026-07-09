import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { deploymentInfoEntityCard } from '../extensions/entityCard';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';
import { deploymentInfoSettings } from '../api';
import { MOCK_DEPLOYMENT_INFO } from '../mockData';

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

function renderDeploymentInfoCard(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), deploymentInfoEntityCard],
  });
}

describe('DeploymentInfoCard', () => {
  const originalFetch = global.fetch;
  const originalUseMock = deploymentInfoSettings.useMock;

  afterEach(() => {
    global.fetch = originalFetch;
    deploymentInfoSettings.useMock = originalUseMock;
    jest.restoreAllMocks();
  });

  it('shows a warning when the deployment environment annotation is missing', async () => {
    renderDeploymentInfoCard(createServiceEntity());

    await expect(
      screen.findByText(/Missing deployment environment/),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(DEPLOYMENT_ENVIRONMENT_ANNOTATION),
    ).toBeInTheDocument();
  });

  it('shows the mock deployment info by default without calling fetch', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    renderDeploymentInfoCard(
      createServiceEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    await expect(
      screen.findByText(MOCK_DEPLOYMENT_INFO.hostname),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText('Live Pod Hostname')).toBeInTheDocument();
    expect(screen.getByText('Deployment Time')).toBeInTheDocument();
    expect(screen.getByText(MOCK_DEPLOYMENT_INFO.time)).toBeInTheDocument();
    expect(screen.getByText('Connected to Kubernetes')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows a progress indicator under the "Deployment Info" title while loading', async () => {
    deploymentInfoSettings.useMock = false;
    global.fetch = jest.fn(
      () => new Promise<Response>(() => {}),
    ) as unknown as typeof fetch;

    renderDeploymentInfoCard(
      createServiceEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    await expect(
      screen.findByText('Deployment Info'),
    ).resolves.toBeInTheDocument();
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('shows the live pod hostname, deployment time, and Kubernetes badge on success', async () => {
    deploymentInfoSettings.useMock = false;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hostname: 'pod-abc123',
        time: '2026-07-07T00:00:00Z',
        deployed_on: 'kubernetes',
      }),
    }) as unknown as typeof fetch;

    renderDeploymentInfoCard(
      createServiceEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    await expect(screen.findByText('pod-abc123')).resolves.toBeInTheDocument();
    expect(screen.getByText('Live Pod Hostname')).toBeInTheDocument();
    expect(screen.getByText('Deployment Time')).toBeInTheDocument();
    expect(screen.getByText('2026-07-07T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('Connected to Kubernetes')).toBeInTheDocument();
  });

  it('does not show the Kubernetes badge when not deployed on kubernetes', async () => {
    deploymentInfoSettings.useMock = false;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hostname: 'pod-xyz789',
        time: '2026-07-07T00:00:00Z',
        deployed_on: 'ec2',
      }),
    }) as unknown as typeof fetch;

    renderDeploymentInfoCard(
      createServiceEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    await expect(screen.findByText('pod-xyz789')).resolves.toBeInTheDocument();
    expect(
      screen.queryByText('Connected to Kubernetes'),
    ).not.toBeInTheDocument();
  });

  it('shows an error warning with details when the API call fails', async () => {
    deploymentInfoSettings.useMock = false;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    renderDeploymentInfoCard(
      createServiceEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    await expect(
      screen.findByText(/Could not load deployment info/),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(/Request failed with status 500/),
    ).toBeInTheDocument();
  });

  it('shows an error warning with details when the network request fails', async () => {
    deploymentInfoSettings.useMock = false;
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new Error('DNS resolution failed'),
      ) as unknown as typeof fetch;

    renderDeploymentInfoCard(
      createServiceEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    await expect(
      screen.findByText(/Could not load deployment info/),
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/DNS resolution failed/)).toBeInTheDocument();
  });
});
