import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, type CapabilityItem } from './CapabilityCard.js';

export default function Leaderboard() {
  const [items, setItems] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getJson<{ leaderboard?: Array<{ teamName?: string; totalPoints?: number; rank?: number }> }>('/api/leaderboard')
      .then((data) => {
        if (ignore) return;
        const leaderboard = (data.leaderboard ?? []).map((entry, index) => ({
          id: `${entry.teamName ?? 'team'}-${index}`,
          primary: entry.teamName ?? 'Team',
          secondary: `${entry.totalPoints ?? 0} points • rank ${entry.rank ?? index + 1}`,
        }));
        setItems(leaderboard);
        setError(null);
      })
      .catch((requestError) => {
        if (ignore) return;
        setError(requestError instanceof Error ? `Unable to load ${requestError.message.toLowerCase()}` : 'Unable to load leaderboard');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  return <CapabilityCard title="Leaderboard" description="Compare team point totals." items={items} isLoading={loading} error={error} emptyMessage="No leaderboard scores" />;
}
