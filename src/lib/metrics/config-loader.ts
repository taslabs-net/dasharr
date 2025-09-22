import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { logger } from '../logger';

const CONFIG_DIR = process.env.NODE_ENV === 'production' ? '/app/config' : './config';
const DASHARR_CONFIG_FILE = path.join(CONFIG_DIR, 'dasharr-settings.json');

interface DasharrSettings {
  pushInterval?: string; // seconds
  enablePush?: boolean;
  pushTarget?: string;
  pushSecret?: string;
  useQueue?: boolean;
}

export async function getMetricsPushConfig(): Promise<{
  enabled: boolean;
  workerUrl: string;
  dashboardSecret: string;
  containerId: string;
  pushInterval: number; // milliseconds
  useQueue?: boolean;
}> {
  // Only load from dasharr-settings.json - no fallbacks
  try {
    if (existsSync(DASHARR_CONFIG_FILE)) {
      const data = await readFile(DASHARR_CONFIG_FILE, 'utf-8');
      const settings: DasharrSettings = JSON.parse(data);
      
      // Only proceed if push is enabled and properly configured
      if (!settings.enablePush) {
        logger.info('Metrics push is disabled in dasharr settings');
        return {
          enabled: false,
          workerUrl: '',
          dashboardSecret: '',
          containerId: 'dasharr-default',
          pushInterval: 300000,
          useQueue: false
        };
      }
      
      if (!settings.pushTarget || !settings.pushSecret) {
        logger.warn('Metrics push enabled but missing pushTarget or pushSecret in dasharr settings');
        return {
          enabled: false,
          workerUrl: '',
          dashboardSecret: '',
          containerId: 'dasharr-default',
          pushInterval: 300000,
          useQueue: false
        };
      }
      
      const pushInterval = settings.pushInterval ? parseInt(settings.pushInterval) * 1000 : 300000; // Convert seconds to milliseconds
      
      return {
        enabled: true,
        workerUrl: settings.pushTarget,
        dashboardSecret: settings.pushSecret,
        containerId: 'dasharr-default',
        pushInterval,
        useQueue: settings.useQueue || false
      };
    }
  } catch (error) {
    logger.error('Failed to load dasharr settings:', error);
  }
  
  // Return disabled if no valid configuration found
  logger.info('No valid dasharr settings found - metrics push disabled');
  return {
    enabled: false,
    workerUrl: '',
    dashboardSecret: '',
    containerId: 'dasharr-default',
    pushInterval: 300000,
    useQueue: false
  };
}