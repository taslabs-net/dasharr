import { NextResponse } from 'next/server';
import { SABnzbdAPI } from '@/lib/api/sabnzbd';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { withInstanceSupport, createInstanceLogger } from '@/lib/api/multi-instance-wrapper';

const formatBytes = (bytes: number): number => {
  return bytes;
};

const parseSize = (sizeStr: string): number => {
  if (!sizeStr || sizeStr === '0' || sizeStr === '') return 0;
  
  // Extract number and unit from string like "45.7 GB" or "123 MB"
  const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)?$/i);
  if (!match) return 0;
  
  const size = parseFloat(match[1]);
  if (isNaN(size)) return 0;
  
  const unit = match[2]?.toUpperCase() || 'B';
  
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024,
  };
  
  return size * (multipliers[unit] || 1);
};

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'sabnzbd');
  try {
    if (!config.url || !config.apiKey) {
      return NextResponse.json(
        { error: 'SABnzbd not configured' },
        { status: 500 }
      );
    }

    const api = new SABnzbdAPI({
      url: config.url,
      apiKey: config.apiKey,
    });

    const [queueResult, historyResult, statusResult] = await Promise.allSettled([
      api.getQueue(),
      api.getHistory(0, 50), // Get more history for stats
      api.getStatus(),
    ]);

    const getResult = <T>(result: PromiseSettledResult<T>): T | null => {
      return result.status === 'fulfilled' ? result.value : null;
    };

    const queueData = getResult(queueResult);
    const historyData = getResult(historyResult);
    const statusData = getResult(statusResult);

    // Calculate stats
    let activeDownloads = 0;
    let totalQueueSize = 0;
    let downloadSpeed = 0;
    let completedToday = 0;
    let failedJobs = 0;

    if (queueData?.queue) {
      activeDownloads = parseInt(queueData.queue.noofslots) || 0;
      totalQueueSize = parseSize(queueData.queue.sizeleft || queueData.queue.size || '0');
      
      // Parse download speed - SABnzbd returns kbpersec as string
      const speedKB = parseFloat(queueData.queue.kbpersec || '0');
      downloadSpeed = speedKB / 1024; // Convert to MB/s
    }

    if (historyData?.history) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime() / 1000;
      
      historyData.history.slots.forEach(item => {
        // Count failed jobs
        if (item.status === 'Failed') {
          failedJobs++;
        }
        
        // Count completed today - SABnzbd's completed field is a Unix timestamp
        if (item.status === 'Completed' && item.completed && item.completed > todayTimestamp) {
          completedToday++;
        }
      });
    }

    const stats = {
      activeDownloads,
      totalQueueSize: formatBytes(totalQueueSize),
      downloadSpeed, // in MB/s
      completedToday,
      failedJobs,
      isPaused: statusData?.status?.paused || false,
      diskSpace: statusData?.status?.diskspace1 || '0',
      version: statusData?.status?.version || 'Unknown',
      uptime: statusData?.status?.uptime || '0',
      // Add download statistics - pass through the string values from SABnzbd
      totalDownloaded: historyData?.history?.total_size || '0 B',
      monthDownloaded: historyData?.history?.month_size || '0 B', 
      weekDownloaded: historyData?.history?.week_size || '0 B',
      todayDownloaded: historyData?.history?.day_size || '0 B',
    };

    return NextResponse.json({ stats });
  } catch (error) {
    instanceLogger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SABnzbd data' },
      { status: 500 }
    );
  }
});