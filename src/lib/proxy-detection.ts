import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

interface DetectionResult {
  isLikelyBehindProxy: boolean;
  detectedUrl: string;
  proxyHeaders: string[];
  suggestions: {
    trustProxy: boolean;
    appUrl: string;
  };
}

export function detectProxyConfiguration(request: NextRequest): DetectionResult {
  const headers = request.headers;
  const detectedHeaders: string[] = [];
  
  // Check if this is a localhost request - these shouldn't be considered proxied
  const host = headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1');
  
  logger.debug(`🔍 Proxy detection starting for host: ${host}`);
  logger.trace(`🏠 Is localhost: ${isLocalhost}`);
  
  // Log all relevant headers for debugging
  const relevantHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase().includes('forward') || 
        key.toLowerCase().includes('proxy') || 
        key.toLowerCase().includes('real-ip') ||
        key.toLowerCase().includes('cf-') ||
        key.toLowerCase().includes('x-') ||
        key === 'host') {
      relevantHeaders[key] = value;
    }
  });
  logger.trace('📋 Relevant headers found:', relevantHeaders);
  
  // Check for common reverse proxy headers
  const proxyHeaderChecks = [
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-forwarded-host',
    'x-real-ip',
    'cf-connecting-ip',      // Cloudflare
    'x-nginx-proxy',         // Nginx Proxy Manager
    'x-forwarded-server',    // Traefik
    'x-forwarded-port',
    'x-scheme',
    'x-original-url',
    'x-original-host',
    'cf-visitor',            // Cloudflare
    'cf-ray',                // Cloudflare
    'x-vercel-forwarded-for', // Vercel
    'x-forwarded-by',        // Zoraxy
    'x-proxy-by'             // Some other proxies
  ];
  
  // Check which proxy headers are present (but ignore for localhost)
  if (!isLocalhost) {
    proxyHeaderChecks.forEach(header => {
      const value = headers.get(header);
      if (value) {
        detectedHeaders.push(header);
        logger.trace(`🔗 Found proxy header: ${header} = ${value}`);
      }
    });
    logger.debug(`📊 Found ${detectedHeaders.length} proxy headers: [${detectedHeaders.join(', ')}]`);
  } else {
    logger.debug('🏠 Skipping proxy header detection for localhost connection');
  }
  
  // Additional heuristic: if accessing via HTTPS on non-443 port, likely behind proxy
  let isLikelyBehindProxy = detectedHeaders.length > 0;
  
  if (!isLikelyBehindProxy && !isLocalhost) {
    const host = headers.get('host') || '';
    const hostWithoutPort = host.split(':')[0];
    
    // Heuristic 1: HTTPS on non-standard port suggests proxy
    const hasNonStandardPort = host.includes(':') && !host.includes(':443') && !host.includes(':80');
    const isHttpsRequest = headers.get('x-forwarded-proto') === 'https' || 
                          process.env.NODE_ENV === 'production';
    
    // Heuristic 2: Custom domain (not IP address) accessing on port 3000 suggests proxy
    const isCustomDomain = !hostWithoutPort.match(/^\d+\.\d+\.\d+\.\d+$/) && 
                           hostWithoutPort !== 'localhost' && 
                           host.includes(':3000');
    
    if ((hasNonStandardPort && isHttpsRequest) || isCustomDomain) {
      isLikelyBehindProxy = true;
      logger.debug('🔍 Heuristic detection: Custom domain or HTTPS on non-standard port suggests proxy');
    }
  }
  
  logger.debug(`🎯 Proxy detection result: ${isLikelyBehindProxy ? 'PROXY DETECTED' : 'NO PROXY'}`);
  
  // Detect the app URL based on headers
  let detectedUrl = '';
  
  if (isLikelyBehindProxy) {
    // Build URL from forwarded headers
    const proto = headers.get('x-forwarded-proto') || 
                   headers.get('x-scheme') || 
                   (headers.get('cf-visitor') ? JSON.parse(headers.get('cf-visitor') || '{}').scheme : null) ||
                   'https';
                   
    const hostHeader = headers.get('x-forwarded-host') || 
                       headers.get('x-original-host') || 
                       headers.get('host') || 
                       'localhost:3000';
                 
    // Always extract clean hostname without port
    const hostWithoutPort = hostHeader.split(':')[0];
    const port = headers.get('x-forwarded-port') || hostHeader.split(':')[1];
    
    logger.debug(`🔍 Building URL - proto: ${proto}, hostHeader: ${hostHeader}, hostWithoutPort: ${hostWithoutPort}, port: ${port}`);
    
    // Don't include port if it's standard for the protocol or if using HTTPS
    const isStandardPort = (proto === 'https' && port === '443') || (proto === 'http' && port === '80');
    
    if (port && !isStandardPort && proto !== 'https') {
      detectedUrl = `${proto}://${hostWithoutPort}:${port}`;
      logger.debug(`🔍 Including port in URL: ${detectedUrl}`);
    } else {
      detectedUrl = `${proto}://${hostWithoutPort}`;
      logger.debug(`🔍 Excluding port from URL: ${detectedUrl}`);
    }
  } else {
    // Use direct connection info
    const host = headers.get('host') || 'localhost:3000';
    
    // Determine protocol: if it's a custom domain in production, assume HTTPS
    const isCustomDomain = !host.includes('localhost') && !host.includes('127.0.0.1') && !host.match(/^\d+\.\d+\.\d+\.\d+/);
    const proto = isCustomDomain ? 'https' : 
                  (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 
                   (process.env.NODE_ENV === 'production' ? 'https' : 'http'));
    
    // For direct connections, use the host as-is (Zoraxy sends the clean domain)
    const hostWithoutPort = host.split(':')[0];
    const port = host.split(':')[1];
    
    // Only include port if it's not the standard port for the protocol
    if (port && !((proto === 'https' && port === '443') || (proto === 'http' && port === '80'))) {
      detectedUrl = `${proto}://${hostWithoutPort}:${port}`;
    } else {
      detectedUrl = `${proto}://${hostWithoutPort}`;
    }
    
    logger.debug(`🌐 Direct connection URL: ${detectedUrl} (custom domain: ${isCustomDomain})`);
  }
  
  const result = {
    isLikelyBehindProxy,
    detectedUrl,
    proxyHeaders: detectedHeaders,
    suggestions: {
      trustProxy: isLikelyBehindProxy,
      appUrl: detectedUrl
    }
  };
  
  logger.debug('✅ Proxy detection complete:', {
    proxy: result.isLikelyBehindProxy,
    url: result.detectedUrl,
    headers: result.proxyHeaders.length,
    trustProxy: result.suggestions.trustProxy
  });
  
  return result;
}

// Get proxy type based on headers
export function getProxyType(headers: string[]): string {
  if (headers.some(h => h.startsWith('cf-'))) return 'Cloudflare';
  if (headers.includes('x-nginx-proxy')) return 'Nginx Proxy Manager';
  if (headers.includes('x-forwarded-server')) return 'Traefik';
  if (headers.includes('x-vercel-forwarded-for')) return 'Vercel';
  if (headers.length > 0) return 'Generic Reverse Proxy';
  return 'None';
}