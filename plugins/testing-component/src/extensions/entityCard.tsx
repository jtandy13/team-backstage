import { Entity } from '@backstage/catalog-model';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

function isServiceComponent(entity: Entity): boolean {
  return (
    entity.kind === 'Component' &&
    typeof entity.spec?.type === 'string' &&
    entity.spec.type === 'service'
  );
}

export const testingComponentEntityCard = EntityCardBlueprint.make({
  name: 'testing-component',
  params: {
    type: 'content',
    filter: isServiceComponent,
    loader: async () =>
      import('../components/TestingComponentCard').then(m => (
        <m.TestingComponentCard />
      )),
  },
});
