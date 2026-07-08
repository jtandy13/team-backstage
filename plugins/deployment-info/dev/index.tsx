import { createDevApp } from '@backstage/frontend-dev-utils';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { deploymentInfoPlugin } from '../src/plugin';

createDevApp({
  features: [catalogPlugin, deploymentInfoPlugin],
});
