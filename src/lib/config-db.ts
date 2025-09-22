/* eslint-disable @typescript-eslint/no-explicit-any */
// Dasharr Multi-Instance Configuration with SQLite Database
// This file supports multiple instances of each service type using the database

import { logger } from './logger';
import { getAppUrl } from './dasharr-config';
import { getDb } from './database/db-instance';
import { 
  MultiInstanceConfig, 
  ServiceInstance,
  ServiceType
} from './config/multi-instance-types';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

// Sync environment variables to database (called on every startup)
async function syncEnvToDatabase(): Promise<void> {
  logger.info('Syncing environment variables to database...');
  let syncCount = 0;
  
  const db = await getDb();
  
  // Check each service type and sync from .env if configured
  const envConfigs = [
    { envUrl: 'PLEX_URL', envKey: 'PLEX_TOKEN', id: 'plex1', type: 'plex', name: 'Plex', order: 1 },
    { envUrl: 'JELLYFIN_URL', envKey: 'JELLYFIN_API_KEY', id: 'jellyfin1', type: 'jellyfin', name: 'Jellyfin', order: 2 },
    { envUrl: 'RADARR_URL', envKey: 'RADARR_API_KEY', id: 'radarr1', type: 'radarr', name: 'Radarr', order: 6 },
    { envUrl: 'SONARR_URL', envKey: 'SONARR_API_KEY', id: 'sonarr1', type: 'sonarr', name: 'Sonarr', order: 7 },
    { envUrl: 'PROWLARR_URL', envKey: 'PROWLARR_API_KEY', id: 'prowlarr1', type: 'prowlarr', name: 'Prowlarr', order: 8 },
    { envUrl: 'SABNZBD_URL', envKey: 'SABNZBD_API_KEY', id: 'sabnzbd1', type: 'sabnzbd', name: 'SABnzbd', order: 9 },
    { envUrl: 'BAZARR_URL', envKey: 'BAZARR_API_KEY', id: 'bazarr1', type: 'bazarr', name: 'Bazarr', order: 11 },
    { envUrl: 'JELLYSEERR_URL', envKey: 'JELLYSEERR_API_KEY', id: 'jellyseerr1', type: 'jellyseerr', name: 'Jellyseerr', order: 4 },
    { envUrl: 'OVERSEERR_URL', envKey: 'OVERSEERR_API_KEY', id: 'overseerr1', type: 'overseerr', name: 'Overseerr', order: 3 },
    { envUrl: 'QBITTORRENT_URL', envKey: 'QBITTORRENT_PASSWORD', id: 'qbittorrent1', type: 'qbittorrent', name: 'qBittorrent', order: 10 },
    { envUrl: 'TAUTULLI_URL', envKey: 'TAUTULLI_API_KEY', id: 'tautulli1', type: 'tautulli', name: 'Tautulli', order: 5 }
  ];
  
  for (const config of envConfigs) {
    const url = process.env[config.envUrl];
    const apiKey = process.env[config.envKey];
    
    if (url) {
      try {
        // Check if service already exists in database
        const existingInstance = await db.getServiceInstance(config.id);
        
        if (!existingInstance) {
          // Create new instance from .env
          const instance = {
            id: config.id,
            service_type: config.type as ServiceType,
            name: config.name,
            url: url,
            api_key: apiKey || null,
            enabled: true,
            config: JSON.stringify({ order: config.order })
          };
          
          await db.saveServiceInstance(instance);
          logger.info(`✅ Added ${config.name} from environment variables`);
          syncCount++;
        } else {
          // Update existing instance if .env has different values
          let needsUpdate = false;
          const updates: any = {};
          
          if (existingInstance.url !== url) {
            updates.url = url;
            needsUpdate = true;
          }
          
          if (apiKey && existingInstance.api_key !== apiKey) {
            updates.api_key = apiKey;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            const updatedInstance = {
              ...existingInstance,
              ...updates
            };
            await db.saveServiceInstance(updatedInstance);
            logger.info(`✅ Updated ${config.name} from environment variables`);
            syncCount++;
          }
        }
      } catch (error) {
        logger.error(`Failed to sync ${config.name} from environment:`, error);
      }
    }
  }
  
  if (syncCount > 0) {
    logger.info(`Synced ${syncCount} services from environment variables to database`);
  } else {
    logger.debug('No environment variable updates needed');
  }
}

