import { NextRequest, NextResponse } from 'next/server';
import { clearDasharrSettingsCache } from '@/lib/dasharr-config';
import { logger } from '@/lib/logger';
import { getDb } from '@/lib/database/db-instance';
import { requireAuth } from '@/lib/auth-middleware';

interface DasharrSettings {
  timezone?: string;
  logLevel?: string;
  trustProxy?: boolean;
  baseUrl?: string;
  refreshInterval?: string;
  trustSelfSignedCerts?: boolean;
  lastSaved?: string;
  pushInterval?: string;
  enablePush?: boolean;
  pushTarget?: string;
  pushSecret?: string;
  useQueue?: boolean;
  authEnabled?: boolean;
}

async function loadSettings(): Promise<DasharrSettings> {
  try {
    const db = await getDb();
    
    // Load all settings from database
    const settings: DasharrSettings = {
      timezone: db.getSetting('timezone') || process.env.TZ || 'America/New_York',
      logLevel: db.getSetting('logLevel') || process.env.LOG_LEVEL || 'info',
      trustProxy: db.getSetting('trustProxy') ?? (process.env.TRUST_PROXY === 'true'),
      baseUrl: db.getSetting('baseUrl') || process.env.APP_URL || 'http://localhost:3000',
      refreshInterval: db.getSetting('refreshInterval') || process.env.REFRESH_INTERVAL || '30',
      trustSelfSignedCerts: db.getSetting('trustSelfSignedCerts') ?? (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0'),
      pushInterval: db.getSetting('pushInterval') || (process.env.METRICS_PUSH_INTERVAL ? String(parseInt(process.env.METRICS_PUSH_INTERVAL) / 1000) : '300'),
      enablePush: db.getSetting('enablePush') ?? (process.env.ENABLE_METRICS_PUSH === 'true'),
      pushTarget: db.getSetting('pushTarget') || process.env.CLOUDFLARE_WORKER_URL || '',
      pushSecret: db.getSetting('pushSecret') || process.env.DASHBOARD_SECRET || '',
      useQueue: db.getSetting('useQueue') ?? (process.env.USE_CLOUDFLARE_QUEUE === 'true'),
      authEnabled: db.getSetting('authEnabled') ?? false,
      lastSaved: db.getSetting('lastSaved')
    };
    
    return settings;
  } catch (error) {
    logger.error('Failed to load Dasharr settings from database:', error);
    // Return defaults
    return {
      timezone: 'America/New_York',
      logLevel: 'info',
      trustProxy: false,
      baseUrl: 'http://localhost:3000',
      refreshInterval: '30',
      trustSelfSignedCerts: false,
      pushInterval: '300',
      enablePush: false,
      pushTarget: '',
      pushSecret: '',
      useQueue: false,
      authEnabled: false,
    };
  }
}

async function saveSettings(settings: DasharrSettings): Promise<void> {
  const db = await getDb();
  
  // Save each setting to database
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined && key !== 'lastSaved') {
      db.setSetting(key, value);
    }
  });
  
  // Add last saved timestamp
  db.setSetting('lastSaved', new Date().toISOString());
}

export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }
  
  try {
    const settings = await loadSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    logger.error('Failed to get Dasharr settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }
  
  try {
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings provided' },
        { status: 400 }
      );
    }
    
    // Save settings to database
    await saveSettings(settings);
    
    // Clear the cache so new settings are loaded
    clearDasharrSettingsCache();
    
    // Get updated settings including timestamp
    const updatedSettings = await loadSettings();
    
    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings: updatedSettings 
    });
  } catch (error) {
    logger.error('Failed to save Dasharr settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}