import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { testingComponentEntityCard } from './extensions/entityCard';

export const testingComponentPlugin = createFrontendPlugin({
  pluginId: 'testing-component',
  extensions: [testingComponentEntityCard],
});
