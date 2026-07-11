import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { githubActionsEntityCard } from './extensions/entityCard';

export const githubActionsPlugin = createFrontendPlugin({
  pluginId: 'github-actions',
  extensions: [githubActionsEntityCard],
});
