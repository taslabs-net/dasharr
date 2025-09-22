import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { getRealIp } from '@/lib/proxy-utils';
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";

// Simple request logger for production visibility  
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if auth is enabled for admin routes
  if (path.startsWith('/admin') && path !== '/admin/login' && path !== '/admin/enable-auth') {
    try {
      // First check if auth is enabled
      const authStatusRes = await fetch(`${request.nextUrl.origin}/api/auth/status`);
      const { authEnabled } = await authStatusRes.json();
      
      // Only check session if auth is enabled
      if (authEnabled) {
        const { data: session } = await betterFetch<Session>(
          "/api/auth/get-session",
          {
            baseURL: request.nextUrl.origin,
            headers: {
              cookie: request.headers.get("cookie") || "",
            },
          }
        );

        if (!session) {
          const loginUrl = new URL('/admin/login', request.url);
          loginUrl.searchParams.set('from', path);
          return NextResponse.redirect(loginUrl);
        }
      }
    } catch (error) {
      // If auth check fails, allow access (fail open for better UX)
      logger.debug('Auth check error (allowing access):', error);
    }
  }
  
  // Only log API requests and page navigations, not static assets
  // Service pages we want to track
  const servicePages = ['/plex', '/jellyfin', '/radarr', '/sonarr', '/tautulli', '/sabnzbd', '/qbittorrent', '/prowlarr', '/overseerr'];
  
  if (
    path.startsWith('/api/') || 
    path.startsWith('/admin') ||
    path === '/' ||
    servicePages.includes(path) ||
    (path.startsWith('/') && !path.includes('.') && !path.startsWith('/_next'))
  ) {
    // Use our logger for consistent formatting with real client IP
    const clientIp = getRealIp(request);
    logger.request(request.method, `${path} [${clientIp}]`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|icons).*)',
  ],
};