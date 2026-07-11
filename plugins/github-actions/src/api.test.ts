import { fetchGithubActionsRuns, githubActionsSettings } from './api';
import { MOCK_GITHUB_ACTIONS_RUNS } from './mockData';

describe('fetchGithubActionsRuns', () => {
  const originalUseMock = githubActionsSettings.useMock;

  afterEach(() => {
    githubActionsSettings.useMock = originalUseMock;
    jest.restoreAllMocks();
  });

  describe('when useMock is true (default)', () => {
    it('resolves with the mock workflow runs without calling fetch', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');

      await expect(fetchGithubActionsRuns('my-service')).resolves.toEqual(
        MOCK_GITHUB_ACTIONS_RUNS,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('when useMock is false', () => {
    beforeEach(() => {
      githubActionsSettings.useMock = false;
    });

    it('throws because live fetch is not implemented', async () => {
      await expect(fetchGithubActionsRuns('my-service')).rejects.toThrow(
        'Live GitHub Actions fetch is not implemented. Set githubActionsSettings.useMock to true.',
      );
    });
  });
});
