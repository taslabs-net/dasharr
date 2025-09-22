import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), 'config');
    const AUTH_DB_PATH = path.join(CONFIG_DIR, 'dasharr-auth.db');
    
    const db = new Database(AUTH_DB_PATH, { readonly: true });
    
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get() as { count: number };
      const hasAdmin = userCount.count > 0;
      
      logger.info(`Admin check: ${hasAdmin ? 'Admin exists' : 'No admin user'}`);
      
      return NextResponse.json({ hasAdmin });
    } finally {
      db.close();
    }
  } catch (error) {
    logger.error('Error checking admin status:', error);
    // If database doesn't exist or table doesn't exist, no admin
    return NextResponse.json({ hasAdmin: false });
  }
}