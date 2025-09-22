import { logger } from '../logger';

interface MetricsCacheEntry {
  data: unknown;
  timestamp: number;
  size: number;
}

interface MetricsCache {
  [key: string]: MetricsCacheEntry;
}

export class MetricsMemoryManager {
  private cache: MetricsCache = {};
  private maxCacheSize: number;
  private maxCacheAge: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanupTime: number = Date.now();

  constructor(
    maxCacheSizeMB: number = 50, // Max cache size in MB
    maxCacheAgeMinutes: number = 30 // Max age in minutes
  ) {
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert to bytes
    this.maxCacheAge = maxCacheAgeMinutes * 60 * 1000; // Convert to milliseconds
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
    
    logger.info('Metrics memory manager initialized', {
      maxCacheSizeMB,
      maxCacheAgeMinutes
    });
  }

  /**
   * Store metrics in cache with size tracking
   */
  store(key: string, data: unknown): void {
    const dataStr = JSON.stringify(data);
    const size = Buffer.byteLength(dataStr);
    
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      size
    };
    
    // Check if we need immediate cleanup
    if (this.getCacheSize() > this.maxCacheSize) {
      this.performCleanup();
    }
  }

  /**
   * Get metrics from cache
   */
  get(key: string): unknown | null {
    const entry = this.cache[key];
    if (!entry) return null;
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxCacheAge) {
      delete this.cache[key];
      return null;
    }
    
    return entry.data;
  }

  /**
   * Get current cache size in bytes
   */
  private getCacheSize(): number {
    return Object.values(this.cache).reduce((total, entry) => total + entry.size, 0);
  }

  /**
   * Perform cleanup of old and oversized cache
   */
  performCleanup(): number {
    const startTime = Date.now();
    const initialSize = this.getCacheSize();
    const initialCount = Object.keys(this.cache).length;
    
    // Remove expired entries
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of Object.entries(this.cache)) {
      if (now - entry.timestamp > this.maxCacheAge) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => delete this.cache[key]);
    
    // If still over size limit, remove oldest entries
    if (this.getCacheSize() > this.maxCacheSize) {
      const sortedEntries = Object.entries(this.cache)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      while (this.getCacheSize() > this.maxCacheSize * 0.8 && sortedEntries.length > 0) {
        const [key] = sortedEntries.shift()!;
        delete this.cache[key];
      }
    }
    
    const finalSize = this.getCacheSize();
    const finalCount = Object.keys(this.cache).length;
    const cleanupTime = Date.now() - startTime;
    
    if (initialCount !== finalCount) {
      logger.info('Metrics memory cleanup completed', {
        removed_entries: initialCount - finalCount,
        size_freed_mb: ((initialSize - finalSize) / 1024 / 1024).toFixed(2),
        remaining_entries: finalCount,
        remaining_size_mb: (finalSize / 1024 / 1024).toFixed(2),
        cleanup_time_ms: cleanupTime
      });
    }
    
    this.lastCleanupTime = Date.now();
    return initialCount - finalCount;
  }

  /**
   * Start periodic cleanup process
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      // Only run if it's been at least 5 minutes since last cleanup
      if (Date.now() - this.lastCleanupTime > 5 * 60 * 1000) {
        this.performCleanup();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop the memory manager and clean up
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear cache
    this.cache = {};
    logger.info('Metrics memory manager destroyed');
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    entries: number;
    size_mb: number;
    oldest_timestamp: number | null;
    newest_timestamp: number | null;
  } {
    const entries = Object.values(this.cache);
    const timestamps = entries.map(e => e.timestamp).sort((a, b) => a - b);
    
    return {
      entries: entries.length,
      size_mb: parseFloat((this.getCacheSize() / 1024 / 1024).toFixed(2)),
      oldest_timestamp: timestamps[0] || null,
      newest_timestamp: timestamps[timestamps.length - 1] || null
    };
  }

  /**
   * Force clear all cached data
   */
  clearAll(): void {
    const count = Object.keys(this.cache).length;
    const size = this.getCacheSize();
    
    this.cache = {};
    
    logger.info('Metrics cache forcefully cleared', {
      removed_entries: count,
      freed_size_mb: (size / 1024 / 1024).toFixed(2)
    });
  }
}

// Singleton instance
export const metricsMemoryManager = new MetricsMemoryManager();