export const DEPLOYMENT_ENVIRONMENT_ANNOTATION =
  'deployment.backstage.io/environment';

export function buildDeploymentInfoUrl(
  entityName: string,
  environment: string,
): string {
  return `http://${entityName}-${environment}.local/api/v1/info`;
}
