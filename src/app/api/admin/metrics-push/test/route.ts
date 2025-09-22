import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { metricsCollector } from '@/lib/metrics/collector';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    // Validate required fields
    if (!settings.workerUrl || !settings.dashboardSecret) {
      return NextResponse.json(
        { error: 'Missing required fields: workerUrl and dashboardSecret' },
        { status: 400 }
      );
    }

    // Try to collect and push metrics once
    try {
      // Get configured services
      const services = await metricsCollector.getConfiguredServices();
      
      if (services.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No services configured. Please configure at least one service first.'
        });
      }

      // Collect all metrics from all configured instances
      const metrics = await metricsCollector.collectAll();

      if (!metrics) {
        return NextResponse.json({
          success: false,
          error: 'No metrics collected from any configured instances'
        });
      }

      // Transform metrics to the expected format
      // Note: This function is currently not used but kept for future use
      /*
      const _transformMetrics = (serviceType: string, metrics: unknown): Record<string, number> => {
        const m = metrics as Record<string, number>;
        switch (serviceType) {
          case 'sonarr':
            return {
              series_total: m.seriesTotal || 0,
              series_monitored: m.seriesMonitored || 0,
              episodes_total: m.episodesTotal || 0,
              episodes_downloaded: m.episodesDownloaded || 0,
              episodes_missing: m.episodesMissing || 0,
              queue_count: m.queueCount || 0,
              health_issues: m.healthIssues || 0
            };
          case 'radarr':
            return {
              movies_total: m.moviesTotal || 0,
              movies_monitored: m.moviesMonitored || 0,
              movies_downloaded: m.moviesDownloaded || 0,
              movies_missing: m.moviesMissing || 0,
              queue_count: m.queueCount || 0,
              health_issues: m.healthIssues || 0
            };
          case 'prowlarr':
            return {
              indexers_total: m.indexersTotal || 0,
              indexers_enabled: m.indexersEnabled || 0,
              indexers_failing: m.indexersFailing || 0,
              apps_total: m.appsTotal || 0,
              health_issues: m.healthIssues || 0
            };
          default:
            return m || {};
        }
      };
      */

      // Use first available instance for testing
      const firstInstanceId = Object.keys(metrics).find(key => 
        key !== 'timestamp' && key !== 'collection_duration_ms'
      );
      
      if (!firstInstanceId) {
        return NextResponse.json({
          success: false,
          error: 'No instance data available for testing'
        });
      }

      // Prepare payload with first instance data
      const payload = {
        container_id: `${settings.containerId || 'dasharr-test'}-${firstInstanceId}`,
        service_type: 'multi-instance',
        metrics: metrics
      };

      // Send test push
      const endpoint = settings.useQueue ? '/api/v1/metrics/queue' : '/api/v1/metrics';
      const url = `${settings.workerUrl}${endpoint}`;
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.dashboardSecret}`
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 200) {
        const queueMessage = settings.useQueue ? ' using Cloudflare Queues' : '';
        return NextResponse.json({
          success: true,
          message: `Test push completed successfully for multi-instance metrics${queueMessage}. Check your analytics platform logs for details.`
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `Unexpected response: ${response.status} - ${JSON.stringify(response.data)}`
        });
      }
    } catch (error) {
      logger.error('Test push failed:', error);
      if (axios.isAxiosError(error)) {
        return NextResponse.json({
          success: false,
          error: error.response ? 
            `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
            error.message
        });
      }
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Test push failed'
      });
    }
  } catch (error) {
    logger.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}