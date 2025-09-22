/* eslint-disable @typescript-eslint/no-explicit-any */
import Database from 'better-sqlite3';
import { logger } from '../logger';
import path from 'path';
import fs from 'fs';
import { encryptSensitiveData, decryptSensitiveData, isEncrypted } from '../encryption';

const CONFIG_DIR = process.env.CONFIG_DIR || '/app/config';
const DB_PATH = path.join(CONFIG_DIR, 'dasharr.db');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  try {
    logger.info(`Creating config directory: ${CONFIG_DIR}`);
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    logger.info('Config directory created successfully');
  } catch (error) {
    // During build time, this might fail - that's okay
    logger.warn(`Could not create config directory: ${error}`);
  }
} else {
  logger.info(`Config directory already exists: ${CONFIG_DIR}`);
}

export class DasharrDatabase {
  private db: Database.Database;
  private static instance: DasharrDatabase;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Only use in-memory database during actual build processes (not production runtime)
    const isActualBuild = process.env.DOCKER_BUILD === 'true' || process.env.CI === 'true' || process.env.NEXT_PHASE === 'phase-production-build';
    
    if (isActualBuild) {
      logger.info('Build environment detected, using in-memory database');
      this.db = new Database(':memory:');
      this.initPromise = this.initialize();
      return;
    }
    
