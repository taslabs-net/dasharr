import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { clearDasharrSettingsCache } from '@/lib/dasharr-config';
import { logger } from '@/lib/logger';

const CONFIG_DIR = process.env.NODE_ENV === 'production' ? '/app/config' : './config';
const CONFIG_FILE = path.join(CONFIG_DIR, 'dasharr-settings.json');

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
}

async function loadSettings(): Promise<DasharrSettings> {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = await readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('Failed to load Dasharr settings:', error);
  }
  
  // Return defaults from environment or hardcoded
  return {
    timezone: 'America/New_York',
    logLevel: process.env.LOG_LEVEL || 'info',
    trustProxy: process.env.TRUST_PROXY === 'true',
    baseUrl: process.env.APP_URL || 'http://localhost:3000',
    refreshInterval: process.env.REFRESH_INTERVAL || '30',
    trustSelfSignedCerts: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0',
    pushInterval: process.env.METRICS_PUSH_INTERVAL ? String(parseInt(process.env.METRICS_PUSH_INTERVAL) / 1000) : '300',
    enablePush: process.env.ENABLE_METRICS_PUSH === 'true',
    pushTarget: process.env.CLOUDFLARE_WORKER_URL || '',
    pushSecret: process.env.DASHBOARD_SECRET || '',
    useQueue: process.env.USE_CLOUDFLARE_QUEUE === 'true',
  };
}

async function saveSettings(settings: DasharrSettings): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  await writeFile(CONFIG_FILE, JSON.stringify(settings, null, 2));
}

export async function GET(request: NextRequest) {
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
  try {
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings provided' },
        { status: 400 }
      );
    }
    
    // Add timestamp to settings before saving
    const settingsWithTimestamp = {
      ...settings,
      lastSaved: new Date().toISOString()
    };
    
    await saveSettings(settingsWithTimestamp);
    
    // Clear the cache so new settings are loaded
    clearDasharrSettingsCache();
    
    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings: settingsWithTimestamp 
    });
  } catch (error) {
    logger.error('Failed to save Dasharr settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}