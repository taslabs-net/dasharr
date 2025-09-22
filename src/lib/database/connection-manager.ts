import Database from 'better-sqlite3';
import { logger } from '../logger';

/**
 * Connection manager for SQLite database
 * Implements connection reuse and query queuing for better concurrency
 * Note: SQLite doesn't support true connection pooling, but we can optimize access patterns
 */
export class DatabaseConnectionManager {
  private db: Database.Database;
  private queryQueue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;
  private connectionId: string;
  private queryCount: number = 0;
  private lastActivity: number = Date.now();
  private checkpointInterval: NodeJS.Timeout | null = null;

  constructor(dbPath: string, options?: Database.Options) {
    this.connectionId = Math.random().toString(36).substring(7);
    
    logger.info(`Opening database connection ${this.connectionId} to: ${dbPath}`);
    
    this.db = new Database(dbPath, {
      ...options,
      verbose: process.env.LOG_LEVEL === 'trace' ? ((msg?: unknown, ...args: unknown[]) => logger.trace(String(msg || ''), ...args)) : undefined
    });
    
    this.optimizeConnection();
    this.startMaintenanceTasks();
  }

  /**
   * Optimize SQLite connection for better performance
   */
  private optimizeConnection(): void {
    try {
      // Enable Write-Ahead Logging for better concurrency
      this.db.pragma('journal_mode = WAL');
      
      // Optimize for concurrent reads
      this.db.pragma('read_uncommitted = true');
      
      // Set reasonable cache size (32MB)
      this.db.pragma('cache_size = -32000');
      
      // Use memory for temporary tables
      this.db.pragma('temp_store = MEMORY');
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Optimize for SSD storage
      this.db.pragma('synchronous = NORMAL');
      
      // Set busy timeout to 5 seconds
      this.db.pragma('busy_timeout = 5000');
      
      logger.info(`Database connection ${this.connectionId} optimized for performance`);
    } catch (error) {
      logger.error(`Failed to optimize database connection ${this.connectionId}:`, error);
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Periodic WAL checkpoint (every 5 minutes)
    this.checkpointInterval = setInterval(() => {
      this.checkpoint();
    }, 5 * 60 * 1000);
    
    // Run initial checkpoint after 30 seconds
    setTimeout(() => this.checkpoint(), 30000);
  }

  /**
   * Execute a query with queuing support
   */
  async execute<T>(fn: (db: Database.Database) => T): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.lastActivity = Date.now();
          this.queryCount++;
          
          const result = fn(this.db);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      this.queryQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Process the query queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queryQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queryQueue.length > 0) {
      const task = this.queryQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          logger.error(`Query execution error in connection ${this.connectionId}:`, error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Run a transaction
   */
  transaction<T>(fn: (db: Database.Database) => T): T {
    const transaction = this.db.transaction(fn);
    this.lastActivity = Date.now();
    this.queryCount++;
    return transaction(this.db);
  }

  /**
   * Prepare a statement for reuse
   */
  prepare(sql: string): Database.Statement {
    return this.db.prepare(sql);
  }

  /**
   * Run WAL checkpoint
   */
  private checkpoint(): void {
    try {
      const result = this.db.pragma('wal_checkpoint(TRUNCATE)');
      
      // Only log if checkpoint did something
      if (result && typeof result === 'object' && 'busy' in result) {
        const info = result as { busy: number; log: number; checkpointed: number };
        if (info.busy === 0 && (info.log > 0 || info.checkpointed > 0)) {
          logger.debug(`Database checkpoint completed for ${this.connectionId}:`, {
            log_frames: info.log,
            checkpointed_frames: info.checkpointed
          });
        }
      }
    } catch (error) {
      logger.warn(`Checkpoint failed for connection ${this.connectionId}:`, error);
    }
  }

  /**
   * Optimize database (VACUUM and ANALYZE)
   */
  optimize(): void {
    try {
      logger.info(`Running database optimization for ${this.connectionId}...`);
      
      // Analyze tables for query optimizer
      this.db.exec('ANALYZE');
      
      // Note: VACUUM cannot be run within a transaction
      // and requires exclusive access to the database
      if (this.queryQueue.length === 0 && !this.isProcessing) {
        this.db.exec('VACUUM');
        logger.info(`Database optimization completed for ${this.connectionId}`);
      } else {
        logger.info(`Skipped VACUUM due to active operations`);
      }
    } catch (error) {
      logger.error(`Database optimization failed for ${this.connectionId}:`, error);
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connectionId: string;
    queryCount: number;
    queueLength: number;
    isProcessing: boolean;
    lastActivity: number;
    idleTime: number;
    cacheHitRate?: number;
    pageReads?: number;
    pageWrites?: number;
    databaseSizeBytes?: number;
  } {
    const stats: {
      connectionId: string;
      queryCount: number;
      queueLength: number;
      isProcessing: boolean;
      lastActivity: number;
      idleTime: number;
      cacheHitRate?: number;
      databaseSizeBytes?: number;
    } = {
      connectionId: this.connectionId,
      queryCount: this.queryCount,
      queueLength: this.queryQueue.length,
      isProcessing: this.isProcessing,
      lastActivity: this.lastActivity,
      idleTime: Date.now() - this.lastActivity
    };
    
    try {
      // Get cache statistics if available
      const cacheStats = this.db.pragma('cache_stats') as Record<string, unknown>;
      if (cacheStats && typeof cacheStats === 'object' && 'cache_hit_rate' in cacheStats) {
        stats.cacheHitRate = Number(cacheStats.cache_hit_rate);
      }
      
      // Get page statistics
      const pageCount = this.db.pragma('page_count');
      const pageSize = this.db.pragma('page_size');
      if (pageCount && pageSize) {
        stats.databaseSizeBytes = (pageCount as number) * (pageSize as number);
      }
    } catch {
      // Statistics not available
    }
    
    return stats;
  }

  /**
   * Check if connection is idle
   */
  isIdle(thresholdMs: number = 60000): boolean {
    return Date.now() - this.lastActivity > thresholdMs;
  }

  /**
   * Close the connection
   */
  close(): void {
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval);
      this.checkpointInterval = null;
    }
    
    // Final checkpoint
    this.checkpoint();
    
    // Close database
    this.db.close();
    
    logger.info(`Database connection ${this.connectionId} closed after ${this.queryCount} queries`);
  }

  /**
   * Get the raw database instance (use with caution)
   */
  getRawConnection(): Database.Database {
    return this.db;
  }
}

/**
 * Connection pool for managing multiple readers (SQLite specific optimization)
 */
export class DatabaseConnectionPool {
  private writeConnection: DatabaseConnectionManager;
  private readConnections: DatabaseConnectionManager[] = [];
  private maxReadConnections: number = 3; // SQLite works best with limited connections
  private currentReadIndex: number = 0;

