import {
  InfoCard,
  Progress,
  StructuredMetadataTable,
  WarningPanel,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import { useAsync } from 'react-use';
import { DeploymentInfoFetchError, fetchDeploymentInfo } from '../api';
import { DEPLOYMENT_ENVIRONMENT_ANNOTATION } from '../constants';

export const DeploymentInfoCard = () => {
  const { entity } = useEntity();
  const environment =
    entity.metadata.annotations?.[DEPLOYMENT_ENVIRONMENT_ANNOTATION];

  const { value, loading, error } = useAsync(async () => {
    if (!environment) {
      return undefined;
    }

    return fetchDeploymentInfo(entity.metadata.name, environment);
  }, [entity.metadata.name, environment]);

  if (!environment) {
    return (
      <InfoCard title="Deployment Info">
        <WarningPanel
          title="Missing deployment environment"
          message={
            <>
              Add the <code>{DEPLOYMENT_ENVIRONMENT_ANNOTATION}</code>{' '}
              annotation to this entity. For example, use <code>dev</code> or{' '}
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
    const url =
      error instanceof DeploymentInfoFetchError ? error.url : undefined;
    const status =
      error instanceof DeploymentInfoFetchError ? error.status : undefined;
    const detail = error instanceof Error ? error.message : 'Unknown error';

    return (
      <InfoCard title="Deployment Info">
        <WarningPanel
          title="Could not load deployment info"
          message={
            <>
              {detail}
              {status !== undefined && (
                <>
                  <br />
                  HTTP status: {status}
                </>
              )}
              {url && (
                <>
                  <br />
                  URL: {url}
                </>
              )}
            </>
          }
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
      <StructuredMetadataTable
        metadata={{
          'Live Pod Hostname': value?.hostname ?? '—',
          'Deployment Time': value?.time ?? '—',
        }}
      />
    </InfoCard>
  );
};
