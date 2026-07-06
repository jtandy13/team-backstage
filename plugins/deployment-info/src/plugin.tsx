import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { deploymentInfoEntityCard } from './extensions/entityCard';

export const deploymentInfoPlugin = createFrontendPlugin({
  pluginId: 'deployment-info',
  extensions: [deploymentInfoEntityCard],
});

export default deploymentInfoPlugin;
