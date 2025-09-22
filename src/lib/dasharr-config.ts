import { readFileSync, existsSync } from 'fs';
import { logger } from '@/lib/logger';

const DASHARR_SETTINGS_FILE = process.env.NODE_ENV === 'production' ? '/app/config/dasharr-settings.json' : './config/dasharr-settings.json';

export interface DasharrSettings {
  timezone?: string;
  logLevel?: string;
  trustProxy?: boolean;
  baseUrl?: string;
  refreshInterval?: string;
  trustSelfSignedCerts?: boolean;
  lastSaved?: string;
}

let cachedSettings: DasharrSettings | null = null;

export function getDasharrSettings(): DasharrSettings {
  // Return cached settings if available
  if (cachedSettings) {
    return cachedSettings;
  }

  // Try to load from saved settings file
  try {
    if (existsSync(DASHARR_SETTINGS_FILE)) {
      const data = readFileSync(DASHARR_SETTINGS_FILE, 'utf-8');
      const savedSettings = JSON.parse(data) as DasharrSettings;
      
      // Environment variables take precedence
      cachedSettings = {
        timezone: savedSettings.timezone || 'America/New_York',
        logLevel: process.env.LOG_LEVEL || savedSettings.logLevel || 'info',
        trustProxy: process.env.TRUST_PROXY === 'true' || savedSettings.trustProxy || false,
        baseUrl: process.env.APP_URL || savedSettings.baseUrl || 'http://localhost:3000',
        refreshInterval: process.env.REFRESH_INTERVAL || savedSettings.refreshInterval || '30',
        trustSelfSignedCerts: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' || savedSettings.trustSelfSignedCerts || false,
      };
      
      return cachedSettings;
    }
  } catch (error) {
    logger.error('Failed to load Dasharr settings:', error);
  }
  
  // Fall back to environment variables only
  cachedSettings = {
    timezone: 'America/New_York',
    logLevel: process.env.LOG_LEVEL || 'info',
    trustProxy: process.env.TRUST_PROXY === 'true',
    baseUrl: process.env.APP_URL || 'http://localhost:3000',
    refreshInterval: process.env.REFRESH_INTERVAL || '30',
    trustSelfSignedCerts: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0',
  };
  
  return cachedSettings;
}

// Function to clear cache (useful when settings are updated)
export function clearDasharrSettingsCache() {
  cachedSettings = null;
}

// Helper function to check if we should trust proxy
export function shouldTrustProxy(): boolean {
  const settings = getDasharrSettings();
  return settings.trustProxy || false;
}

// Helper function to get the app URL
export function getAppUrl(): string {
  const settings = getDasharrSettings();
  return settings.baseUrl || 'http://localhost:3000';
}

// Helper function to get the refresh interval in milliseconds
export function getRefreshInterval(): number {
  const settings = getDasharrSettings();
  const interval = parseInt(settings.refreshInterval || '30', 10);
  // If 0, return 0 to indicate manual refresh only
  // Otherwise convert seconds to milliseconds
  return interval === 0 ? 0 : interval * 1000;
}

// Helper function to check if we should trust self-signed certificates
export function shouldTrustSelfSignedCerts(): boolean {
  const settings = getDasharrSettings();
  return settings.trustSelfSignedCerts || false;
}