import type { DeploymentInfo } from './api';

/**
 * Static deployment info used while the live service endpoint is unavailable.
 * Set `deploymentInfoSettings.useMock` to `false` in `api.ts` to resume live fetches.
 */
export const MOCK_DEPLOYMENT_INFO: DeploymentInfo = {
  hostname: 'svc-7bdfdc4cb4-tzj2v',
  time: '2026-07-04 10:58:12',
  deployed_on: 'kubernetes',
};
