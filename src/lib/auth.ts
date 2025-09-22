import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import path from "path";
import { logger } from "./logger";
import crypto from "crypto";
import fs from "fs";

const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), "config");
const AUTH_DB_PATH = path.join(CONFIG_DIR, "dasharr-auth.db");

// Create auth database instance
let authDb: Database.Database;

try {
  authDb = new Database(AUTH_DB_PATH);
  logger.info(`Auth database initialized at: ${AUTH_DB_PATH}`);
  
  // Enable foreign keys and WAL mode for better performance
  authDb.pragma('foreign_keys = ON');
  authDb.pragma('journal_mode = WAL');
} catch (error) {
  logger.warn("Failed to create auth database, using in-memory database");
  authDb = new Database(":memory:");
}

// Generate or retrieve auth secret
function getAuthSecret(): string {
  // First check environment variable
  if (process.env.DASHARR_SECRET) {
    return process.env.DASHARR_SECRET;
  }

  // Check for persisted secret file
  const secretPath = path.join(CONFIG_DIR, '.auth-secret');
  
  try {
    if (fs.existsSync(secretPath)) {
      const secret = fs.readFileSync(secretPath, 'utf-8').trim();
      if (secret && secret.length >= 32) {
        return secret;
      }
    }
  } catch (error) {
    logger.warn("Could not read auth secret file:", error);
  }

  // Generate new secret
  const newSecret = crypto.randomBytes(32).toString('base64');
  
  // Try to persist it
  try {
    fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
    logger.info("Generated and saved new auth secret");
  } catch (error) {
    logger.warn("Could not save auth secret to file, using temporary secret:", error);
  }

  return newSecret;
}

// Build trusted origins list
const trustedOrigins: string[] = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Add configured URLs
if (process.env.NEXT_PUBLIC_URL) {
  trustedOrigins.push(process.env.NEXT_PUBLIC_URL);
}
if (process.env.APP_URL) {
  trustedOrigins.push(process.env.APP_URL);
}

// Add any additional trusted origins from environment
if (process.env.DASHARR_TRUSTED_ORIGINS) {
  trustedOrigins.push(...process.env.DASHARR_TRUSTED_ORIGINS.split(',').map(o => o.trim()));
}

export const auth = betterAuth({
  database: authDb,
  secret: getAuthSecret(),
  baseURL: process.env.NEXT_PUBLIC_URL || process.env.APP_URL || "http://localhost:3000",
  basePath: "/api/auth",
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Keep it simple for admin auth
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  onError: (error: unknown) => {
    logger.error("Better Auth Error:", error);
  },
});

// Type exports for better TypeScript support
export type Session = typeof auth.$Infer.Session;