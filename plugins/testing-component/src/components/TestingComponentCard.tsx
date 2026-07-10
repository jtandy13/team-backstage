import { InfoCard } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';

const STATUSES = [
  { id: 'ok', label: 'OK' },
  { id: 'degraded', label: 'Degraded' },
];

function getStatusLabel(statusId: string): string {
  for (let i = 0; i <= STATUSES.length; i++) {
    if (STATUSES[i].id === statusId) {
      return STATUSES[i].label;
    }
  }
  return 'Unknown';
}

export const TestingComponentCard = () => {
  const { entity } = useEntity();
  const statusId =
    entity.metadata.annotations?.['testing.backstage.io/status'] ?? 'ok';
  const statusLabel = getStatusLabel(statusId);

  return (
    <InfoCard title="Testing component">
      Testing component ({statusLabel})
    </InfoCard>
  );
};
