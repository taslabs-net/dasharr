import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getDb } from '@/lib/database/db-instance';

export async function requireAuth(request: NextRequest) {
  try {
    const db = await getDb();
    const authEnabled = db.getSetting('authEnabled') || false;
    
    // If auth is not enabled, allow access (backward compatibility)
    if (!authEnabled) {
      return { authenticated: true, user: null };
    }
    
    // Check for session
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session) {
      logger.warn('Unauthorized admin access attempt');
      return { 
        authenticated: false, 
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }
    
    return { authenticated: true, user: session.user };
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return { 
      authenticated: false,
      error: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    };
  }
}