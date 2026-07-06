import { buildDeploymentInfoUrl } from './constants';

export interface DeploymentInfo {
  hostname: string;
  time: string;
  deployed_on?: string;
  app_name?: string;
  env?: string;
  message?: string;
}

export class DeploymentInfoFetchError extends Error {
  constructor(message: string, readonly url: string, readonly status?: number) {
    super(message);
    this.name = 'DeploymentInfoFetchError';
  }
}

export async function fetchDeploymentInfo(
  entityName: string,
  environment: string,
): Promise<DeploymentInfo> {
  const url = buildDeploymentInfoUrl(entityName, environment);

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    throw new DeploymentInfoFetchError(
      `Failed to reach ${url}: ${message}`,
      url,
    );
  }

  if (!response.ok) {
    throw new DeploymentInfoFetchError(
      `Request to ${url} failed with HTTP ${response.status}`,
      url,
      response.status,
    );
  }

  return (await response.json()) as DeploymentInfo;
}
