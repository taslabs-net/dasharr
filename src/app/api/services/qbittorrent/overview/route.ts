/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { createQBittorrentClient } from '@/lib/api/qbittorrent';
import { withInstanceSupport, createInstanceLogger } from '@/lib/api/multi-instance-wrapper';

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'qbittorrent');
  try {
    if (!config.url || !config.username || !config.password) {
      return NextResponse.json(
        { error: 'qBittorrent not configured' },
        { status: 503 }
      );
    }

    const qbittorrent = createQBittorrentClient({
      url: config.url,
      username: config.username,
      password: config.password,
    });

    // Fetch all available data in parallel
    const [
      version,
      preferences,
      mainData,
      torrents,
      globalTransferInfo,
      categories,
      tags,
    ] = await Promise.allSettled([
      qbittorrent.getVersion(),
      qbittorrent.getPreferences(),
      qbittorrent.getMainData(),
      qbittorrent.getTorrents(),
      qbittorrent.getGlobalTransferInfo(),
      qbittorrent.getCategories(),
      qbittorrent.getTags(),
    ]);

    // Process results and handle errors gracefully
    const getResult = (result: PromiseSettledResult<unknown>) => 
      result.status === 'fulfilled' ? result.value : null;

    const versionData = getResult(version) as string | null;
    const preferencesData = getResult(preferences) as any;
    const mainDataResult = getResult(mainData) as any;
    const torrentsData = (getResult(torrents) as any[]) || [];
    const transferData = getResult(globalTransferInfo) as any;
    const categoriesData = getResult(categories) as any;
    const tagsData = (getResult(tags) as string[]) || [];

    // Calculate statistics
    const activeTorrents = torrentsData.filter((t) => 
      ['downloading', 'uploading', 'forcedDL', 'forcedUP'].includes(t.state)
    );
    const pausedTorrents = torrentsData.filter((t) => 
      ['pausedDL', 'pausedUP'].includes(t.state)
    );
    const completedTorrents = torrentsData.filter((t) => t.progress === 1);
    const downloadingTorrents = torrentsData.filter((t) => 
      ['downloading', 'forcedDL', 'stalledDL', 'metaDL', 'queuedDL'].includes(t.state)
    );

    const totalSize = torrentsData.reduce((sum, t) => sum + (t.size || 0), 0);
    const totalDownloaded = torrentsData.reduce((sum, t) => sum + (t.downloaded || 0), 0);
    const totalUploaded = torrentsData.reduce((sum, t) => sum + (t.uploaded || 0), 0);

    const stats = {
      totalTorrents: torrentsData.length,
      activeTorrents: activeTorrents.length,
      pausedTorrents: pausedTorrents.length,
      completedTorrents: completedTorrents.length,
      downloadingTorrents: downloadingTorrents.length,
      downloadSpeed: transferData?.dl_info_speed || 0,
      uploadSpeed: transferData?.up_info_speed || 0,
      totalDownloaded: mainDataResult?.server_state?.alltime_dl || 0,
      totalUploaded: mainDataResult?.server_state?.alltime_ul || 0,
      sessionDownloaded: transferData?.dl_info_data || 0,
      sessionUploaded: transferData?.up_info_data || 0,
      freeSpace: mainDataResult?.server_state?.free_space_on_disk || 0,
      dhtNodes: transferData?.dht_nodes || 0,
      totalSize,
      totalDownloadedData: totalDownloaded,
      totalUploadedData: totalUploaded,
      globalRatio: mainDataResult?.server_state?.global_ratio || '0',
    };

    // Get recent torrents sorted by added date
    const recentTorrents = [...torrentsData]
      .sort((a, b) => (b.added_on || 0) - (a.added_on || 0))
      .slice(0, 10);

    // Get active downloads with progress
    const activeDownloads = downloadingTorrents
      .sort((a, b) => (b.dlspeed || 0) - (a.dlspeed || 0))
      .slice(0, 10);

    return NextResponse.json({
      system: {
        version: versionData,
        preferences: preferencesData ? {
          web_ui_port: preferencesData.web_ui_port,
          dht: preferencesData.dht,
          pex: preferencesData.pex,
          lsd: preferencesData.lsd,
          encryption: preferencesData.encryption,
          queueing_enabled: preferencesData.queueing_enabled,
          max_active_downloads: preferencesData.max_active_downloads,
          max_active_uploads: preferencesData.max_active_uploads,
          max_active_torrents: preferencesData.max_active_torrents,
          dl_limit: preferencesData.dl_limit,
          up_limit: preferencesData.up_limit,
        } : null,
        serverState: mainDataResult?.server_state || null,
      },
      stats,
      activity: {
        torrents: torrentsData,
        recentTorrents,
        activeDownloads,
        categories: categoriesData || {},
        tags: tagsData,
      },
      transfer: {
        connectionStatus: transferData?.connection_status || 'disconnected',
        dhtNodes: transferData?.dht_nodes || 0,
        downloadData: transferData?.dl_info_data || 0,
        downloadSpeed: transferData?.dl_info_speed || 0,
        uploadData: transferData?.up_info_data || 0,
        uploadSpeed: transferData?.up_info_speed || 0,
      },
    });
  } catch (error) {
    instanceLogger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch qBittorrent data' },
      { status: 500 }
    );
  }
});