import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), 'config');
    const AUTH_DB_PATH = path.join(CONFIG_DIR, 'dasharr-auth.db');
    
    logger.info(`Initializing auth database at: ${AUTH_DB_PATH}`);
    
    const db = new Database(AUTH_DB_PATH);
    
    // Create the tables that better-auth expects
    const schema = `
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        emailVerified BOOLEAN DEFAULT 0,
        name TEXT,
        image TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        expiresAt INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt INTEGER,
        refreshTokenExpiresAt INTEGER,
        scope TEXT,
        password TEXT,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
      CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
      CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
      CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
    `;

    try {
      db.exec(schema);
      
      // Enable foreign keys and WAL mode
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = WAL');
      
      logger.info('Auth database initialized successfully');
      
      return NextResponse.json({ success: true });
    } finally {
      db.close();
    }
  } catch (error) {
    logger.error('Failed to initialize auth database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize auth database' },
      { status: 500 }
    );
  }
}