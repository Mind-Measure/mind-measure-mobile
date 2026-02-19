import { useState, useEffect } from 'react';

export interface HubNudge {
  id: string;
  title: string;
  description: string;
  category: 'urgent' | 'social' | 'educational';
  eventDate?: string | null;
  linkUrl: string;
  status: string;
}

export function useActiveNudges(universityId: string | null | undefined) {
  const [nudges, setNudges] = useState<HubNudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!universityId) {
      setLoading(false);
      return;
    }

    async function fetchNudges() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/nudges/active?universityId=${universityId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setNudges(data.nudges || []);
      } catch (err) {
        console.error('[useActiveNudges] Error fetching nudges:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch nudges');
      } finally {
        setLoading(false);
      }
    }

    fetchNudges();
  }, [universityId]);

  return { nudges, loading, error };
}
