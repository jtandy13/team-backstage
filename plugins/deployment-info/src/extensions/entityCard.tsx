import { Entity } from '@backstage/catalog-model';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

function isServiceComponent(entity: Entity): boolean {
  return (
    entity.kind === 'Component' &&
    typeof entity.spec?.type === 'string' &&
    entity.spec.type === 'service'
  );
}

export const deploymentInfoEntityCard = EntityCardBlueprint.make({
  name: 'deployment-info',
  params: {
    type: 'content',
    filter: isServiceComponent,
    loader: async () =>
      import('../components/DeploymentInfoCard').then(m => (
        <m.DeploymentInfoCard />
      )),
  },
});
