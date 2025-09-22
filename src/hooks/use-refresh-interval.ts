import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export function useRefreshInterval(): number {
  const [interval, setInterval] = useState<number>(30000); // Default 30 seconds

  useEffect(() => {
    // Fetch the refresh interval from the API
    const fetchInterval = async () => {
      try {
        const response = await fetch('/api/admin/dasharr');
        if (response.ok) {
          const data = await response.json();
          const refreshInterval = parseInt(data.settings?.refreshInterval || '30', 10);
          // Convert to milliseconds, 0 means no auto-refresh
          setInterval(refreshInterval === 0 ? 0 : refreshInterval * 1000);
        }
      } catch (error) {
        logger.error('Failed to fetch refresh interval:', error);
      }
    };

    fetchInterval();
  }, []);

  return interval;
}