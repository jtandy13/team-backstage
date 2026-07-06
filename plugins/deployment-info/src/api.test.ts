import { DeploymentInfoFetchError, fetchDeploymentInfo } from './api';

describe('fetchDeploymentInfo', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the parsed JSON body on success', async () => {
    const body = {
      hostname: 'pod-abc123',
      time: '2026-07-06T00:00:00Z',
      deployed_on: 'kubernetes',
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);

    await expect(fetchDeploymentInfo('my-service', 'prod')).resolves.toEqual(
      body,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://my-service-prod.local/api/v1/info',
    );
  });

  it('throws a DeploymentInfoFetchError with the URL when the network request fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom'));

    const error = await fetchDeploymentInfo('my-service', 'prod').catch(e => e);

    expect(error).toBeInstanceOf(DeploymentInfoFetchError);
    expect(error).toMatchObject({
      url: 'http://my-service-prod.local/api/v1/info',
      status: undefined,
    });
    expect((error as DeploymentInfoFetchError).message).toContain('boom');
  });

  it('throws a DeploymentInfoFetchError with the URL and status on a non-2xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: jest.fn(),
    } as unknown as Response);

    const error = await fetchDeploymentInfo('my-service', 'prod').catch(e => e);

    expect(error).toBeInstanceOf(DeploymentInfoFetchError);
    expect(error).toMatchObject({
      url: 'http://my-service-prod.local/api/v1/info',
      status: 503,
    });
    expect((error as DeploymentInfoFetchError).message).toContain('503');
  });
});
