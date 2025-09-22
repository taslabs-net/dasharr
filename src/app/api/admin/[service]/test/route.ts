import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface TestSettings {
  url: string;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  apiKey1?: string;
  apiKey2?: string;
  siteManagerApiKey?: string;
}

async function testServiceConnection(service: string, settings: TestSettings) {
  const { url, apiKey, token, username, password, apiKey1, apiKey2, siteManagerApiKey } = settings;

  if (!url) {
    throw new Error('URL is required');
  }

  let testUrl: string;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Configure test endpoints and headers for each service
  switch (service) {
    case 'plex':
      if (!token) throw new Error('Plex token is required');
      testUrl = `${url}/identity`;
      headers['X-Plex-Token'] = token;
      headers['Accept'] = 'application/json';
      break;
      
    case 'radarr':
    case 'sonarr':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/api/v3/system/status`;
      headers['X-Api-Key'] = apiKey;
      break;
      
    case 'prowlarr':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/api/v1/system/status`;
      headers['X-Api-Key'] = apiKey;
      break;
      
    case 'overseerr':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/api/v1/status`;
      headers['X-Api-Key'] = apiKey;
      break;
      
    case 'sabnzbd':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/api?mode=version&apikey=${apiKey}&output=json`;
      break;
      
    case 'tautulli':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/api/v2?apikey=${apiKey}&cmd=get_server_info`;
      break;
      
    case 'qbittorrent':
      if (!username || !password) throw new Error('Username and password are required');
      // For qBittorrent, we need to test login instead of version endpoint
      testUrl = `${url}/api/v2/auth/login`;
      break;
      
    case 'jellyfin':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/System/Info`;
      headers['X-Emby-Token'] = apiKey;
      break;
      
    case 'jellyseerr':
      if (!apiKey) throw new Error('API key is required');
      testUrl = `${url}/api/v1/status`;
      headers['X-Api-Key'] = apiKey;
      break;
      
    case 'unifi': {
      // For UniFi, we test with the first available API key
      const unifiApiKey = apiKey1 || apiKey2;
      if (!unifiApiKey && !siteManagerApiKey) {
        throw new Error('At least one API key is required');
      }
      
      if (unifiApiKey) {
        // Test Network Integration API
        testUrl = `${url}/proxy/network/integration/v1/sites`;
        headers['X-API-KEY'] = unifiApiKey;
      } else {
        // Test Site Manager API  
        testUrl = 'https://api.ui.com/v1/hosts';
        headers['X-API-KEY'] = siteManagerApiKey!;
      }
      break;
    }
      
    default:
      throw new Error(`Unknown service: ${service}`);
  }

  // Test the connection
  let response;
  
  try {
    if (service === 'qbittorrent') {
      // qBittorrent requires POST with form data for login
      const formData = new URLSearchParams();
      formData.append('username', username!);
      formData.append('password', password!);
      
      response = await fetch(testUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } else {
      response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    }
  } catch (fetchError) {
    // Handle network errors including self-signed certificate issues
    if (fetchError instanceof Error && fetchError.message.includes('certificate')) {
      throw new Error('SSL certificate error - ensure your service uses a valid certificate');
    }
    throw fetchError;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed - check your API key/token');
    } else if (response.status === 404) {
      throw new Error('Service not found - check your URL');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Try to parse response for additional validation
  try {
    let data;
    
    if (service === 'qbittorrent') {
      // qBittorrent login returns "Ok." on success
      const text = await response.text();
      if (text.toLowerCase() !== 'ok.') {
        throw new Error('Invalid qBittorrent login response');
      }
      data = { success: true };
    } else {
      // First, check if the response is actually JSON
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      if (!contentType || !contentType.includes('application/json')) {
        // If we got HTML instead of JSON, provide helpful error
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          throw new Error(
            `Received HTML instead of JSON. This usually means:\n` +
            `1. The URL is incorrect or redirecting to a web page\n` +
            `2. You're using a reverse proxy - set APP_URL and TRUST_PROXY=true\n` +
            `3. The service requires authentication`
          );
        }
        throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
      }
      
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Failed to parse JSON response: ${responseText.substring(0, 100)}...`);
      }
    }
    
    // Service-specific validation
    switch (service) {
      case 'plex':
        if (!data.MediaContainer) {
          throw new Error('Invalid Plex response');
        }
        break;
      case 'radarr':
      case 'sonarr':
        if (!data.version) {
          throw new Error(`Invalid ${service} response`);
        }
        break;
      case 'prowlarr':
        if (!data.version) {
          throw new Error('Invalid Prowlarr response');
        }
        break;
      case 'overseerr':
        if (!data.version) {
          throw new Error('Invalid Overseerr response');
        }
        break;
      case 'sabnzbd':
        if (!data.version) {
          throw new Error('Invalid SABnzbd response');
        }
        break;
      case 'tautulli':
        if (!data.response || !data.response.result) {
          throw new Error('Invalid Tautulli response');
        }
        break;
      case 'jellyfin':
        if (!data.ServerName) {
          throw new Error('Invalid Jellyfin response');
        }
        break;
      case 'jellyseerr':
        if (!data.version) {
          throw new Error('Invalid Jellyseerr response');
        }
        break;
    }
    
    return { success: true, data };
  } catch (error) {
    // If JSON parsing fails but response was OK, it might still be valid
    if (service === 'qbittorrent' && response.ok) {
      return { success: true, message: 'qBittorrent connection successful' };
    }
    // Re-throw with the original error message
    throw error;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings provided' },
        { status: 400 }
      );
    }

    const result = await testServiceConnection(service, settings);
    
    return NextResponse.json({
      message: `${service} connection successful!`,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to test ${(await params).service} connection:`, error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Connection test failed',
        message: `Failed to connect to ${(await params).service}`
      },
      { status: 400 }
    );
  }
}