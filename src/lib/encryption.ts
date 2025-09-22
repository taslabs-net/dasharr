import { symmetricEncrypt, symmetricDecrypt, generateRandomString } from 'better-auth/crypto';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CONFIG_DIR = process.env.CONFIG_DIR || '/app/config';
const ENCRYPTION_KEY_FILE = path.join(CONFIG_DIR, '.encryption.key');

let encryptionKey: string | null = null;

/**
 * Derive encryption key from environment or generate securely
 */
function deriveEncryptionKey(): string {
  // Option 1: Use environment variable if provided
  if (process.env.DASHARR_ENCRYPTION_KEY) {
    const envKey = process.env.DASHARR_ENCRYPTION_KEY;
    // Ensure it's long enough
    if (envKey.length >= 32) {
      return envKey;
    }
    // If too short, derive a longer key from it
    return crypto.createHash('sha256').update(envKey).digest('base64').substring(0, 32);
  }
  
  // Option 2: Derive from DASHARR_SECRET if available
  if (process.env.DASHARR_SECRET) {
    return crypto.createHash('sha256')
      .update(process.env.DASHARR_SECRET + ':encryption')
      .digest('base64')
      .substring(0, 32);
  }
  
  // Option 3: Generate new random key
  return generateRandomString(32, 'a-z', 'A-Z', '0-9');
}

/**
 * Get or create the encryption key
 * The key is stored in a file in the config directory
 */
function getEncryptionKey(): string {
  if (encryptionKey) {
    return encryptionKey;
  }

  try {
    // Try to read existing key
    if (fs.existsSync(ENCRYPTION_KEY_FILE)) {
      encryptionKey = fs.readFileSync(ENCRYPTION_KEY_FILE, 'utf-8').trim();
      if (encryptionKey.length < 32) {
        throw new Error('Encryption key is too short');
      }
      logger.debug('Loaded existing encryption key');
      return encryptionKey;
    }
  } catch (error) {
    logger.warn('Failed to read encryption key file:', error);
  }

  // Derive or generate new key if not exists or invalid
  logger.info('Deriving encryption key');
  encryptionKey = deriveEncryptionKey();
  
  try {
    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Write key to file with restricted permissions
    // But only if not from environment (for security)
    if (!process.env.DASHARR_ENCRYPTION_KEY && !process.env.DASHARR_SECRET) {
      fs.writeFileSync(ENCRYPTION_KEY_FILE, encryptionKey, { mode: 0o600 });
      logger.info('Encryption key saved to file');
    } else {
      logger.info('Using environment-based encryption key');
    }
  } catch (error) {
    logger.error('Failed to save encryption key to file:', error);
    // Continue with in-memory key for this session
  }

  return encryptionKey;
}

/**
 * Encrypt sensitive data
 */
export async function encryptSensitiveData(data: string | null | undefined): Promise<string | null> {
  if (data === null || data === undefined || data === '') {
    return data === '' ? '' : null;
  }

  // Don't re-encrypt already encrypted data
  if (isEncrypted(data)) {
    return data;
  }

  try {
    const key = getEncryptionKey();
    const encrypted = await symmetricEncrypt({ key, data });
    // Add prefix to identify encrypted values
    return ENCRYPTION_PREFIX + encrypted;
  } catch (error) {
    logger.error('Failed to encrypt data:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptSensitiveData(encryptedData: string | null | undefined): Promise<string | null> {
  if (encryptedData === null || encryptedData === undefined || encryptedData === '') {
    return encryptedData === '' ? '' : null;
  }

  try {
    const key = getEncryptionKey();
    
    // Remove prefix if present
    let dataToDecrypt = encryptedData;
    if (encryptedData.startsWith(ENCRYPTION_PREFIX)) {
      dataToDecrypt = encryptedData.substring(ENCRYPTION_PREFIX.length);
    }
    
    const decrypted = await symmetricDecrypt({ key, data: dataToDecrypt });
    return decrypted;
  } catch (error) {
    // If decryption fails, it might be because the data is not encrypted (legacy data)
    // Return the original data in this case
    logger.debug('Decryption failed, assuming legacy unencrypted data');
    return encryptedData;
  }
}

/**
 * Encryption prefix to identify encrypted values
 */
const ENCRYPTION_PREFIX = 'enc:v1:';

/**
 * Check if a string appears to be encrypted
 */
export function isEncrypted(data: string | null | undefined): boolean {
  if (!data) {
    return false;
  }
  
  // Check for our encryption prefix
  if (data.startsWith(ENCRYPTION_PREFIX)) {
    return true;
  }
  
  // Legacy check: Better-auth's symmetric encryption returns base64 strings
  // This is for backward compatibility with data encrypted before prefix was added
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(data) && data.length > 32 && !data.includes('://');
}

/**
 * Batch encrypt multiple values
 */
export async function encryptMultiple(values: Record<string, string | null | undefined>): Promise<Record<string, string | null>> {
  const encrypted: Record<string, string | null> = {};
  
  for (const [key, value] of Object.entries(values)) {
    encrypted[key] = await encryptSensitiveData(value);
  }
  
  return encrypted;
}

/**
 * Batch decrypt multiple values
 */
export async function decryptMultiple(values: Record<string, string | null | undefined>): Promise<Record<string, string | null>> {
  const decrypted: Record<string, string | null> = {};
  
  for (const [key, value] of Object.entries(values)) {
    decrypted[key] = await decryptSensitiveData(value);
  }
  
  return decrypted;
}