// Create configuration from environment variables (first-time setup)
async function createConfigFromEnv(): Promise<MultiInstanceConfig> {
  logger.info('Creating initial configuration from environment variables...');
  const services: Record<string, ServiceInstance> = {};
  let serviceCount = 0;
  
  const db = await getDb();
  
  // Check for legacy environment variables and save to database
  if (process.env.PLEX_URL) {
    logger.info('Found PLEX_URL in environment, creating Plex instance...');
    const instance = {
      id: 'plex1',
      service_type: 'plex',
      name: 'Plex',
      url: process.env.PLEX_URL,
      api_key: process.env.PLEX_TOKEN, // Plex uses token instead of apiKey
      enabled: true,
      config: JSON.stringify({ order: 1 })
    };
    await db.saveServiceInstance(instance);
    services.plex1 = {
      type: 'plex',
      displayName: 'Plex',
      url: process.env.PLEX_URL,
      token: process.env.PLEX_TOKEN,
      enabled: true,
      order: 1
    };
  }
  
  if (process.env.RADARR_URL) {
    const instance = {
      id: 'radarr1',
      service_type: 'radarr',
      name: 'Radarr',
      url: process.env.RADARR_URL,
      api_key: process.env.RADARR_API_KEY,
      enabled: true,
      config: JSON.stringify({ order: 6 })
    };
    await db.saveServiceInstance(instance);
    services.radarr1 = {
      type: 'radarr',
      displayName: 'Radarr',
      url: process.env.RADARR_URL,
      apiKey: process.env.RADARR_API_KEY,
      enabled: true,
      order: 6
    };
  }
  
  if (process.env.SONARR_URL) {
    const instance = {
      id: 'sonarr1',
      service_type: 'sonarr',
      name: 'Sonarr',
      url: process.env.SONARR_URL,
      api_key: process.env.SONARR_API_KEY,
      enabled: true,
      config: JSON.stringify({ order: 7 })
    };
    await db.saveServiceInstance(instance);
    services.sonarr1 = {
      type: 'sonarr',
      displayName: 'Sonarr',
      url: process.env.SONARR_URL,
      apiKey: process.env.SONARR_API_KEY,
      enabled: true,
      order: 7
    };
  }
  
  if (process.env.PROWLARR_URL) {
    const instance = {
      id: 'prowlarr1',
      service_type: 'prowlarr',
      name: 'Prowlarr',
      url: process.env.PROWLARR_URL,
      api_key: process.env.PROWLARR_API_KEY,
      enabled: true,
      config: JSON.stringify({ order: 8 })
    };
    await db.saveServiceInstance(instance);
    services.prowlarr1 = {
      type: 'prowlarr',
      displayName: 'Prowlarr',
      url: process.env.PROWLARR_URL,
      apiKey: process.env.PROWLARR_API_KEY,
      enabled: true,
      order: 8
    };
  }
  
  if (process.env.SABNZBD_URL) {
    const instance = {
      id: 'sabnzbd1',
      service_type: 'sabnzbd',
      name: 'SABnzbd',
      url: process.env.SABNZBD_URL,
      api_key: process.env.SABNZBD_API_KEY,
      enabled: true,
      config: JSON.stringify({ order: 9 })
    };
    await db.saveServiceInstance(instance);
    services.sabnzbd1 = {
      type: 'sabnzbd',
      displayName: 'SABnzbd',
      url: process.env.SABNZBD_URL,
      apiKey: process.env.SABNZBD_API_KEY,
      enabled: true,
      order: 9
    };
  }
  
  if (process.env.JELLYFIN_URL) {
    const instance = {
      id: 'jellyfin1',
      service_type: 'jellyfin',
      name: 'Jellyfin',
      url: process.env.JELLYFIN_URL,
      api_key: process.env.JELLYFIN_API_KEY,
      enabled: true,
      config: JSON.stringify({ order: 2 })
    };
    await db.saveServiceInstance(instance);
    services.jellyfin1 = {
      type: 'jellyfin',
      displayName: 'Jellyfin',
      url: process.env.JELLYFIN_URL,
      apiKey: process.env.JELLYFIN_API_KEY,
      enabled: true,
      order: 2
    };
  }
  
  if (process.env.TAUTULLI_URL) {
    const instance = {
      id: 'tautulli1',
      service_type: 'tautulli',
      name: 'Tautulli',
      url: process.env.TAUTULLI_URL,
      api_key: process.env.TAUTULLI_API_KEY,
      enabled: true,
      config: JSON.stringify({ order: 10 })
    };
    await db.saveServiceInstance(instance);
    services.tautulli1 = {
      type: 'tautulli',
      displayName: 'Tautulli',
      url: process.env.TAUTULLI_URL,
      apiKey: process.env.TAUTULLI_API_KEY,
      enabled: true,
      order: 10
    };
  }
  
  if (process.env.OVERSEERR_URL || process.env.JELLYSEERR_URL) {
    const url = process.env.OVERSEERR_URL || process.env.JELLYSEERR_URL;
    const apiKey = process.env.OVERSEERR_API_KEY || process.env.JELLYSEERR_API_KEY;
    const isJellyseerr = !!process.env.JELLYSEERR_URL;
    const type = isJellyseerr ? 'jellyseerr' : 'overseerr';
    const id = isJellyseerr ? 'jellyseerr1' : 'overseerr1';
    const name = isJellyseerr ? 'Jellyseerr' : 'Overseerr';
    
    const instance = {
      id,
      service_type: type,
      name,
      url,
      api_key: apiKey,
      enabled: true,
      config: JSON.stringify({ order: 5 })
    };
    await db.saveServiceInstance(instance);
    services[id] = {
      type: type as ServiceType,
      displayName: name,
      url,
      apiKey,
      enabled: true,
      order: 5
    };
  }
  
  if (process.env.QBITTORRENT_URL) {
    const instance = {
      id: 'qbittorrent1',
      service_type: 'qbittorrent',
      name: 'qBittorrent',
      url: process.env.QBITTORRENT_URL,
      username: process.env.QBITTORRENT_USERNAME,
      password: process.env.QBITTORRENT_PASSWORD,
      enabled: true,
      config: JSON.stringify({ order: 11 })
    };
    await db.saveServiceInstance(instance);
    services.qbittorrent1 = {
      type: 'qbittorrent',
      displayName: 'qBittorrent',
      url: process.env.QBITTORRENT_URL,
      username: process.env.QBITTORRENT_USERNAME,
      password: process.env.QBITTORRENT_PASSWORD,
      enabled: true,
      order: 11
    };
  }
  
  serviceCount = Object.keys(services).length;
  logger.info(`Created initial configuration from environment variables with ${serviceCount} services:`, Object.keys(services));
  
  return {
    services,
    version: '2.0'
  };
}

