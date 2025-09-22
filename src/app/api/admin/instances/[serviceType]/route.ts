import { NextRequest, NextResponse } from 'next/server';
import { getServiceInstancesByType } from '@/lib/config-db';
import { ServiceType } from '@/lib/config/multi-instance-types';
import { requireAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceType: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.error!;
  }
  
  try {
    const { serviceType: type } = await params;
    const serviceType = type as ServiceType;
    const instances = await getServiceInstancesByType(serviceType);
    
    return NextResponse.json({
      instances
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch instances' },
      { status: 500 }
    );
  }
}