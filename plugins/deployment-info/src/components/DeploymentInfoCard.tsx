import { InfoCard, Progress, WarningPanel } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import useAsync from 'react-use/esm/useAsync';
import { buildDeploymentInfoUrl, fetchDeploymentInfo } from '../api';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';

export function DeploymentInfoCard() {
  const { entity } = useEntity();
  const environment =
    entity.metadata.annotations?.[DEPLOYMENT_ENVIRONMENT_ANNOTATION];
  const url =
    environment !== undefined
      ? buildDeploymentInfoUrl(entity.metadata.name, environment)
      : undefined;

  const { value, loading, error } = useAsync(async () => {
    if (!url) {
      return undefined;
    }
    return fetchDeploymentInfo(url);
  }, [url]);

  if (!environment) {
    return (
      <InfoCard title="Deployment Info">
        <WarningPanel
          title="Missing deployment environment"
          message={
            <>
              Add the <code>deployment.backstage.io/environment</code>{' '}
              annotation to this entity. Examples: <code>dev</code> or{' '}
              <code>prod</code>.
            </>
          }
        />
      </InfoCard>
    );
  }

  if (loading) {
    return (
      <InfoCard title="Deployment Info">
        <Progress />
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title="Deployment Info">
        <WarningPanel
          title="Could not load deployment info"
          message={error.message}
        />
      </InfoCard>
    );
  }

  return (
    <InfoCard title="Deployment Info">
      {value?.deployed_on === 'kubernetes' && (
        <Box marginBottom={2}>
          <Chip label="Connected to Kubernetes" color="primary" size="small" />
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Live Pod Hostname</Typography>
          <Typography variant="body2">{value?.hostname ?? '—'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2">Deployment Time</Typography>
          <Typography variant="body2">{value?.time ?? '—'}</Typography>
        </Grid>
      </Grid>
    </InfoCard>
  );
}
