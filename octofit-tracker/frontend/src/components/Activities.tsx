import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, type CapabilityItem } from './CapabilityCard.js';

export default function Activities() {
  const [items, setItems] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getJson<{ activities?: Array<{ type?: string; minutes?: number; points?: number }> }>('/api/activities')
      .then((data) => {
        if (ignore) return;
        const activities = (data.activities ?? []).map((activity, index) => ({
          id: `${activity.type ?? 'activity'}-${index}`,
          primary: activity.type ?? 'Activity',
          secondary: `${activity.minutes ?? 0} minutes • ${activity.points ?? 0} points`,
        }));
        setItems(activities);
        setError(null);
      })
      .catch((requestError) => {
        if (ignore) return;
        setError(requestError instanceof Error ? `Unable to load ${requestError.message.toLowerCase()}` : 'Unable to load activities');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  return <CapabilityCard title="Activities" description="Track student activity minutes and points." items={items} isLoading={loading} error={error} emptyMessage="No activities" />;
}
