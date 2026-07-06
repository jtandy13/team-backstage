import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { deploymentInfoEntityCard } from './extensions/entityCard';

export default createFrontendModule({
  pluginId: 'catalog',
  extensions: [deploymentInfoEntityCard],
});