// Migrate from existing JSON config file
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function migrateFromJsonConfig(): Promise<MultiInstanceConfig | null> {
  try {
    const { getDb } = await import('./database');
    const database = await getDb();
    const fs = await import('fs/promises');
    const path = await import('path');
    const configPath = path.join('/app/config', 'service-config.json');
    
    // Check if JSON config exists
    try {
      await fs.access(configPath);
    } catch {
      logger.debug('No existing service-config.json found to migrate');
      return null;
    }
    
    logger.info('Found existing service-config.json, attempting migration...');
    const jsonContent = await fs.readFile(configPath, 'utf-8');
    const jsonConfig = JSON.parse(jsonContent);
    
    if (!jsonConfig || typeof jsonConfig !== 'object') {
      logger.warn('Invalid JSON config format');
      return null;
    }
    
    const services: Record<string, ServiceInstance> = {};
    let migratedCount = 0;
    
    // Migrate services from JSON config
    Object.entries(jsonConfig).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'url' in value) {
        const serviceValue = value as any;
        const serviceType = key as ServiceType;
        const instanceId = `${serviceType}1`;
        
        services[instanceId] = {
          type: serviceType,
          displayName: serviceValue.displayName || key.charAt(0).toUpperCase() + key.slice(1),
          url: serviceValue.url,
          apiKey: serviceValue.apiKey,
          token: serviceValue.token,
          username: serviceValue.username,
          password: serviceValue.password,
          enabled: serviceValue.enabled !== false,
          order: serviceValue.order || 999,
          ...serviceValue
        };
        
        // Save to database
        const dbInstance = {
          id: instanceId,
          service_type: serviceType,
          name: services[instanceId].displayName,
          url: serviceValue.url,
          api_key: serviceValue.apiKey || serviceValue.token || null,
          username: serviceValue.username || null,
          password: serviceValue.password || null,
          enabled: serviceValue.enabled !== false,
          config: JSON.stringify({ 
            order: serviceValue.order || 999,
            ...Object.entries(serviceValue).reduce((acc, [k, v]) => {
              if (!['type', 'displayName', 'url', 'apiKey', 'token', 'username', 'password', 'enabled', 'order'].includes(k)) {
                acc[k] = v;
              }
              return acc;
            }, {} as any)
          })
        };
        
        database.saveServiceInstance(dbInstance);
        migratedCount++;
      }
    });
    
    if (migratedCount > 0) {
      logger.info(`Successfully migrated ${migratedCount} services from JSON config to database`);
      
      // Rename the old config file to indicate it's been migrated
      const backupPath = configPath + '.migrated';
      await fs.rename(configPath, backupPath);
      logger.info(`Renamed old config file to: ${backupPath}`);
      
      return {
        services,
        version: '2.0'
      };
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to migrate from JSON config:', error);
    return null;
  }
}

