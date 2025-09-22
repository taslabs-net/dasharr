'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function StartupLogger() {
  useEffect(() => {
    // Call startup endpoint once on app load
    fetch('/api/startup')
      .then(() => logger.info('[Dasharr] Startup logging initialized'))
      .catch(err => logger.error('[Dasharr] Failed to log startup:', err));
  }, []);
  
  return null;
}