export interface DeploymentInfo {
  hostname?: string;
  time?: string;
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return (await response.json()) as DeploymentInfo;
}
