import { DasharrDatabase } from './index';
import { logger } from '../logger';

let dbInstance: DasharrDatabase | null = null;
let initPromise: Promise<void> | null = null;

async function initializeDatabase(): Promise<void> {
  if (!dbInstance) {
    dbInstance = DasharrDatabase.getInstance();
    await dbInstance.ensureInitialized();
  }
}

// Singleton getter that ensures database is initialized
export async function getDb(): Promise<DasharrDatabase> {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  await initPromise;
  
  if (!dbInstance) {
    throw new Error('Database failed to initialize');
  }
  
  return dbInstance;
}

// Export a synchronous version for build-time usage
export function getDbSync(): DasharrDatabase {
  if (!dbInstance) {
    dbInstance = DasharrDatabase.getInstance();
    // During build, initialization happens synchronously
    logger.warn('Using synchronous database access - should only happen during build');
  }
  return dbInstance;
}