// Load saved configuration from database
async function loadSavedConfig(): Promise<MultiInstanceConfig> {
  logger.info('Loading configuration from database...');
  
  try {
    const db = await getDb();
    const dbInstances = await db.getAllServiceInstances();
    logger.info(`Found ${dbInstances.length} service instances in database`);
    
    // Always sync .env variables to database (regardless of existing services)
    await syncEnvToDatabase();
    
    // If no instances in database, try to migrate from JSON first
    if (dbInstances.length === 0) {
      logger.info('No saved configuration found in database, checking for existing JSON config...');
      
      // Try to migrate from JSON config synchronously
      try {
        let configPath = path.join('/app/config', 'service-config.json');
        let isRecovery = false;
        
        // Check for .migrated file if main config doesn't exist (recovery for affected users)
        let configExists = false;
        try {
          await fsPromises.access(configPath);
          configExists = true;
        } catch {
          const migratedPath = configPath + '.migrated';
          try {
            await fsPromises.access(migratedPath);
            logger.warn('Found .migrated file but no database - this indicates a previous migration failure!');
            logger.warn('Attempting recovery by restoring .migrated file...');
            configPath = migratedPath;
            isRecovery = true;
            configExists = true;
          } catch {
            // Neither file exists
          }
        }
        
        if (configExists) {
          logger.info('Found existing service-config.json, migrating to database...');
          
          let jsonContent: string;
          let jsonConfig: any;
          
          try {
            jsonContent = await fsPromises.readFile(configPath, 'utf-8');
            logger.debug('Raw JSON content (first 500 chars):', jsonContent.substring(0, 500));
            jsonConfig = JSON.parse(jsonContent);
            logger.debug('Successfully parsed JSON config keys:', Object.keys(jsonConfig));
            logger.debug('Full JSON config structure:', JSON.stringify(jsonConfig, null, 2));
          } catch (parseError) {
            logger.error('Failed to parse service-config.json:', parseError);
            throw parseError;
          }
          
          if (!jsonConfig || typeof jsonConfig !== 'object') {
            logger.warn('Invalid JSON config format, skipping migration');
            throw new Error('Invalid JSON config format');
          }
          
          let migratedCount = 0;
          const migrationErrors: string[] = [];
          
          // Determine JSON structure format
          let servicesToMigrate: Record<string, any>;
          
          if (jsonConfig.services && typeof jsonConfig.services === 'object') {
            // New nested format: { "services": { "plex1": {...}, ... }, "version": "2.0" }
            logger.info('Detected nested JSON format with services object');
            servicesToMigrate = jsonConfig.services;
          } else if (jsonConfig.version) {
            // Mixed format with version at top level but services also at top level
            logger.info('Detected mixed JSON format, filtering out version key');
            const { version, ...services } = jsonConfig;
            servicesToMigrate = services;
          } else {
            // Legacy flat format: { "plex1": {...}, "radarr1": {...}, ... }
            logger.info('Detected legacy flat JSON format');
            servicesToMigrate = jsonConfig;
          }
          
          // Begin database transaction for migration
          logger.info(`Processing ${Object.keys(servicesToMigrate).length} service entries from JSON config...`);
          for (const [key, value] of Object.entries(servicesToMigrate)) {
            logger.info(`Processing entry: ${key}`, { 
              type: typeof value, 
              isObject: typeof value === 'object' && value !== null,
              hasUrl: value && typeof value === 'object' && 'url' in value,
              keys: value && typeof value === 'object' ? Object.keys(value) : [],
              fullValue: JSON.stringify(value, null, 2)
            });
            
            try {
              // Check if this is a valid service configuration
              if (typeof value !== 'object' || value === null) {
                logger.warn(`Skipping ${key}: not an object (type: ${typeof value})`);
                migrationErrors.push(`${key}: not an object`);
                continue;
              }
              
              const serviceValue = value as any;
              
              // Check if service has URL or is enabled
              if (!('url' in serviceValue)) {
                logger.warn(`Skipping ${key}: missing 'url' property. Available properties:`, Object.keys(serviceValue));
                migrationErrors.push(`${key}: missing 'url' property`);
                continue;
              }
              
              if (!serviceValue.url || serviceValue.url.trim() === '') {
                logger.warn(`Skipping ${key}: empty or invalid URL`);
                migrationErrors.push(`${key}: empty or invalid URL`);
                continue;
              }
              
              // Extract service type and instance ID properly
              // Handle keys like "jellyseerr1" -> serviceType="jellyseerr", instanceId="jellyseerr1"
              // Handle keys like "plex" -> serviceType="plex", instanceId="plex1"
              let serviceType: string;
              let instanceId: string;
              
              // Check if key already has a number at the end (e.g., "jellyseerr1", "plex2")
              const serviceMatch = key.match(/^([a-z]+)(\d*)$/);
              if (serviceMatch) {
                serviceType = serviceMatch[1]; // e.g., "jellyseerr", "plex"
                const existingNumber = serviceMatch[2]; // e.g., "1", "2", or ""
                instanceId = existingNumber ? key : `${serviceType}1`; // Use existing or add "1"
              } else {
                // Fallback for unexpected formats
                serviceType = key;
                instanceId = `${key}1`;
              }
              
              logger.info(`Migrating service: ${serviceType} -> ${instanceId}`, {
                url: serviceValue.url,
                hasApiKey: !!(serviceValue.apiKey || serviceValue.token),
                enabled: serviceValue.enabled !== false,
                displayName: serviceValue.displayName
              });
              
              const dbInstance = {
                id: instanceId,
                service_type: serviceType,
                name: serviceValue.displayName || key.charAt(0).toUpperCase() + key.slice(1),
                url: serviceValue.url,
                api_key: serviceValue.apiKey || serviceValue.token || null,
                username: serviceValue.username || null,
                password: serviceValue.password || null,
                enabled: serviceValue.enabled !== false,
                config: JSON.stringify({ 
                  order: serviceValue.order || 999,
                  ...Object.entries(serviceValue).reduce((acc, [k, v]) => {
                    if (!['type', 'displayName', 'url', 'apiKey', 'token', 'username', 'password', 'enabled', 'order'].includes(k)) {
                      acc[k] = v;
                    }
                    return acc;
                  }, {} as any)
                })
              };
              
              logger.info(`Attempting to save instance to database:`, {
                id: dbInstance.id,
                service_type: dbInstance.service_type,
                name: dbInstance.name,
                url: dbInstance.url ? '***' : null,
                has_api_key: !!dbInstance.api_key,
                enabled: dbInstance.enabled
              });
              
              // Save to database with error checking and verification
              try {
                await db.saveServiceInstance(dbInstance);
                
                // Immediately verify the save was successful
                const savedInstance = await db.getServiceInstance(instanceId);
                if (!savedInstance) {
                  throw new Error(`Failed to verify saved instance in database`);
                }
                
                migratedCount++;
                logger.info(`✓ Successfully migrated and verified ${serviceType} service (${instanceId})`);
                logger.debug(`✓ Verified database entry:`, {
                  id: savedInstance.id,
                  service_type: savedInstance.service_type,
                  name: savedInstance.name,
                  url: savedInstance.url,
                  enabled: savedInstance.enabled
                });
              } catch (saveError) {
                logger.error(`Failed to save ${serviceType} service to database:`, saveError);
                migrationErrors.push(`${serviceType}: ${saveError}`);
              }
            } catch (serviceError) {
              logger.error(`Error processing service ${key}:`, {
                error: serviceError instanceof Error ? serviceError.message : String(serviceError),
                value: JSON.stringify(value, null, 2)
              });
              migrationErrors.push(`${key}: ${serviceError instanceof Error ? serviceError.message : String(serviceError)}`);
            }
          }
          
          if (migratedCount > 0) {
            logger.info(`Successfully migrated ${migratedCount} services from JSON config to database`);
            
            if (migrationErrors.length > 0) {
              logger.warn(`Migration completed with ${migrationErrors.length} errors:`, migrationErrors);
            }
            
            // Verify migration by checking database
            const verifyInstances = await db.getAllServiceInstances();
            logger.info(`Verification: Found ${verifyInstances.length} services in database after migration`);
            
            // Handle config file backup/cleanup based on migration type
            try {
              if (isRecovery) {
                // For recovery, remove the .migrated file since migration is now complete
                logger.info('Recovery migration successful - cleaning up .migrated file');
                const originalPath = configPath.replace('.migrated', '');
                try {
                  await fsPromises.access(configPath);
                  await fsPromises.unlink(configPath);
                  logger.info(`Removed recovered .migrated file: ${configPath}`);
                } catch (err) {
                  logger.warn(`Could not remove .migrated file: ${err}`)
                }
              } else {
                // Safely backup the old config file with descriptive name
                try {
                  const backupPath = configPath.replace('.json', '') + '.safe-to-delete.json';
                  fs.renameSync(configPath, backupPath);
                  logger.info(`Safely backed up old config file to: ${backupPath}`);
                  logger.info(`You can safely delete ${backupPath} once you've verified the migration worked correctly`);
                } catch (renameError) {
                  logger.warn('Failed to backup old config file:', renameError);
                  // Don't treat this as a fatal error since migration succeeded
                }
              }
            } catch (fileError) {
              logger.warn('Failed to handle config file cleanup:', fileError);
            }
            
            // Reload from database after successful migration
            logger.info('Reloading configuration from database after migration...');
            return loadSavedConfig();
          } else {
            logger.error('Migration failed: No services were successfully migrated');
            if (migrationErrors.length > 0) {
              logger.error('Migration errors:', migrationErrors);
            }
            throw new Error(`Migration failed: No services migrated. Errors: ${migrationErrors.join(', ')}`);
          }
        } else {
          logger.debug('No service-config.json file found at:', configPath);
        }
      } catch (error) {
        logger.error('Critical error during JSON config migration:', error);
        // Don't silently fall through - re-throw to make migration failure explicit
        throw error;
      }
      
      // If no JSON config or migration failed, create from env
      logger.info('No existing configuration found, initializing from environment variables');
      return createConfigFromEnv();
    }
    
    const services: Record<string, ServiceInstance> = {};
    
    for (const instance of dbInstances) {
      let config: any = {};
      try {
        config = (instance as any).config_json ? JSON.parse((instance as any).config_json) : {};
      } catch (e) {
        logger.warn(`Failed to parse config for ${(instance as any).id}:`, e);
      }
      
      const serviceInstance: ServiceInstance = {
        type: (instance as any).service_type as ServiceType,
        displayName: (instance as any).name,
        url: (instance as any).url,
        enabled: (instance as any).enabled,
        order: config.order || 999,
        ...config
      };
      
      // Handle different auth types
      if ((instance as any).api_key) {
        if ((instance as any).service_type === 'plex') {
          serviceInstance.token = (instance as any).api_key;
        } else {
          serviceInstance.apiKey = (instance as any).api_key;
        }
      }
      
      if ((instance as any).username) serviceInstance.username = (instance as any).username;
      if ((instance as any).password) serviceInstance.password = (instance as any).password;
      
      services[(instance as any).id] = serviceInstance;
    }
    
    const instanceIds = Object.keys(services);
    logger.info(`Successfully loaded ${instanceIds.length} service instances from database:`, instanceIds);
    
    // Log service type summary
    const typeSummary: Record<string, number> = {};
    Object.values(services).forEach(service => {
      typeSummary[service.type] = (typeSummary[service.type] || 0) + 1;
    });
    logger.info('Service types summary:', typeSummary);
    
    return {
      services,
      version: '2.0'
    };
  } catch (error) {
    logger.error('Failed to load configuration from database:', error);
    return createConfigFromEnv();
  }
}

