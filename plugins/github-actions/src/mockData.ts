import type { GithubActionsRun } from './api';

/**
 * Static GitHub Actions workflow runs used while live integration is unavailable.
 * Set `githubActionsSettings.useMock` to `false` in `api.ts` to resume live fetches.
 */
export const MOCK_GITHUB_ACTIONS_RUNS: GithubActionsRun[] = [
  {
    workflow: 'deploy-grpc-prod',
    status: 'success',
    branch: 'main',
    timeAgo: '2 hours ago',
  },
  {
    workflow: 'deploy-grpc-staging',
    status: 'success',
    branch: 'main',
    timeAgo: '4 hours ago',
  },
  {
    workflow: 'pr-validation',
    status: 'failed',
    branch: 'feature/auth-update',
    timeAgo: '5 hours ago',
  },
];
