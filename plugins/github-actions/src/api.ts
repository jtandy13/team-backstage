import { MOCK_GITHUB_ACTIONS_RUNS } from './mockData';

export type GithubActionsRunStatus = 'success' | 'failed';

export type GithubActionsRun = {
  workflow: string;
  status: GithubActionsRunStatus;
  branch: string;
  timeAgo: string;
};

/**
 * When `useMock` is true, `fetchGithubActionsRuns` returns static mock data instead
 * of calling a live GitHub Actions endpoint. Set to `false` to resume live fetches.
 */
export const githubActionsSettings = {
  useMock: true,
};

/**
 * Returns recent workflow runs for an entity.
 * Live fetch is not implemented in this phase; mock mode is the default.
 */
export async function fetchGithubActionsRuns(
  _entityName: string,
): Promise<GithubActionsRun[]> {
  if (githubActionsSettings.useMock) {
    return MOCK_GITHUB_ACTIONS_RUNS;
  }

  throw new Error(
    'Live GitHub Actions fetch is not implemented. Set githubActionsSettings.useMock to true.',
  );
}
