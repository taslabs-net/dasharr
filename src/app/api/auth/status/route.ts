import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database/db-instance';
import { hasAdminUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    const db = await getDb();
    
    // Check if auth is enabled in settings
    const authEnabled = db.getSetting('authEnabled') || false;
    const hasAdmin = hasAdminUser();
    
    // Don't auto-disable auth - let the user control it
    // If auth is enabled but no admin exists, the UI will prompt to create one
    
    return NextResponse.json({ 
      authEnabled,
      hasAdmin
    });
  } catch (error) {
    return NextResponse.json({ 
      authEnabled: false,
      hasAdmin: false
    });
  }
}