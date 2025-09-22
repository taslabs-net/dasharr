import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    logger.info('[Dasharr] Startup endpoint called');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Startup logged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Dasharr] Startup endpoint error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to log startup' },
      { status: 500 }
    );
  }
}
