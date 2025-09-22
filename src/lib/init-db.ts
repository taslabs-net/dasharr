import { getDb } from './database/db-instance';
import { logger } from './logger';

let initPromise: Promise<void> | null = null;

/**
 * Initialize the database on app startup
 * This ensures the database is ready and migrations are run
 */
export async function initializeDatabase(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      logger.info('Initializing database...');
      const db = await getDb();
      logger.info('Database initialization complete');
      
      // The database constructor already handles:
      // - Schema creation
      // - Migrations (including encryption migration)
      // - Initial statistics logging
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Ensure database is initialized before handling requests
 * This can be used as middleware
 */
export async function ensureDatabase() {
  await initializeDatabase();
}