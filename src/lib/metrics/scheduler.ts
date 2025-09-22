import { logger } from '../logger';
import { metricsCollector } from './collector';
import { db } from '../database';

let collectionInterval: NodeJS.Timeout | null = null;

export function startMetricsCollection(intervalSeconds: number = 60) {
  logger.info('=== Initializing Metrics Collection Scheduler ===');
  
  // Stop any existing interval
  stopMetricsCollection();
  
  logger.info(`Configuration: Collection interval set to ${intervalSeconds} seconds`);
  
  // Collect immediately on start
  logger.info('Running initial metrics collection...');
  collectMetrics().catch(error => {
    logger.error('Initial metrics collection failed:', error);
  });
  
  // Set up interval
  collectionInterval = setInterval(() => {
    logger.debug(`Metrics collection interval triggered at ${new Date().toISOString()}`);
    collectMetrics();
  }, intervalSeconds * 1000);
  
  logger.info(`Metrics scheduler started successfully - will collect every ${intervalSeconds} seconds`);
  logger.info('=== Metrics Collection Scheduler Ready ===');
}

export function stopMetricsCollection() {
  if (collectionInterval) {
    logger.info('Stopping metrics collection scheduler...');
    clearInterval(collectionInterval);
    collectionInterval = null;
    logger.info('Metrics collection scheduler stopped successfully');
  } else {
    logger.debug('Metrics collection scheduler was not running');
  }
}

async function collectMetrics() {
  const collectionId = Date.now();
  logger.info(`[Collection #${collectionId}] Starting scheduled metrics collection cycle`);
  
  try {
    const startTime = Date.now();
    
    // Check if collector is already running
    if (metricsCollector.isCurrentlyCollecting()) {
      logger.warn(`[Collection #${collectionId}] Previous collection still in progress, skipping this cycle`);
      return;
    }
    
    logger.debug(`[Collection #${collectionId}] Invoking metrics collector...`);
    
    // Collect metrics (this also saves to database)
    const metrics = await metricsCollector.collectAll();
    
    const duration = Date.now() - startTime;
    const instanceCount = metrics ? Object.keys(metrics).filter(k => k !== 'timestamp' && k !== 'collection_duration_ms').length : 0;
    
    logger.info(`[Collection #${collectionId}] Metrics collection cycle completed:`, {
      duration_ms: duration,
      instances_collected: instanceCount,
      timestamp: metrics?.timestamp || 'N/A'
    });
    
    // Log database stats periodically
    if (Math.random() < 0.1) { // 10% chance
      const stats = db.getStats();
      logger.info('Current database metrics statistics:', {
        total_metrics: stats.metrics?.count || 0,
        unique_instances: stats.services?.count || 0,
        database_size_mb: ((stats.database_size?.size || 0) / 1024 / 1024).toFixed(2)
      });
    }
    
    // Clean up old metrics periodically (every 100 collections)
    if (Math.random() < 0.01) {
      logger.info('Running periodic database cleanup...');
      const cleaned = db.cleanupOldMetrics(30); // Keep 30 days
      if (cleaned > 0) {
        logger.info(`Database cleanup completed: removed ${cleaned} old metric records`);
      } else {
        logger.debug('Database cleanup: no old records to remove');
      }
    }
  } catch (error) {
    logger.error(`[Collection #${collectionId}] Metrics collection failed:`, error);
  }
}

// Get collection interval from settings or environment
export function getCollectionInterval(): number {
  logger.debug('Determining metrics collection interval...');
  
  const settingInterval = db.getSetting('metricsCollectionInterval');
  if (settingInterval) {
    const interval = parseInt(settingInterval);
    logger.debug(`Using database setting for interval: ${interval} seconds`);
    return interval;
  }
  
  // Check environment variable
  const envInterval = process.env.METRICS_COLLECTION_INTERVAL;
  if (envInterval) {
    const interval = parseInt(envInterval);
    logger.debug(`Using environment variable for interval: ${interval} seconds`);
    return interval;
  }
  
  // Default to 60 seconds
  logger.debug('Using default collection interval: 60 seconds');
  return 60;
}