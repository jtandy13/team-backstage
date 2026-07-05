import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

export const deploymentInfoEntityCard = EntityCardBlueprint.make({
  name: 'deployment-info',
  params: {
    type: 'content',
    filter: {
      kind: 'component',
      'spec.type': 'service',
    },
    loader: async () =>
      import('../components/DeploymentInfoCard').then(m => (
        <m.DeploymentInfoCard />
      )),
  },
});
