import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

const CONFIG_DIR = process.env.NODE_ENV === 'production' ? '/app/config' : './config';
const CONFIG_FILE = path.join(CONFIG_DIR, 'metrics-push.json');

interface MetricsPushSettings {
  enabled: boolean;
  workerUrl: string;
  dashboardSecret: string;
  containerId: string;
  pushInterval: number; // minutes
}

async function loadSettings(): Promise<MetricsPushSettings> {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = await readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('Failed to load metrics push settings:', error);
  }
  
  // Return defaults from environment
  return {
    enabled: process.env.ENABLE_METRICS_PUSH !== 'false',
    workerUrl: process.env.CLOUDFLARE_WORKER_URL || '',
    dashboardSecret: process.env.DASHBOARD_SECRET || '',
    containerId: process.env.CONTAINER_ID || 'dasharr-default',
    pushInterval: process.env.METRICS_PUSH_INTERVAL ? 
      parseInt(process.env.METRICS_PUSH_INTERVAL) / 60000 : 5 // Convert ms to minutes
  };
}

async function saveSettings(settings: MetricsPushSettings): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  await writeFile(CONFIG_FILE, JSON.stringify(settings, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const settings = await loadSettings();
    return NextResponse.json(settings);
  } catch (error) {
    logger.error('Failed to get metrics push settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings provided' },
        { status: 400 }
      );
    }
    
    await saveSettings(settings);
    
    // If the settings have changed, restart the metrics pusher
    // This would require implementing a restart mechanism
    logger.info('Metrics push settings saved:', settings);
    
    return NextResponse.json({ 
      message: 'Settings saved successfully',
      settings 
    });
  } catch (error) {
    logger.error('Failed to save metrics push settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}