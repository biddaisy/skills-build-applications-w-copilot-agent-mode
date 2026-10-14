import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, type CapabilityItem } from './CapabilityCard.js';

export default function Teams() {
  const [items, setItems] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getJson<{ teams?: Array<{ name?: string; members?: Array<string | { toString(): string }> }> }>('/api/teams')
      .then((data) => {
        if (ignore) return;
        const teams = (data.teams ?? []).map((team, index) => ({
          id: `${team.name ?? 'team'}-${index}`,
          primary: team.name ?? 'Team',
          secondary: team.members?.map((member) => String(member)).join(', ') || 'No members',
        }));
        setItems(teams);
        setError(null);
      })
      .catch((requestError) => {
        if (ignore) return;
        setError(requestError instanceof Error ? `Unable to load ${requestError.message.toLowerCase()}` : 'Unable to load teams');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  return <CapabilityCard title="Teams" description="Manage teams and members." items={items} isLoading={loading} error={error} emptyMessage="No teams" />;
}
