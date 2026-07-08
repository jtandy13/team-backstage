import { createDevApp } from '@backstage/frontend-dev-utils';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import deploymentInfoPlugin from '../src/alpha';

createDevApp({
  features: [catalogPlugin, deploymentInfoPlugin],
});
