import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

// Store configurations in the mounted config directory
const CONFIG_DIR = process.env.NODE_ENV === 'production' ? '/app/config' : './config';
const CONFIG_FILE = path.join(CONFIG_DIR, 'service-config.json');

interface ServiceConfig {
  [service: string]: {
    url?: string;
    apiKey?: string;
    token?: string;
    username?: string;
    password?: string;
    apiKey1?: string;
    apiKey2?: string;
    apiKey3?: string;
    apiKey4?: string;
    apiKey5?: string;
    siteManagerApiKey?: string;
    lastSaved?: string;
    [key: string]: string | undefined; // Allow dynamic properties
  };
}

async function ensureConfigFile() {
  const dataDir = path.dirname(CONFIG_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    logger.info('Creating config directory:', dataDir);
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (mkdirError) {
      logger.error('Failed to create config directory:', mkdirError);
      throw mkdirError;
    }
  }

  try {
    await fs.access(CONFIG_FILE);
  } catch {
    logger.info('Creating initial config file:', CONFIG_FILE);
    try {
      await fs.writeFile(CONFIG_FILE, JSON.stringify({}));
    } catch (writeError) {
      logger.error('Failed to create config file:', writeError);
      throw writeError;
    }
  }
}

async function loadConfig(): Promise<ServiceConfig> {
  await ensureConfigFile();
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveConfig(config: ServiceConfig) {
  await ensureConfigFile();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    const config = await loadConfig();
    
    return NextResponse.json({
      settings: config[service] || {}
    });
  } catch (error) {
    logger.error('Failed to load config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings provided' },
        { status: 400 }
      );
    }

    const config = await loadConfig();
    
    // Add timestamp to settings before saving
    const settingsWithTimestamp = {
      ...settings,
      lastSaved: new Date().toISOString()
    };
    
    config[service] = settingsWithTimestamp;
    await saveConfig(config);
    
    return NextResponse.json({ 
      message: 'Configuration saved successfully',
      settings: settingsWithTimestamp
    });
  } catch (error) {
    logger.error('Failed to save config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}