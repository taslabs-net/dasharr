import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';
import { logger } from '@/lib/logger';

// This endpoint can be called to ensure database is initialized
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    logger.error('Database initialization failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed' 
    }, { status: 500 });
  }
}