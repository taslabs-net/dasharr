/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from 'better-sqlite3';
import { logger } from '../logger';
import path from 'path';
import fs from 'fs';

const CONFIG_DIR = process.env.CONFIG_DIR || '/app/config';
const DB_PATH = path.join(CONFIG_DIR, 'metrics.db');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

export class MetricsDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL'); // Better performance for concurrent access
    this.initialize();
  }

  private initialize() {
    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_instance_timestamp 
        ON metrics(instance_id, timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_metrics_service_timestamp 
        ON metrics(service_type, timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_metrics_name_timestamp 
        ON metrics(metric_name, timestamp);

      -- Table for storing raw JSON snapshots for backup/recovery
      CREATE TABLE IF NOT EXISTS metrics_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        snapshot_data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    logger.info('Metrics database initialized at', DB_PATH);
  }

  // Insert metrics from collector
  insertMetrics(data: Record<string, any>) {
    const insert = this.db.prepare(`
      INSERT INTO metrics (instance_id, service_type, metric_name, metric_value, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((entries: any[]) => {
      for (const entry of entries) {
        insert.run(entry);
      }
    });

    const timestamp = Math.floor(new Date(data.timestamp).getTime() / 1000);
    const entries: any[] = [];

    // Process each instance's metrics
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'timestamp' || key === 'collection_duration_ms') return;

      // Determine service type from instance ID
      const serviceType = key.includes('sonarr') ? 'sonarr' : 
                         key.includes('radarr') ? 'radarr' : 
                         key.includes('prowlarr') ? 'prowlarr' : 'unknown';

      if (typeof value === 'object' && value !== null) {
        // Flatten nested metrics
        Object.entries(value).forEach(([metricName, metricValue]) => {
          if (typeof metricValue === 'number') {
            entries.push([key, serviceType, metricName, metricValue, timestamp]);
          }
        });
      }
    });

    if (entries.length > 0) {
      insertMany(entries);
      logger.debug(`Inserted ${entries.length} metrics`);
    }

    // Also save raw snapshot
    this.saveSnapshot(data);
  }

  // Save raw JSON snapshot
  private saveSnapshot(data: any) {
    const stmt = this.db.prepare(`
      INSERT INTO metrics_snapshots (snapshot_data, timestamp)
      VALUES (?, ?)
    `);
    
    const timestamp = Math.floor(new Date(data.timestamp).getTime() / 1000);
    stmt.run(JSON.stringify(data), timestamp);
  }

  // Get metrics for a specific instance within a time range
  getMetricsForInstance(instanceId: string, startTime?: Date, endTime?: Date) {
    let query = `
      SELECT metric_name, metric_value, timestamp
      FROM metrics
      WHERE instance_id = ?
    `;
    
    const params: any[] = [instanceId];
    
    if (startTime) {
      query += ' AND timestamp >= ?';
      params.push(Math.floor(startTime.getTime() / 1000));
    }
    
    if (endTime) {
      query += ' AND timestamp <= ?';
      params.push(Math.floor(endTime.getTime() / 1000));
    }
    
    query += ' ORDER BY timestamp DESC';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Get latest metrics for all instances
  getLatestMetrics() {
    const query = `
      WITH latest_metrics AS (
        SELECT 
          instance_id,
          service_type,
          metric_name,
          metric_value,
          timestamp,
          ROW_NUMBER() OVER (PARTITION BY instance_id, metric_name ORDER BY timestamp DESC) as rn
        FROM metrics
        WHERE timestamp > strftime('%s', 'now', '-1 hour')
      )
      SELECT instance_id, service_type, metric_name, metric_value, timestamp
      FROM latest_metrics
      WHERE rn = 1
    `;
    
    return this.db.prepare(query).all();
  }

  // Get hourly aggregates for charting
  getHourlyAggregates(instanceId: string, metricName: string, hours: number = 24) {
    const query = `
      SELECT 
        strftime('%Y-%m-%d %H:00:00', datetime(timestamp, 'unixepoch')) as hour,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        COUNT(*) as sample_count
      FROM metrics
      WHERE instance_id = ?
        AND metric_name = ?
        AND timestamp > strftime('%s', 'now', '-${hours} hours')
      GROUP BY hour
      ORDER BY hour
    `;
    
    const stmt = this.db.prepare(query);
    return stmt.all(instanceId, metricName);
  }

  // Get daily aggregates for longer time ranges
  getDailyAggregates(instanceId: string, metricName: string, days: number = 30) {
    const query = `
      SELECT 
        date(datetime(timestamp, 'unixepoch')) as day,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        COUNT(*) as sample_count
      FROM metrics
      WHERE instance_id = ?
        AND metric_name = ?
        AND timestamp > strftime('%s', 'now', '-${days} days')
      GROUP BY day
      ORDER BY day
    `;
    
    const stmt = this.db.prepare(query);
    return stmt.all(instanceId, metricName);
  }

  // Clean up old data
  cleanupOldData(daysToKeep: number = 30) {
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
    
    const metricsDeleted = this.db.prepare('DELETE FROM metrics WHERE timestamp < ?').run(cutoffTime);
    const snapshotsDeleted = this.db.prepare('DELETE FROM metrics_snapshots WHERE timestamp < ?').run(cutoffTime);
    
    logger.info(`Cleaned up ${metricsDeleted.changes} metrics and ${snapshotsDeleted.changes} snapshots older than ${daysToKeep} days`);
  }

  // Get database stats
  getStats() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_metrics,
        COUNT(DISTINCT instance_id) as unique_instances,
        COUNT(DISTINCT metric_name) as unique_metrics,
        MIN(timestamp) as oldest_metric,
        MAX(timestamp) as newest_metric
      FROM metrics
    `).get() as {
      total_metrics: number;
      unique_instances: number;
      unique_metrics: number;
      oldest_metric: number | null;
      newest_metric: number | null;
    } | undefined;

    const dbSize = this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number } | undefined;

    if (!stats || !dbSize) {
      return {
        total_metrics: 0,
        unique_instances: 0,
        unique_metrics: 0,
        oldest_metric: null,
        newest_metric: null,
        database_size_bytes: 0,
        database_path: DB_PATH
      };
    }

    return {
      ...stats,
      database_size_bytes: dbSize.size,
      database_path: DB_PATH
    };
  }

  close() {
    this.db.close();
  }
}

// Export singleton instance
export const metricsDb = new MetricsDatabase();