    logger.info(`Initializing SQLite database at: ${DB_PATH}`);
    try {
      // Check if config directory exists and is writable
      const configDir = path.dirname(DB_PATH);
      if (!fs.existsSync(configDir)) {
        logger.warn(`Config directory ${configDir} does not exist, creating...`);
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Verify config directory is writable
      try {
        const testFile = path.join(configDir, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        logger.info(`Config directory ${configDir} is writable`);
      } catch (writeError) {
        logger.error(`Config directory ${configDir} is not writable:`, writeError);
        throw new Error(`Config directory ${configDir} is not writable: ${writeError}`);
      }
      
      this.db = new Database(DB_PATH);
      logger.info(`SQLite database connection established at: ${DB_PATH}`);
      
      // Verify database file was actually created
      if (!fs.existsSync(DB_PATH)) {
        logger.error(`Database file was not created at expected path: ${DB_PATH}`);
        throw new Error(`Database file was not created at: ${DB_PATH}`);
      }
      
      logger.info(`Database file confirmed to exist at: ${DB_PATH}`);
      const stats = fs.statSync(DB_PATH);
      logger.info(`Database file size: ${stats.size} bytes`);
      
      // Set proper file permissions for security
      try {
        fs.chmodSync(DB_PATH, 0o600);
        logger.info('Set database file permissions to 0600 (owner read/write only)');
        
        // Also set permissions for WAL and SHM files if they exist
        const walPath = `${DB_PATH}-wal`;
        const shmPath = `${DB_PATH}-shm`;
        if (fs.existsSync(walPath)) {
          fs.chmodSync(walPath, 0o600);
          logger.info('Set WAL file permissions to 0600');
        }
        if (fs.existsSync(shmPath)) {
          fs.chmodSync(shmPath, 0o600);
          logger.info('Set SHM file permissions to 0600');
        }
      } catch (permError) {
        logger.warn('Could not set restrictive database file permissions:', permError);
      }
      
      // Set database pragmas with error handling
      try {
        this.db.pragma('journal_mode = WAL'); // Better performance
        logger.info('Database set to WAL mode for better performance');
      } catch (pragmaError) {
        logger.warn('Failed to set WAL mode, continuing with default journal mode');
      }
      
      try {
        this.db.pragma('foreign_keys = ON');   // Enable foreign key constraints
        logger.info('Foreign key constraints enabled');
      } catch (pragmaError) {
        logger.warn('Failed to enable foreign key constraints');
      }
      
      this.initPromise = this.initialize();
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      
      // Fallback to in-memory database for build scenarios
      if (error instanceof Error && (
        error.message?.includes('directory does not exist') ||
        error.message?.includes('database is locked') ||
        error.message?.includes('SQLITE_BUSY') ||
        error.message?.includes('readonly')
      )) {
        logger.warn('Database initialization failed, using in-memory database for build compatibility');
        this.db = new Database(':memory:');
        this.initPromise = this.initialize();
      } else {
        throw error;
      }
    }
  }

  static getInstance(): DasharrDatabase {
    if (!DasharrDatabase.instance) {
      DasharrDatabase.instance = new DasharrDatabase();
    }
    return DasharrDatabase.instance;
  }
  
  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async initialize() {
    this.db.exec(`
      -- Settings table for all app configuration
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'string', -- string, number, boolean, json
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- Service instances configuration
      CREATE TABLE IF NOT EXISTS service_instances (
        id TEXT PRIMARY KEY,
        service_type TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT,
        api_key TEXT,
        username TEXT,
        password TEXT,
        config_json TEXT, -- Additional config as JSON
        enabled BOOLEAN DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_service_type ON service_instances(service_type);

      -- Metrics data
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (instance_id) REFERENCES service_instances(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_lookup 
        ON metrics(instance_id, metric_name, timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp 
        ON metrics(timestamp);

      -- UI preferences (widget order, visibility, etc)
      CREATE TABLE IF NOT EXISTS ui_preferences (
        user_id TEXT DEFAULT 'default',
        page TEXT NOT NULL,
        preference_key TEXT NOT NULL,
        preference_value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (user_id, page, preference_key)
      );

      -- Cache table for API responses
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

      -- Audit log for changes
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        old_value TEXT,
        new_value TEXT,
        user_id TEXT DEFAULT 'system',
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- Create triggers for updated_at
      CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
        AFTER UPDATE ON settings 
        FOR EACH ROW 
        BEGIN 
          UPDATE settings SET updated_at = strftime('%s', 'now') WHERE key = NEW.key; 
        END;

      CREATE TRIGGER IF NOT EXISTS update_service_instances_timestamp 
        AFTER UPDATE ON service_instances 
        FOR EACH ROW 
        BEGIN 
          UPDATE service_instances SET updated_at = strftime('%s', 'now') WHERE id = NEW.id; 
        END;
    `);

    logger.info('Database schema created/verified successfully');
    
    // Run migrations if needed
    await this.runMigrations();
    
    logger.info(`Database fully initialized at ${DB_PATH}`);
    
    // Log initial statistics
    const stats = this.getStats();
    logger.info('Initial database statistics:', {
      services: stats.services?.count || 0,
      settings: stats.settings?.count || 0,
      metrics: stats.metrics?.count || 0,
      cache_entries: stats.cache_entries?.count || 0,
      database_size_mb: ((stats.database_size?.size || 0) / 1024 / 1024).toFixed(2)
    });
  }

  private async runMigrations() {
    logger.info('Checking database migrations...');
    
    // Check and apply migrations
    const currentVersion = this.getSetting('db_version') || '0';
    logger.info(`Current database version: ${currentVersion}`);
    
    // Create backup before migrations
    let backupData: string | null = null;
    try {
      backupData = await this.exportBackup();
      logger.info('Created backup before migrations');
    } catch (error) {
      logger.warn('Could not create backup before migration:', error);
    }
    
    if (currentVersion < '1') {
      await this.runMigrationWithTransaction('1', async () => {
        logger.info('Applying migration to version 1...');
        // Initial migration already done by CREATE TABLE IF NOT EXISTS
        this.setSetting('db_version', '1');
        logger.info('Database migrated to version 1');
      });
    }
    
    if (currentVersion < '2') {
      await this.runMigrationWithTransaction('2', async () => {
        logger.info('Applying migration to version 2: Encrypting sensitive data...');
        await this.encryptExistingData();
        this.setSetting('db_version', '2');
        logger.info('Database migrated to version 2');
      }, backupData);
    }
    
    // Add future migrations here
    
    const finalVersion = this.getSetting('db_version');
    logger.info(`Database migrations complete. Current version: ${finalVersion}`);
  }
  
  private async runMigrationWithTransaction(version: string, migration: () => Promise<void>, backupData?: string | null) {
    const savepoint = `migration_${version}`;
    
    try {
      // Start a savepoint for this specific migration
      this.db.prepare(`SAVEPOINT ${savepoint}`).run();
      
      // Run the migration
      await migration();
      
      // Release savepoint on success
      this.db.prepare(`RELEASE ${savepoint}`).run();
    } catch (error) {
      logger.error(`Migration to version ${version} failed:`, error);
      
      // Rollback to savepoint
      try {
        this.db.prepare(`ROLLBACK TO ${savepoint}`).run();
        logger.info(`Rolled back migration ${version}`);
      } catch (rollbackError) {
        logger.error(`Failed to rollback migration ${version}:`, rollbackError);
      }
      
      // If we have backup data, try to restore
      if (backupData) {
        try {
          logger.info('Attempting to restore from backup after failed migration...');
          await this.restoreFromBackup(backupData);
          logger.info('Successfully restored from backup');
        } catch (restoreError) {
          logger.error('Failed to restore from backup:', restoreError);
        }
      }
      
      throw new Error(`Migration to version ${version} failed: ${error}`);
    }
  }
  
  private async encryptExistingData() {
    logger.info('Starting encryption of existing sensitive data...');
    
    try {
      const rows = this.db.prepare('SELECT * FROM service_instances').all() as any[];
      let encryptedCount = 0;
      
      for (const row of rows) {
        let needsUpdate = false;
        let encryptedApiKey = row.api_key;
        let encryptedPassword = row.password;
        
        // Check if api_key needs encryption
        if (row.api_key && !isEncrypted(row.api_key)) {
          encryptedApiKey = await encryptSensitiveData(row.api_key);
          needsUpdate = true;
          logger.debug(`Encrypting API key for service ${row.id}`);
        }
        
        // Check if password needs encryption
        if (row.password && !isEncrypted(row.password)) {
          encryptedPassword = await encryptSensitiveData(row.password);
          needsUpdate = true;
          logger.debug(`Encrypting password for service ${row.id}`);
        }
        
        // Update if needed
        if (needsUpdate) {
          this.db.prepare(`
            UPDATE service_instances 
            SET api_key = ?, password = ?
            WHERE id = ?
          `).run(encryptedApiKey, encryptedPassword, row.id);
          
          encryptedCount++;
        }
      }
      
      logger.info(`Encrypted sensitive data for ${encryptedCount} service instances`);
    } catch (error) {
      logger.error('Failed to encrypt existing data:', error);
      throw error;
    }
  }

  // Settings operations
  getSetting(key: string): any {
    const row = this.db.prepare('SELECT value, type FROM settings WHERE key = ?').get(key) as { value: string; type: string } | undefined;
    if (!row) return null;
    
    // Convert based on type
    switch (row.type) {
      case 'number': return Number(row.value);
      case 'boolean': return row.value === 'true';
      case 'json': return JSON.parse(row.value);
      default: return row.value;
    }
  }

  setSetting(key: string, value: any) {
    let type = 'string';
    let storedValue = String(value);
    
    if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'object') {
      type = 'json';
      storedValue = JSON.stringify(value);
    }
    
    this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, type) 
      VALUES (?, ?, ?)
    `).run(key, storedValue, type);
  }

  getAllSettings(): Record<string, any> {
    const rows = this.db.prepare('SELECT key, value, type FROM settings').all() as Array<{ key: string; value: string; type: string }>;
    const settings: Record<string, any> = {};
    
    for (const row of rows) {
      switch (row.type) {
        case 'number':
          settings[row.key] = Number(row.value);
          break;
        case 'boolean':
          settings[row.key] = row.value === 'true';
          break;
        case 'json':
          settings[row.key] = JSON.parse(row.value);
          break;
        default:
          settings[row.key] = row.value;
      }
    }
    
    return settings;
  }

  // Service instance operations
  async getServiceInstance(id: string) {
    const row = this.db.prepare('SELECT * FROM service_instances WHERE id = ?').get(id) as any;
    if (!row) return null;
    
    // Decrypt sensitive fields
    if (row.api_key) {
      row.api_key = await decryptSensitiveData(row.api_key);
    }
    if (row.password) {
      row.password = await decryptSensitiveData(row.password);
    }
    
    if (row.config_json) {
      row.config = JSON.parse(row.config_json);
      delete row.config_json;
    }
    return row;
  }

  async getAllServiceInstances() {
    const rows = this.db.prepare('SELECT * FROM service_instances WHERE enabled = 1').all() as any[];
    const decryptedRows = [];
    
    for (const row of rows) {
      // Decrypt sensitive fields
      if (row.api_key) {
        row.api_key = await decryptSensitiveData(row.api_key);
      }
      if (row.password) {
        row.password = await decryptSensitiveData(row.password);
      }
      
      if (row.config_json) {
        row.config = JSON.parse(row.config_json);
        delete row.config_json;
      }
      decryptedRows.push(row);
    }
    
    return decryptedRows;
  }

  async getServiceInstancesByType(type: string) {
    const rows = this.db.prepare('SELECT * FROM service_instances WHERE service_type = ? AND enabled = 1').all(type) as any[];
    const decryptedRows = [];
    
    for (const row of rows) {
      // Decrypt sensitive fields
      if (row.api_key) {
        row.api_key = await decryptSensitiveData(row.api_key);
      }
      if (row.password) {
        row.password = await decryptSensitiveData(row.password);
      }
      
      if (row.config_json) {
        row.config = JSON.parse(row.config_json);
        delete row.config_json;
      }
      decryptedRows.push(row);
    }
    
    return decryptedRows;
  }

  async saveServiceInstance(instance: any) {
    const { id, service_type, name, url, api_key, username, password, enabled = true, ...config } = instance;
    
    const existingInstance = await this.getServiceInstance(id);
    const isNew = !existingInstance;
    
    logger.info(`${isNew ? 'Creating' : 'Updating'} service instance:`, {
      id,
      service_type,
      name,
      url: url ? '***' : null,
      has_api_key: !!api_key,
      has_credentials: !!(username || password),
      enabled
    });
    
    try {
      // Encrypt sensitive fields
      const encryptedApiKey = api_key ? await encryptSensitiveData(api_key) : null;
      const encryptedPassword = password ? await encryptSensitiveData(password) : null;
      
      this.db.prepare(`
        INSERT OR REPLACE INTO service_instances 
        (id, service_type, name, url, api_key, username, password, config_json, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        service_type,
        name,
        url || null,
        encryptedApiKey,
        username || null,
        encryptedPassword,
        Object.keys(config).length > 0 ? JSON.stringify(config) : null,
        enabled ? 1 : 0
      );
      