  constructor(dbPath: string, options?: Database.Options) {
    // Main write connection
    this.writeConnection = new DatabaseConnectionManager(dbPath, options);
    
    // Create read connections for better concurrency
    // Note: SQLite allows multiple readers but only one writer
    for (let i = 0; i < this.maxReadConnections; i++) {
      this.readConnections.push(
        new DatabaseConnectionManager(dbPath, { ...options, readonly: true })
      );
    }
    
    logger.info(`Database connection pool initialized with 1 write + ${this.maxReadConnections} read connections`);
  }

  /**
   * Get a connection for reading (round-robin)
   */
  getReadConnection(): DatabaseConnectionManager {
    const connection = this.readConnections[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readConnections.length;
    return connection;
  }

  /**
   * Get the write connection
   */
  getWriteConnection(): DatabaseConnectionManager {
    return this.writeConnection;
  }

  /**
   * Execute a read query
   */
  async read<T>(fn: (db: Database.Database) => T): Promise<T> {
    const connection = this.getReadConnection();
    return connection.execute(fn);
  }

  /**
   * Execute a write query
   */
  async write<T>(fn: (db: Database.Database) => T): Promise<T> {
    return this.writeConnection.execute(fn);
  }

  /**
   * Run a transaction (always on write connection)
   */
  transaction<T>(fn: (db: Database.Database) => T): T {
    return this.writeConnection.transaction(fn);
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    writeConnection: ReturnType<DatabaseConnectionManager['getStats']>;
    readConnections: ReturnType<DatabaseConnectionManager['getStats']>[];
    totalQueries: number;
  } {
    return {
      writeConnection: this.writeConnection.getStats(),
      readConnections: this.readConnections.map(c => c.getStats()),
      totalQueries: this.writeConnection.getStats().queryCount + 
        this.readConnections.reduce((sum, c) => sum + c.getStats().queryCount, 0)
    };
  }

  /**
   * Optimize all connections
   */
  optimizeAll(): void {
    logger.info('Optimizing all database connections...');
    this.writeConnection.optimize();
    this.readConnections.forEach(c => c.optimize());
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    logger.info('Closing all database connections...');
    this.writeConnection.close();
    this.readConnections.forEach(c => c.close());
  }
}

// Note: For SQLite, "connection pooling" is really about managing concurrent access
// SQLite allows multiple readers but only one writer at a time
// This implementation optimizes for that pattern