import { buildDeploymentInfoUrl, fetchDeploymentInfo } from './api';

describe('buildDeploymentInfoUrl', () => {
  it('constructs the deployment info URL from entity name and environment', () => {
    expect(buildDeploymentInfoUrl('my-service', 'prod')).toBe(
      'http://my-service-prod.local/api/v1/info',
    );
  });
});

describe('fetchDeploymentInfo', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the parsed deployment info on a successful response', async () => {
    const payload = {
      hostname: 'pod-abc123',
      time: '2026-07-05T00:00:00Z',
      deployed_on: 'kubernetes',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(payload),
    } as unknown as Response);

    const result = await fetchDeploymentInfo(
      'http://my-service-prod.local/api/v1/info',
    );

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://my-service-prod.local/api/v1/info',
    );
  });

  it('throws an error on a non-2xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: jest.fn(),
    } as unknown as Response);

    await expect(
      fetchDeploymentInfo('http://my-service-prod.local/api/v1/info'),
    ).rejects.toThrow('HTTP 503 from http://my-service-prod.local/api/v1/info');
  });
});
