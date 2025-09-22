import { NextResponse } from 'next/server';
import { getServiceInstances } from '@/lib/config-db';

export async function GET() {
  // Public endpoint - no auth required for read access
  try {
    const instances = await getServiceInstances();
    
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