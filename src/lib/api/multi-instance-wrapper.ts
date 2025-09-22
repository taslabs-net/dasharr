import { NextRequest, NextResponse } from 'next/server';
import { getServiceInstance } from '@/lib/config-db';
import { logger } from '@/lib/logger';
import { ServiceInstance } from '@/lib/config/multi-instance-types';

// Helper to create instance-aware logger
export function createInstanceLogger(instanceId: string, serviceType: string) {
  return {
    info: (message: string, ...args: unknown[]) => logger.info(`[${serviceType}:${instanceId}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(`[${serviceType}:${instanceId}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(`[${serviceType}:${instanceId}] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => logger.debug(`[${serviceType}:${instanceId}] ${message}`, ...args),
  };
}

// Wrapper to handle multi-instance API requests
// Using proper function overloads with implementation signature
export function withInstanceSupport(
  handler: ((config: ServiceInstance, instanceId: string) => Promise<NextResponse>) | 
           ((config: ServiceInstance, instanceId: string, request: NextRequest) => Promise<NextResponse>)
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      // Get instance ID from query params
      const { searchParams } = new URL(request.url);
      const instanceId = searchParams.get('instance');
      
      if (!instanceId) {
        logger.error('No instance ID provided in request');
        return NextResponse.json(
          { error: 'Instance ID is required' },
          { status: 400 }
        );
      }
      
      // Get the specific instance configuration
      logger.debug(`Processing request for instance: ${instanceId}`);
      const instance = await getServiceInstance(instanceId);
      
      if (!instance || !instance.url) {
        logger.warn(`Instance ${instanceId} not found or not configured`);
        return NextResponse.json(
          { error: `Instance ${instanceId} not configured` },
          { status: 503 }
        );
      }
      
      // Create config object compatible with existing API clients
      const configObj = {
        url: instance.url,
        apiKey: instance.apiKey,
        token: instance.token,
        username: instance.username,
        password: instance.password,
        // Include any other fields that might be needed
        ...instance
      };
      
      // Check handler arity to determine if it expects request parameter
      if (handler.length === 3) {
        return (handler as (config: ServiceInstance, instanceId: string, request: NextRequest) => Promise<NextResponse>)(configObj, instanceId, request);
      } else {
        return (handler as (config: ServiceInstance, instanceId: string) => Promise<NextResponse>)(configObj, instanceId);
      }
    } catch (error) {
      const { searchParams } = new URL(request.url);
      const instanceId = searchParams.get('instance') || 'unknown';
      logger.error(`Multi-instance wrapper error for instance ${instanceId}:`, error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Wrapper for routes with dynamic parameters
export function withInstanceSupportDynamic<T extends unknown[]>(
  handler: (config: ServiceInstance, instanceId: string, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T) => {
    try {
      // Get instance ID from query params
      const { searchParams } = new URL(request.url);
      const instanceId = searchParams.get('instance');
      
      if (!instanceId) {
        logger.error('No instance ID provided in request');
        return NextResponse.json(
          { error: 'Instance ID is required' },
          { status: 400 }
        );
      }
      
      // Get the specific instance configuration
      logger.debug(`Processing request for instance: ${instanceId}`);
      const instance = await getServiceInstance(instanceId);
      
      if (!instance || !instance.url) {
        logger.warn(`Instance ${instanceId} not found or not configured`);
        return NextResponse.json(
          { error: `Instance ${instanceId} not configured` },
          { status: 503 }
        );
      }
      
      // Create config object compatible with existing API clients
      const configObj = {
        url: instance.url,
        apiKey: instance.apiKey,
        token: instance.token,
        username: instance.username,
        password: instance.password,
        // Include any other fields that might be needed
        ...instance
      };
      
      return handler(configObj, instanceId, request, ...args);
    } catch (error) {
      const { searchParams } = new URL(request.url);
      const instanceId = searchParams.get('instance') || 'unknown';
      logger.error(`Multi-instance wrapper error for instance ${instanceId}:`, error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}