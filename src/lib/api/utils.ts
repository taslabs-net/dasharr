import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  
  logger.debug(`Fetching URL: ${url}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    logger.debug(`Response from ${url}: ${response.status} ${response.statusText}`);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(`Request timeout after ${timeout}ms for URL: ${url}`);
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    logger.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

export async function handleApiError(response: Response, service: string) {
  let errorMessage: string;
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || `${service} API error`;
    
    // Log detailed error information
    logger.error(`${service} API error response:`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorData
    });
  } catch {
    errorMessage = `${service} API error: ${response.statusText}`;
    logger.error(`${service} API error (could not parse JSON):`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });
  }
  
  return new Error(`${errorMessage} (${response.status})`);
}

export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log full error details including stack trace
      logger.error('API handler error:', error);
      
      if (error instanceof Error) {
        logger.debug('Error stack trace:', error.stack);
        
        // In debug mode, include more error details in response
        const errorResponse = logger.getLevel() === 'debug' 
          ? { error: error.message, stack: error.stack }
          : { error: error.message };
          
        return NextResponse.json(
          errorResponse,
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}