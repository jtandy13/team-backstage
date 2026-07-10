import { useMemo } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { Chip, Grid } from '@material-ui/core';
import {
  InfoCard,
  Progress,
  StructuredMetadataTable,
  WarningPanel,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { buildDeploymentInfoUrl, fetchDeploymentInfo } from '../api';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';

export const DeploymentInfoCard = () => {
  const { entity } = useEntity();
  const environment =
    entity.metadata.annotations?.[DEPLOYMENT_ENVIRONMENT_ANNOTATION];

  const deploymentInfoUrl = useMemo(() => {
    if (!environment) {
      return undefined;
    }

    return buildDeploymentInfoUrl(entity.metadata.name, environment);
  }, [entity.metadata.name, environment]);

  const {
    value: deploymentInfo,
    loading,
    error,
  } = useAsync(async () => {
    if (!deploymentInfoUrl) {
      return undefined;
    }

    return fetchDeploymentInfo(deploymentInfoUrl);
  }, [deploymentInfoUrl]);

  if (!environment) {
    return (
      <WarningPanel title="Missing deployment environment" severity="warning">
        Add the <code>{DEPLOYMENT_ENVIRONMENT_ANNOTATION}</code> annotation to
        this entity, for example <code>dev</code> or <code>prod</code>.
      </WarningPanel>
    );
  }

  if (loading) {
    return (
      <InfoCard title="Deployment Info">
        <Progress />
      </InfoCard>
    );
  }

  if (error || !deploymentInfo) {
    return (
      <WarningPanel title="Could not load deployment info" severity="error">
        {error?.message ??
          `Unable to load deployment info from ${deploymentInfoUrl}.`}
      </WarningPanel>
    );
  }

  return (
    <InfoCard title="Deployment Info">
      {deploymentInfo.deployed_on === 'kubernetes' && (
        <Grid container spacing={2}>
          <Grid item>
            <Chip
              label="Connected to Kubernetes"
              size="small"
              style={{
                backgroundColor: '#ff9800',
                color: '#fff',
              }}
            />
          </Grid>
        </Grid>
      )}
      <StructuredMetadataTable
        metadata={{
          'Live Pod Hostname': deploymentInfo.hostname,
          'Deployment Time': deploymentInfo.time,
        }}
      />
    </InfoCard>
  );
};
