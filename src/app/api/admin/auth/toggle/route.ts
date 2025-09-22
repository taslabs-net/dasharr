import { NextResponse } from 'next/server';
import { getDb } from '@/lib/database/db-instance';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { enabled } = await request.json();
    
    const db = await getDb();
    
    // Set auth enabled status
    db.setSetting('authEnabled', enabled);
    
    logger.info(`Authentication ${enabled ? 'enabled' : 'disabled'}`);
    
    return NextResponse.json({ 
      success: true,
      authEnabled: enabled
    });
  } catch (error) {
    logger.error('Failed to toggle auth:', error);
    return NextResponse.json(
      { error: 'Failed to update authentication settings' },
      { status: 500 }
    );
  }
}