import { InfoCard } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';

const STATUSES = [
  { id: 'ok', label: 'OK' },
  { id: 'degraded', label: 'Degraded' },
];

export const TestingComponentCard = () => {
  const { entity } = useEntity();
  const statusId =
    entity.metadata.annotations?.['testing.backstage.io/status'] ?? 'unknown';
  // Intentionally unsafe: find() can return undefined when statusId is unknown.
  const statusLabel = STATUSES.find(s => s.id === statusId)!.label;

  return (
    <InfoCard title="Testing component">
      Testing component ({statusLabel})
    </InfoCard>
  );
};
