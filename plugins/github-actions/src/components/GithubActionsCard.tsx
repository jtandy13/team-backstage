import useAsync from 'react-use/esm/useAsync';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
} from '@material-ui/core';
import {
  GitHubIcon,
  InfoCard,
  Progress,
  StatusError,
  StatusOK,
  WarningPanel,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  fetchGithubActionsRuns,
  type GithubActionsRun,
  type GithubActionsRunStatus,
} from '../api';

const useStyles = makeStyles(theme => ({
  tableWrap: {
    marginLeft: theme.spacing(-2),
    marginRight: theme.spacing(-2),
    marginBottom: theme.spacing(-1),
    marginTop: theme.spacing(-2),
  },
  headerCell: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  workflow: {
    fontWeight: 500,
  },
  branch: {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 14,
  },
  time: {
    color: theme.palette.text.secondary,
  },
  title: {
    alignItems: 'center',
    display: 'inline-flex',
    gap: theme.spacing(1),
  },
}));

function RunStatus({ status }: { status: GithubActionsRunStatus }) {
  if (status === 'success') {
    return <StatusOK>Success</StatusOK>;
  }

  return <StatusError>Failed</StatusError>;
}

function RunsTable({ runs }: { runs: GithubActionsRun[] }) {
  const classes = useStyles();

  return (
    <div className={classes.tableWrap}>
      <Table size="small" aria-label="GitHub Actions workflow runs">
        <TableHead>
          <TableRow>
            <TableCell className={classes.headerCell}>Workflow</TableCell>
            <TableCell className={classes.headerCell}>Status</TableCell>
            <TableCell className={classes.headerCell}>Branch</TableCell>
            <TableCell className={classes.headerCell}>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {runs.map(run => (
            <TableRow key={`${run.workflow}-${run.branch}-${run.timeAgo}`} hover>
              <TableCell>
                <Typography className={classes.workflow} variant="body2">
                  {run.workflow}
                </Typography>
              </TableCell>
              <TableCell>
                <RunStatus status={run.status} />
              </TableCell>
              <TableCell>
                <Typography className={classes.branch} variant="body2">
                  {run.branch}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography className={classes.time} variant="body2">
                  {run.timeAgo}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const GithubActionsCard = () => {
  const classes = useStyles();
  const { entity } = useEntity();

  const {
    value: runs,
    loading,
    error,
  } = useAsync(
    () => fetchGithubActionsRuns(entity.metadata.name),
    [entity.metadata.name],
  );

  const title = (
    <Box className={classes.title}>
      <GitHubIcon />
      GitHub Actions
    </Box>
  );

  if (loading) {
    return (
      <InfoCard title={title}>
        <Progress />
      </InfoCard>
    );
  }

  if (error || !runs) {
    return (
      <WarningPanel title="Could not load GitHub Actions" severity="error">
        {error?.message ?? 'Unable to load GitHub Actions workflow runs.'}
      </WarningPanel>
    );
  }

  return (
    <InfoCard title={title}>
      <RunsTable runs={runs} />
    </InfoCard>
  );
};
