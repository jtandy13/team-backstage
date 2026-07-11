import { screen } from '@testing-library/react';
import { renderTestApp } from '@backstage/frontend-test-utils';
import { createTestEntityPage } from '@backstage/plugin-catalog-react/testUtils';
import { Entity } from '@backstage/catalog-model';
import { githubActionsEntityCard } from '../extensions/entityCard';
import { githubActionsSettings } from '../api';
import { MOCK_GITHUB_ACTIONS_RUNS } from '../mockData';

function createApiEntity(): Entity {
  return {
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
}

function renderGithubActionsCard(entity: Entity) {
  return renderTestApp({
    extensions: [createTestEntityPage({ entity }), githubActionsEntityCard],
  });
}

describe('GithubActionsCard', () => {
  const originalFetch = global.fetch;
  const originalUseMock = githubActionsSettings.useMock;

  afterEach(() => {
    global.fetch = originalFetch;
    githubActionsSettings.useMock = originalUseMock;
    jest.restoreAllMocks();
  });

  it('shows the "GitHub Actions" title and the mock workflow rows by default without calling fetch', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    renderGithubActionsCard(createApiEntity());

    await expect(
      screen.findByText('GitHub Actions'),
    ).resolves.toBeInTheDocument();

    for (const run of MOCK_GITHUB_ACTIONS_RUNS) {
      expect(screen.getByText(run.workflow)).toBeInTheDocument();
      expect(screen.getByText(run.timeAgo)).toBeInTheDocument();
    }

    const branches = new Set(MOCK_GITHUB_ACTIONS_RUNS.map(run => run.branch));
    for (const branch of branches) {
      expect(screen.getAllByText(branch).length).toBeGreaterThan(0);
    }

    const successCount = MOCK_GITHUB_ACTIONS_RUNS.filter(
      run => run.status === 'success',
    ).length;
    const failedCount = MOCK_GITHUB_ACTIONS_RUNS.filter(
      run => run.status === 'failed',
    ).length;
    expect(screen.getAllByText('Success')).toHaveLength(successCount);
    expect(screen.getAllByText('Failed')).toHaveLength(failedCount);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows an error warning when the live fetch is not implemented', async () => {
    githubActionsSettings.useMock = false;

    renderGithubActionsCard(createApiEntity());

    await expect(
      screen.findByText(/Could not load GitHub Actions/),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(/Live GitHub Actions fetch is not implemented/),
    ).toBeInTheDocument();
  });
});