// Save configuration to database
export async function saveConfig(config: MultiInstanceConfig): Promise<void> {
  try {
    const db = await getDb();
    
    // Save each service instance to database
    for (const [instanceId, service] of Object.entries(config.services)) {
      const { type, displayName, url, apiKey, token, username, password, enabled, order, ...otherConfig } = service;
      
      const instance = {
        id: instanceId,
        service_type: type,
        name: displayName,
        url: url || null,
        api_key: apiKey || token || null, // Use token for Plex
        username: username || null,
        password: password || null,
        enabled: enabled !== false,
        config: JSON.stringify({ order, ...otherConfig })
      };
      
      await db.saveServiceInstance(instance);
    }
    
    logger.info('Configuration saved to database successfully');
  } catch (error) {
    logger.error('Failed to save configuration:', error);
    throw error;
  }
}

// Get all service instances
export async function getServiceInstances(): Promise<Record<string, ServiceInstance>> {
  logger.debug('Getting all service instances...');
  const config = await loadSavedConfig();
  const count = Object.keys(config.services).length;
  logger.debug(`Returning ${count} service instances`);
  return config.services;
}

// Get instances of a specific service type
export async function getServiceInstancesByType(type: ServiceType): Promise<Record<string, ServiceInstance>> {
  logger.debug(`Getting service instances of type: ${type}`);
  const allServices = await getServiceInstances();
  const filtered: Record<string, ServiceInstance> = {};
  
  Object.entries(allServices).forEach(([id, service]) => {
    if (service.type === type && service.enabled !== false) {
      filtered[id] = service;
    }
  });
  
  const count = Object.keys(filtered).length;
  logger.debug(`Found ${count} enabled ${type} instances`);
  
  return filtered;
}

