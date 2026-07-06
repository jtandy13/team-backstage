export interface DeploymentInfo {
  hostname: string;
  time: string;
  deployed_on?: string;
  app_name?: string;
  env?: string;
  message?: string;
}

export function buildDeploymentInfoUrl(
  entityName: string,
  environment: string,
): string {
  return `http://${entityName}-${environment}.local/api/v1/info`;
}

export async function fetchDeploymentInfo(
  url: string,
): Promise<DeploymentInfo> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Could not reach ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${url}`);
  }

  return response.json();
}
