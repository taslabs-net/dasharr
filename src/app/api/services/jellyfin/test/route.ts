import { NextResponse } from 'next/server';
import { testJellyfinConnection } from '@/lib/api/jellyfin';

export async function POST(request: Request) {
  try {
    const { url, apiKey } = await request.json();

    if (!url || !apiKey) {
      return NextResponse.json(
        { error: 'URL and API key are required' },
        { status: 400 }
      );
    }

    const isConnected = await testJellyfinConnection(url, apiKey);
    
    return NextResponse.json({ 
      success: isConnected,
      message: isConnected ? 'Connection successful' : 'Connection failed'
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}