// Get a specific service instance
export async function getServiceInstance(instanceId: string): Promise<ServiceInstance | null> {
  logger.debug(`Getting service instance: ${instanceId}`);
  const services = await getServiceInstances();
  const instance = services[instanceId] || null;
  if (!instance) {
    logger.warn(`Service instance ${instanceId} not found`);
  } else {
    logger.debug(`Found ${instance.type} instance: ${instance.displayName}`);
  }
  return instance;
}

// Add or update a service instance
export async function saveServiceInstance(instanceId: string, service: ServiceInstance): Promise<void> {
  const config = await loadSavedConfig();
  const isNew = !config.services[instanceId];
  config.services[instanceId] = service;
  logger.info(`${isNew ? 'Created' : 'Updated'} instance ${instanceId} (${service.displayName}) for service type ${service.type}`);
  await saveConfig(config);
}

// Delete a service instance
export async function deleteServiceInstance(instanceId: string): Promise<void> {
  const db = await getDb();
  await db.deleteServiceInstance(instanceId);
  logger.info(`Deleted instance ${instanceId} from database`);
}

// Create a function to get current config that always loads fresh data
export async function getConfig() {
  logger.debug('Getting full application configuration...');
  const multiConfig = await loadSavedConfig();
  
  // Create backward-compatible services object for legacy code
  const legacyServices: Record<string, ServiceInstance> = {};
  
  // Map first instance of each type to legacy format
  Object.entries(multiConfig.services).forEach(([, service]) => {
    if (service.enabled !== false && !legacyServices[service.type]) {
      legacyServices[service.type] = {
        ...service,
        url: service.url,
        apiKey: service.apiKey,
        token: service.token,
        username: service.username,
        password: service.password,
        // Include UniFi-specific fields
        ...(service.type === 'unifi' ? {
          apiKey1: service.apiKey1,
          apiKey2: service.apiKey2,
          apiKey3: service.apiKey3,
          apiKey4: service.apiKey4,
          apiKey5: service.apiKey5,
          siteManagerApiKey: service.siteManagerApiKey,
        } : {})
      };
    }
  });
  
  const db = await getDb();
  
  const config = {
    // Base URL for the application
    baseUrl: getAppUrl(),
    
    // Legacy services object for backward compatibility
    services: legacyServices,
    
    // Multi-instance configuration
    multiInstance: multiConfig,
    
    // Application settings from database
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      timezone: db.getSetting('timezone') || process.env.TZ || 'America/New_York',
      puid: parseInt(process.env.PUID || '1000', 10),
      pgid: parseInt(process.env.PGID || '1000', 10),
      logLevel: db.getSetting('logLevel') || process.env.LOG_LEVEL || 'info',
      trustProxy: db.getSetting('trustProxy') || process.env.TRUST_PROXY === 'true',
      trustSelfSignedCerts: db.getSetting('trustSelfSignedCerts') || process.env.DASHARR_SELF_SIGNED === 'true',
    },
    
    pushConfig: {
      enablePush: db.getSetting('enablePush') || false,
      pushTarget: db.getSetting('pushTarget') || '',
      pushSecret: db.getSetting('pushSecret') || '',
      pushInterval: db.getSetting('pushInterval') || '300',
      useQueue: db.getSetting('useQueue') || false
    }
  };
  
  logger.debug('Configuration loaded successfully with settings:', {
    baseUrl: config.baseUrl,
    servicesCount: Object.keys(config.services).length,
    multiInstanceCount: Object.keys(config.multiInstance.services).length,
    timezone: config.app.timezone,
    trustProxy: config.app.trustProxy,
    trustSelfSignedCerts: config.app.trustSelfSignedCerts
  });
  
  return config;
}