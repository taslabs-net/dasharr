import { NextRequest } from 'next/server';

/**
 * Check if we should trust proxy headers from environment variable
 */
function shouldTrustProxy(): boolean {
  return process.env.TRUST_PROXY === 'true';
}

/**
 * Get the real client IP address, considering proxy headers if TRUST_PROXY is enabled
 */
export function getRealIp(request: NextRequest): string {
  if (shouldTrustProxy()) {
    // Check X-Forwarded-For header
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, get the first one
      return forwardedFor.split(',')[0].trim();
    }
    
    // Check X-Real-IP header
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
  }
  
  // Fall back to unknown if no IP can be determined
  return 'unknown';
}

/**
 * Get the real protocol (http/https), considering proxy headers if TRUST_PROXY is enabled
 */
export function getRealProtocol(request: NextRequest): string {
  if (shouldTrustProxy()) {
    // Check X-Forwarded-Proto header
    const forwardedProto = request.headers.get('x-forwarded-proto');
    if (forwardedProto) {
      return forwardedProto;
    }
  }
  
  // Fall back to checking the URL
  return request.url.startsWith('https://') ? 'https' : 'http';
}

/**
 * Get the real host, considering proxy headers if TRUST_PROXY is enabled
 */
export function getRealHost(request: NextRequest): string {
  if (shouldTrustProxy()) {
    // Check X-Forwarded-Host header
    const forwardedHost = request.headers.get('x-forwarded-host');
    if (forwardedHost) {
      return forwardedHost;
    }
  }
  
  // Fall back to Host header
  return request.headers.get('host') || 'localhost';
}

/**
 * Construct the full URL for the application, considering proxy settings
 */
export function getFullUrl(request: NextRequest, path: string = ''): string {
  if (shouldTrustProxy()) {
    // Use configured APP_URL if behind a proxy
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${appUrl}${path}`;
  }
  
  // Construct URL from request
  const protocol = getRealProtocol(request);
  const host = getRealHost(request);
  return `${protocol}://${host}${path}`;
}

/**
 * Get headers to forward when making requests to services
 * This ensures services receive the correct client information
 */
export function getForwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (shouldTrustProxy()) {
    // Forward relevant headers when behind a proxy
    const realIp = getRealIp(request);
    if (realIp !== 'unknown') {
      headers['X-Real-IP'] = realIp;
    }
    
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      headers['X-Forwarded-For'] = forwardedFor;
    }
    
    headers['X-Forwarded-Proto'] = getRealProtocol(request);
    headers['X-Forwarded-Host'] = getRealHost(request);
  }
  
  return headers;
}