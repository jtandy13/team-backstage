import { Entity } from '@backstage/catalog-model';
import { EntityCardBlueprint } from '@backstage/plugin-catalog-react/alpha';

function isApiEntity(entity: Entity): boolean {
  return entity.kind.toLocaleLowerCase('en-US') === 'api';
}

export const githubActionsEntityCard = EntityCardBlueprint.make({
  name: 'github-actions',
  params: {
    type: 'content',
    filter: isApiEntity,
    loader: async () =>
      import('../components/GithubActionsCard').then(m => (
        <m.GithubActionsCard />
      )),
  },
});