      logger.info(`Service instance ${id} saved successfully with encrypted credentials`);
    } catch (error) {
      logger.error(`Failed to save service instance ${id}:`, error);
      throw error;
    }
  }

  async deleteServiceInstance(id: string) {
    this.db.prepare('DELETE FROM service_instances WHERE id = ?').run(id);
  }

  // Metrics operations
  async insertMetrics(data: Record<string, any>) {
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

    for (const [instanceId, value] of Object.entries(data)) {
      if (instanceId === 'timestamp' || instanceId === 'collection_duration_ms') continue;

      const instance = await this.getServiceInstance(instanceId);
      if (!instance) continue;

      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([metricName, metricValue]) => {
          if (typeof metricValue === 'number') {
            entries.push([instanceId, instance.service_type, metricName, metricValue, timestamp]);
          }
        });
      }
    }

    if (entries.length > 0) {
      logger.info(`Inserting ${entries.length} metrics into database...`);
      const startTime = Date.now();
      
      try {
        insertMany(entries);
        const duration = Date.now() - startTime;
        logger.info(`Successfully inserted ${entries.length} metrics in ${duration}ms`);
        
        // Log summary by service type
        const summary: Record<string, number> = {};
        entries.forEach(([, serviceType]) => {
          summary[serviceType] = (summary[serviceType] || 0) + 1;
        });
        logger.debug('Metrics breakdown by service:', summary);
      } catch (error) {
        logger.error('Failed to insert metrics:', error);
        throw error;
      }
    } else {
      logger.warn('No metrics to insert - all values may be non-numeric or no instances configured');
    }
  }

  getLatestMetrics(instanceId?: string) {
    let query = `
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
    `;
    
    if (instanceId) {
      query += ` AND instance_id = '${instanceId}'`;
    }
    
    query += `
      )
      SELECT instance_id, service_type, metric_name, metric_value, timestamp
      FROM latest_metrics
      WHERE rn = 1
    `;
    
    return this.db.prepare(query).all() as any[];
  }

  getMetricHistory(instanceId: string, metricName: string, hours: number = 24) {
    const query = `
      SELECT 
        metric_value,
        timestamp
      FROM metrics
      WHERE instance_id = ?
        AND metric_name = ?
        AND timestamp > strftime('%s', 'now', '-${hours} hours')
      ORDER BY timestamp
    `;
    
    return this.db.prepare(query).all(instanceId, metricName) as any[];
  }

  // Cache operations
  getCache(key: string): any {
    const row = this.db.prepare('SELECT value FROM cache WHERE key = ? AND expires_at > strftime("%s", "now")').get(key) as any;
    return row ? JSON.parse(row.value) : null;
  }

  setCache(key: string, value: any, ttlSeconds: number = 300) {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, expires_at)
      VALUES (?, ?, ?)
    `).run(key, JSON.stringify(value), expiresAt);
  }

  clearExpiredCache() {
    const result = this.db.prepare('DELETE FROM cache WHERE expires_at < strftime("%s", "now")').run();
    return result.changes;
  }

  // UI preferences
  getUIPreference(page: string, key: string, userId: string = 'default'): any {
    const row = this.db.prepare(
      'SELECT preference_value FROM ui_preferences WHERE user_id = ? AND page = ? AND preference_key = ?'
    ).get(userId, page, key) as any;
    
    return row ? JSON.parse(row.preference_value) : null;
  }

  setUIPreference(page: string, key: string, value: any, userId: string = 'default') {
    this.db.prepare(`
      INSERT OR REPLACE INTO ui_preferences (user_id, page, preference_key, preference_value)
      VALUES (?, ?, ?, ?)
    `).run(userId, page, key, JSON.stringify(value));
  }

  // Cleanup operations
  cleanupOldMetrics(daysToKeep: number = 30) {
    const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
    const result = this.db.prepare('DELETE FROM metrics WHERE timestamp < ?').run(cutoffTime);
    logger.info(`Cleaned up ${result.changes} old metrics`);
    return result.changes;
  }

  // Database stats
  getStats() {
    const stats = {
      metrics: this.db.prepare('SELECT COUNT(*) as count FROM metrics').get() as any,
      services: this.db.prepare('SELECT COUNT(*) as count FROM service_instances').get() as any,
      settings: this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as any,
      cache_entries: this.db.prepare('SELECT COUNT(*) as count FROM cache').get() as any,
      database_size: this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get() as any
    };
    
    return stats;
  }

  // Backup/restore operations
  async exportBackup(): Promise<string> {
    return this.backup();
  }

  async restoreFromBackup(backupData: string): Promise<void> {
    return this.restore(backupData);
  }

  async backup(): Promise<string> {
    // Get raw encrypted data from database
    const data = {
      version: 2, // Version 2 includes encrypted data
      exported_at: new Date().toISOString(),
      settings: this.db.prepare('SELECT * FROM settings').all() as any[],
      service_instances: this.db.prepare('SELECT * FROM service_instances').all() as any[], // Keep encrypted
      ui_preferences: this.db.prepare('SELECT * FROM ui_preferences').all() as any[]
    };
    
    return JSON.stringify(data, null, 2);
  }

  async restore(backupData: string) {
    const data = JSON.parse(backupData);
    
    this.db.transaction(() => {
      // Clear existing data
      this.db.prepare('DELETE FROM settings').run();
      this.db.prepare('DELETE FROM service_instances').run();
      this.db.prepare('DELETE FROM ui_preferences').run();
      
      // Restore settings
      const insertSetting = this.db.prepare('INSERT INTO settings (key, value, type, updated_at) VALUES (?, ?, ?, ?)');
      for (const setting of data.settings) {
        insertSetting.run(setting.key, setting.value, setting.type, setting.updated_at);
      }
      
      // Restore service instances (data is already encrypted in backup)
      const insertInstance = this.db.prepare(`
        INSERT INTO service_instances 
        (id, service_type, name, url, api_key, username, password, config_json, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const instance of data.service_instances) {
        insertInstance.run(
          instance.id, instance.service_type, instance.name, instance.url,
          instance.api_key, instance.username, instance.password, instance.config_json,
          instance.enabled, instance.created_at, instance.updated_at
        );
      }
      
      // Restore UI preferences
      const insertPref = this.db.prepare(`
        INSERT INTO ui_preferences (user_id, page, preference_key, preference_value, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const pref of data.ui_preferences) {
        insertPref.run(pref.user_id, pref.page, pref.preference_key, pref.preference_value, pref.updated_at);
      }
    })();
    
    logger.info('Database restored from backup');
    
    // If restoring from version 1 backup (unencrypted), run migration
    if (data.version === 1) {
      logger.info('Detected version 1 backup, encrypting sensitive data...');
      await this.encryptExistingData();
    }
  }


  close() {
    this.db.close();
  }
}

// Export singleton instance and helper function
export const db = DasharrDatabase.getInstance();
export const getDb = async () => {
  const database = DasharrDatabase.getInstance();
  await database.ensureInitialized();
  return database;
};