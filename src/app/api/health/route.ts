import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    filesystem: CheckResult;
    memory: CheckResult;
    configuration: CheckResult;
    services?: CheckResult;
  };
  details?: {
    version?: string;
    node_version: string;
    platform: string;
    memory_usage: {
      rss_mb: number;
      heap_used_mb: number;
      heap_total_mb: number;
      external_mb: number;
    };
  };
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  latency_ms?: number;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'pass' },
      filesystem: { status: 'pass' },
      memory: { status: 'pass' },
      configuration: { status: 'pass' }
    }
  };

  // Check 1: Database connectivity
  try {
    const dbStart = Date.now();
    const db = await getDb();
    
    // Verify we can query the database
    const testQuery = db.getSetting('db_version');
    const dbLatency = Date.now() - dbStart;
    
    health.checks.database = {
      status: 'pass',
      message: `Database connected (v${testQuery || '1'})`,
      latency_ms: dbLatency
    };
    
    // Warn if database is slow
    if (dbLatency > 1000) {
      health.checks.database.status = 'warn';
      health.checks.database.message = `Database slow (${dbLatency}ms)`;
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.database = {
      status: 'fail',
      message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    health.status = 'unhealthy';
  }

  // Check 2: Filesystem access
  try {
    const fsStart = Date.now();
    const configDir = process.env.CONFIG_DIR || '/app/config';
    
    // Check if config directory exists and is writable
    if (!fs.existsSync(configDir)) {
      throw new Error('Config directory does not exist');
    }
    
    // Test write access
    const testFile = path.join(configDir, '.health-check');
    fs.writeFileSync(testFile, new Date().toISOString());
    fs.unlinkSync(testFile);
    
    const fsLatency = Date.now() - fsStart;
    health.checks.filesystem = {
      status: 'pass',
      message: 'Filesystem accessible',
      latency_ms: fsLatency
    };
    
    if (fsLatency > 500) {
      health.checks.filesystem.status = 'warn';
      health.checks.filesystem.message = `Filesystem slow (${fsLatency}ms)`;
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.filesystem = {
      status: 'fail',
      message: `Filesystem error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    health.status = 'unhealthy';
  }

  // Check 3: Memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
  const rssMB = memUsage.rss / 1024 / 1024;
  
  health.checks.memory = {
    status: 'pass',
    message: `Heap: ${heapUsedMB.toFixed(1)}/${heapTotalMB.toFixed(1)}MB, RSS: ${rssMB.toFixed(1)}MB`
  };
  
  // Warn if memory usage is high
  if (heapUsedMB / heapTotalMB > 0.9) {
    health.checks.memory.status = 'warn';
    health.checks.memory.message = `High heap usage: ${(heapUsedMB / heapTotalMB * 100).toFixed(1)}%`;
    health.status = 'degraded';
  }
  
  if (rssMB > 500) {
    health.checks.memory.status = 'warn';
    health.checks.memory.message = `High memory usage: ${rssMB.toFixed(1)}MB`;
    health.status = 'degraded';
  }

  // Check 4: Configuration
  try {
    // Check for critical environment variables
    const requiredEnvVars = ['NODE_ENV'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      health.checks.configuration = {
        status: 'warn',
        message: `Missing env vars: ${missingVars.join(', ')}`
      };
      health.status = 'degraded';
    } else {
      health.checks.configuration = {
        status: 'pass',
        message: 'Configuration valid'
      };
    }
  } catch (error) {
    health.checks.configuration = {
      status: 'fail',
      message: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
    health.status = 'unhealthy';
  }

  // Check 5: Service connectivity (optional, only in detailed mode)
  if (detailed) {
    try {
      const db = await getDb();
      const services = await db.getAllServiceInstances();
      const enabledServices = services.filter(s => s.enabled);
      
      health.checks.services = {
        status: 'pass',
        message: `${enabledServices.length} services configured`
      };
      
      // Add detailed information
      health.details = {
        version: process.env.npm_package_version,
        node_version: process.version,
        platform: process.platform,
        memory_usage: {
          rss_mb: parseFloat(rssMB.toFixed(2)),
          heap_used_mb: parseFloat(heapUsedMB.toFixed(2)),
          heap_total_mb: parseFloat(heapTotalMB.toFixed(2)),
          external_mb: parseFloat((memUsage.external / 1024 / 1024).toFixed(2))
        }
      };
    } catch (error) {
      health.checks.services = {
        status: 'warn',
        message: 'Could not check services'
      };
    }
  }

  // Calculate total latency
  const totalLatency = Date.now() - startTime;
  
  // Log health check (only warnings and errors)
  if (health.status !== 'healthy') {
    logger.warn(`Health check: ${health.status}`, {
      checks: health.checks,
      latency_ms: totalLatency
    });
  }

  // Return appropriate HTTP status code
  const httpStatus = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: httpStatus });
}