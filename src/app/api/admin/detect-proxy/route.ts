import { NextRequest, NextResponse } from 'next/server';
import { detectProxyConfiguration, getProxyType } from '@/lib/proxy-detection';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Log all incoming headers for debugging
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    logger.info('All request headers:', allHeaders);
    
    const detection = detectProxyConfiguration(request);
    const proxyType = getProxyType(detection.proxyHeaders);
    
    logger.info('Auto-detection result:', {
      isLikelyBehindProxy: detection.isLikelyBehindProxy,
      proxyType,
      detectedHeaders: detection.proxyHeaders,
      detectedUrl: detection.detectedUrl
    });
    
    return NextResponse.json({
      ...detection,
      proxyType
    });
  } catch (error) {
    logger.error('Error detecting configuration:', error);
    return NextResponse.json(
      { error: 'Failed to detect configuration' },
      { status: 500 }
    );
  }
}