import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard, type CapabilityItem } from './CapabilityCard.js';

export default function Workouts() {
  const [items, setItems] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const userEmail = 'mona@example.com';
    getJson<{ suggestions?: Array<{ title?: string; focus?: string; reason?: string; minutes?: number; difficulty?: string }> }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then((data) => {
        if (ignore) return;
        const suggestions = (data.suggestions ?? []).map((suggestion, index) => ({
          id: `${suggestion.title ?? 'workout'}-${index}`,
          primary: suggestion.title ?? 'Workout',
          secondary: suggestion.reason ?? `${suggestion.focus ?? 'General'} • ${suggestion.minutes ?? 0} minutes`,
        }));
        setItems(suggestions);
        setError(null);
      })
      .catch((requestError) => {
        if (ignore) return;
        setError(requestError instanceof Error ? `Unable to load ${requestError.message.toLowerCase()}` : 'Unable to load workouts');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." items={items} isLoading={loading} error={error} emptyMessage="No workout suggestions" />;
}
