import { buildDeploymentInfoUrl } from './constants';

describe('buildDeploymentInfoUrl', () => {
  it('builds a URL from the entity name and environment', () => {
    expect(buildDeploymentInfoUrl('my-service', 'prod')).toBe(
      'http://my-service-prod.local/api/v1/info',
    );
  });

  it('interpolates different entity names and environments', () => {
    expect(buildDeploymentInfoUrl('other-app', 'staging')).toBe(
      'http://other-app-staging.local/api/v1/info',
    );
  });
});
