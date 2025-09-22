import Database from 'better-sqlite3';
import path from 'path';

export function hasAdminUser(): boolean {
  try {
    const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), 'config');
    const AUTH_DB_PATH = path.join(CONFIG_DIR, 'dasharr-auth.db');
    
    const db = new Database(AUTH_DB_PATH, { readonly: true });
    
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get() as { count: number };
      return userCount.count > 0;
    } finally {
      db.close();
    }
  } catch (error) {
    // If database doesn't exist or table doesn't exist, no admin
    return false;
  }
}