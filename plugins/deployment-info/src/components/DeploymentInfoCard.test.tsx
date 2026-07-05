import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { renderInTestApp } from '@backstage/frontend-test-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import { DeploymentInfoCard } from './DeploymentInfoCard';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';

function makeEntity(annotations?: Record<string, string>): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations,
    },
    spec: {
      type: 'service',
      owner: 'team-a',
    },
  };
}

async function renderCard(entity: Entity) {
  return renderInTestApp(
    <EntityProvider entity={entity}>
      <DeploymentInfoCard />
    </EntityProvider>,
  );
}

describe('DeploymentInfoCard', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('shows a warning when the deployment environment annotation is missing', async () => {
    await renderCard(makeEntity());

    expect(
      await screen.findByText(/Missing deployment environment/),
    ).toBeInTheDocument();
  });

  it('shows a loading indicator while fetching deployment info', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));

    await renderCard(
      makeEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    expect(await screen.findByTestId('progress')).toBeInTheDocument();
  });

  it('shows hostname, time, and a Kubernetes badge on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        hostname: 'pod-abc123',
        time: '2026-07-05T00:00:00Z',
        deployed_on: 'kubernetes',
      }),
    } as unknown as Response);

    await renderCard(
      makeEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    expect(await screen.findByText('pod-abc123')).toBeInTheDocument();
    expect(screen.getByText('2026-07-05T00:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('Connected to Kubernetes')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://my-service-prod.local/api/v1/info',
    );
  });

  it('shows an error message when the fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn(),
    } as unknown as Response);

    await renderCard(
      makeEntity({ [DEPLOYMENT_ENVIRONMENT_ANNOTATION]: 'prod' }),
    );

    expect(
      await screen.findByText(/Could not load deployment info/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'HTTP 500 from http://my-service-prod.local/api/v1/info',
      ),
    ).toBeInTheDocument();
  });
});
