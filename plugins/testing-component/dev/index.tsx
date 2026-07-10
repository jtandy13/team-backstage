import { createDevApp } from '@backstage/frontend-dev-utils';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import testingComponentPlugin from '../src/alpha';

createDevApp({
  features: [catalogPlugin, testingComponentPlugin],
});
