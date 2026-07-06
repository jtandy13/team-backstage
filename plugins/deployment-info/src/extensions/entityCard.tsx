import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

export const deploymentInfoEntityCard = EntityCardBlueprint.make({
  name: 'deployment-info',
  params: {
    filter: { kind: 'component', 'spec.type': 'service' },
    loader: () =>
      import('../components/DeploymentInfoCard').then(m => (
        <m.DeploymentInfoCard />
      )),
  },
});
