import { logger } from './logger';
import { db } from './database';
import { getServiceInstances } from './config-db';
import { getCollectionInterval } from './metrics/scheduler';

export async function logStartupInfo() {
  try {
    // Log database status
    const dbStats = db.getStats();
    logger.info('🗄️  Database Status:', {
      path: '/app/config/dasharr.db',
      services: dbStats.services?.count || 0,
      metrics_stored: dbStats.metrics?.count || 0,
      size: `${dbStats.database_size?.size_mb || 0} MB`
    });

    // Check for migration
    const migrationPath = '/app/config/service-config.json.migrated';
    try {
      const fs = await import('fs/promises');
      await fs.access(migrationPath);
      logger.info('✅ Configuration migrated from JSON to SQLite');
    } catch {
      // No migration file, that's ok
    }

    // Log loaded services
    const services = getServiceInstances();
    const serviceList = Object.entries(services).map(([id, service]) => ({
      id,
      type: service.type,
      name: service.displayName,
      url: service.url,
      enabled: service.enabled
    }));

    if (serviceList.length > 0) {
      logger.info(`📡 Loaded ${serviceList.length} service(s) from database:`);
      serviceList.forEach(service => {
        const status = service.enabled ? '✓' : '✗';
        logger.info(`   ${status} ${service.name} (${service.type}) - ${service.url}`);
      });
    } else {
      logger.info('📡 No services configured yet');
    }

    // Log metrics collection status
    const collectionInterval = getCollectionInterval();
    logger.info(`📊 Metrics collection: Every ${collectionInterval} seconds`);

    // Log recent metrics
    if (dbStats.metrics && dbStats.metrics.count > 0) {
      const oldestDate = dbStats.metrics.oldest_timestamp ? new Date(dbStats.metrics.oldest_timestamp) : null;
      const newestDate = dbStats.metrics.newest_timestamp ? new Date(dbStats.metrics.newest_timestamp) : null;
      
      if (oldestDate && newestDate) {
        const daysDiff = Math.floor((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        logger.info(`   • ${dbStats.metrics.count} metrics stored (${daysDiff} days of history)`);
      }
    }

    // Log push configuration if enabled
    const pushConfig = db.getSetting('enablePush');
    if (pushConfig === 'true') {
      const pushTarget = db.getSetting('pushTarget');
      logger.info(`🚀 Push metrics: Enabled (${pushTarget})`);
    }

  } catch (error) {
    logger.error('Failed to log startup info:', error);
  }
}