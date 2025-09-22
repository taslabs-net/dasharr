import { NextRequest, NextResponse } from 'next/server';
import { 
  getServiceInstance, 
  saveServiceInstance, 
  deleteServiceInstance 
} from '@/lib/config-db';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceType: string; instanceId: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }
  
  try {
    const { instanceId } = await params;
    const instance = await getServiceInstance(instanceId);
    
    if (!instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ instance });
  } catch (error) {
    logger.error('Failed to fetch instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceType: string; instanceId: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }
  
  try {
    const { instanceId, serviceType } = await params;
    const { settings } = await request.json();
    
    if (!settings || !settings.displayName) {
      return NextResponse.json(
        { error: 'Invalid settings provided' },
        { status: 400 }
      );
    }
    
    // Add timestamp for last saved
    const instanceSettings: ServiceInstance = {
      ...settings,
      lastSaved: new Date().toISOString()
    };
    
    await saveServiceInstance(instanceId, instanceSettings);
    logger.info(`Saved instance ${instanceId} for ${serviceType}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Configuration saved successfully' 
    });
  } catch (error) {
    logger.error('Failed to save instance:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceType: string; instanceId: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }
  
  try {
    const { instanceId, serviceType } = await params;
    await deleteServiceInstance(instanceId);
    logger.info(`Deleted instance ${instanceId} for ${serviceType}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Instance deleted successfully' 
    });
  } catch (error) {
    logger.error('Failed to delete instance:', error);
    return NextResponse.json(
      { error: 'Failed to delete instance' },
      { status: 500 }
    );
  }
}