import {
  buildDeploymentInfoUrl,
  deploymentInfoSettings,
  fetchDeploymentInfo,
} from './api';
import { MOCK_DEPLOYMENT_INFO } from './mockData';

describe('buildDeploymentInfoUrl', () => {
  it('builds a URL from the entity name and environment', () => {
    expect(buildDeploymentInfoUrl('my-service', 'prod')).toBe(
      'http://my-service-prod.local/api/v1/info',
    );
  });

  it('reflects a different entity name and environment in the URL', () => {
    expect(buildDeploymentInfoUrl('other-service', 'dev')).toBe(
      'http://other-service-dev.local/api/v1/info',
    );
  });
});

describe('fetchDeploymentInfo', () => {
  const originalUseMock = deploymentInfoSettings.useMock;

  afterEach(() => {
    deploymentInfoSettings.useMock = originalUseMock;
  });

  describe('when useMock is true (default)', () => {
    it('resolves with the mock deployment info without calling fetch', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch');

      await expect(
        fetchDeploymentInfo('http://my-service-prod.local/api/v1/info'),
      ).resolves.toEqual(MOCK_DEPLOYMENT_INFO);
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('when useMock is false', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      deploymentInfoSettings.useMock = false;
    });

    afterEach(() => {
      global.fetch = originalFetch;
      jest.restoreAllMocks();
    });

    it('resolves with the parsed JSON body on a successful response', async () => {
      const body = {
        hostname: 'pod-abc123',
        time: '2026-07-07T00:00:00Z',
        deployed_on: 'kubernetes',
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => body,
      }) as unknown as typeof fetch;

      await expect(
        fetchDeploymentInfo('http://my-service-prod.local/api/v1/info'),
      ).resolves.toEqual(body);
    });

    it('throws an error including the status code when the response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      }) as unknown as typeof fetch;

      await expect(
        fetchDeploymentInfo('http://my-service-prod.local/api/v1/info'),
      ).rejects.toThrow(
        'Request failed with status 503 for http://my-service-prod.local/api/v1/info',
      );
    });

    it('throws an error including the underlying message when the network request fails', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(
          new Error('DNS resolution failed'),
        ) as unknown as typeof fetch;

      await expect(
        fetchDeploymentInfo('http://my-service-prod.local/api/v1/info'),
      ).rejects.toThrow(
        'Could not reach http://my-service-prod.local/api/v1/info: DNS resolution failed',
      );
    });

    it('wraps non-Error rejections with a generic message', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue('boom') as unknown as typeof fetch;

      await expect(
        fetchDeploymentInfo('http://my-service-prod.local/api/v1/info'),
      ).rejects.toThrow(
        'Could not reach http://my-service-prod.local/api/v1/info: Network request failed',
      );
    });
  });
});
