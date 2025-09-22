import { NextResponse } from 'next/server';
import { PlexAPI } from '@/lib/api/plex';
import { ServiceInstance } from '@/lib/config/multi-instance-types';
import { withInstanceSupport, createInstanceLogger } from '@/lib/api/multi-instance-wrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withInstanceSupport(async (config: ServiceInstance, instanceId: string) => {
  const instanceLogger = createInstanceLogger(instanceId, 'plex');
  try {
    if (!config.url || !config.token) {
      return NextResponse.json(
        { error: 'Plex not configured' },
        { status: 503 }
      );
    }

    const api = new PlexAPI({
      url: config.url,
      token: config.token,
    });

    // Fetch data in parallel
    const [
      identityResult,
      capabilitiesResult,
      librariesResult,
      usersResult,
      sessionsResult,
      devicesResult,
      activitiesResult,
      recentlyAddedResult,
      onDeckResult,
    ] = await Promise.allSettled([
      api.getServerIdentity(),
      api.getServerCapabilities(),
      api.getLibraries(),
      api.getUsers(),
      api.getSessions(),
      api.getDevices(),
      api.getActivities(),
      api.getRecentlyAdded(),
      api.getOnDeck(),
    ]);

    const getResult = <T>(result: PromiseSettledResult<T>): T | null => {
      return result.status === 'fulfilled' ? result.value : null;
    };

    const identity = getResult(identityResult);
    const capabilities = getResult(capabilitiesResult);
    const libraries = getResult(librariesResult) || [];
    const users = getResult(usersResult) || [];
    const sessions = getResult(sessionsResult) || [];
    const devices = getResult(devicesResult) || [];
    const activities = getResult(activitiesResult);
    const recentlyAdded = getResult(recentlyAddedResult);
    const onDeck = getResult(onDeckResult);

    // Fetch library counts directly from Plex
    const librariesWithCounts = await Promise.all(
      libraries.map(async (library) => {
        try {
          const count = await api.getLibraryCount(library.key);
          return { ...library, count };
        } catch {
          instanceLogger.debug(`Could not fetch count for library ${library.key}`);
          return { ...library, count: 0 };
        }
      })
    );

    // Calculate stats
    let totalItems = 0;
    let movieCount = 0;
    let showCount = 0;
    const episodeCount = 0;
    let artistCount = 0;
    const albumCount = 0;
    let photoCount = 0;

    // Calculate counts from Plex data
    for (const library of librariesWithCounts) {
      const count = library.count || 0;
      totalItems += count;
      
      switch (library.type) {
        case 'movie':
          movieCount += count;
          break;
        case 'show':
          showCount += count;
          // For TV shows, we'd need to fetch episode counts separately
          // For now, we'll leave episodeCount as 0
          break;
        case 'artist':
          artistCount += count;
          break;
        case 'photo':
          photoCount += count;
          break;
      }
    }

    const activeStreams = sessions.length;
    const totalBandwidth = sessions.reduce((sum, session) => {
      if (session.Media && session.Media[0]) {
        return sum + (session.Media[0].bitrate || 0);
      }
      return sum;
    }, 0);

    const transcodeSessions = sessions.filter(s => s.TranscodeSession).length;
    const directPlaySessions = sessions.filter(s => 
      !s.TranscodeSession || s.TranscodeSession.videoDecision === 'directplay'
    ).length;

    const response = NextResponse.json({
      server: {
        identity: identity?.MediaContainer ? {
          name: capabilities?.MediaContainer?.friendlyName || 'Plex Media Server',
          version: identity.MediaContainer.version,
          platform: identity.MediaContainer.platform,
          platformVersion: identity.MediaContainer.platformVersion,
          machineIdentifier: identity.MediaContainer.machineIdentifier,
          updatedAt: identity.MediaContainer.updatedAt,
        } : null,
        capabilities: capabilities?.MediaContainer ? {
          myPlexUsername: capabilities.MediaContainer.myPlexUsername,
          allowSync: capabilities.MediaContainer.sync,
          certificate: capabilities.MediaContainer.certificate,
          multiuser: capabilities.MediaContainer.multiuser,
          transcoder: capabilities.MediaContainer.transcoder,
        } : null,
      },
      stats: {
        totalItems,
        movieCount,
        showCount,
        // Only include these counts if they're greater than 0
        ...(episodeCount > 0 && { episodeCount }),
        ...(artistCount > 0 && { artistCount }),
        ...(albumCount > 0 && { albumCount }),
        ...(photoCount > 0 && { photoCount }),
        libraryCount: librariesWithCounts.length,
        userCount: users.length,
        activeStreams,
        totalBandwidth,
        transcodeSessions,
        directPlaySessions,
      },
      libraries: librariesWithCounts.map(lib => ({
        id: lib.key,
        title: lib.title,
        type: lib.type,
        count: lib.count || 0,
        agent: lib.agent,
        scanner: lib.scanner,
        language: lib.language,
        createdAt: lib.createdAt,
        updatedAt: lib.updatedAt,
      })),
      users: users.map(user => ({
        id: user.id,
        title: user.title,
        username: user.username,
        email: user.email,
        thumb: user.thumb,
        isAdmin: user.id === 1,
        isHome: user.home,
        isRestricted: user.restricted,
      })),
      sessions: sessions.map(session => ({
        sessionKey: session.sessionKey,
        title: session.title,
        type: session.type,
        user: session.User ? {
          id: session.User.id,
          title: session.User.title,
          thumb: session.User.thumb,
        } : null,
        player: session.Player ? {
          title: session.Player.title,
          device: session.Player.device,
          platform: session.Player.platform,
          product: session.Player.product,
          state: session.Player.state,
        } : null,
        progress: session.viewOffset && session.duration 
          ? Math.round((session.viewOffset / session.duration) * 100)
          : 0,
        transcoding: !!session.TranscodeSession,
        bandwidth: session.Media?.[0]?.bitrate || 0,
      })),
      devices: devices.filter(d => d.presence).map(device => ({
        name: device.name,
        product: device.product,
        platform: device.platform,
        clientIdentifier: device.clientIdentifier,
        lastSeenAt: device.lastSeenAt,
      })),
      activities: activities?.MediaContainer?.Activity || [],
      recentlyAdded: recentlyAdded?.MediaContainer?.Metadata?.slice(0, 10).map(item => ({
        title: item.title,
        type: item.type,
        thumb: item.thumb ? `${config.url}${item.thumb}?X-Plex-Token=${config.token}` : null,
        art: item.art ? `${config.url}${item.art}?X-Plex-Token=${config.token}` : null,
        addedAt: item.addedAt,
        year: item.year,
        parentTitle: item.parentTitle,
        grandparentTitle: item.grandparentTitle,
        ratingKey: item.ratingKey,
      })) || [],
      onDeck: onDeck?.MediaContainer?.Metadata?.slice(0, 10).map(item => ({
        title: item.title,
        type: item.type,
        thumb: item.thumb ? `${config.url}${item.thumb}?X-Plex-Token=${config.token}` : null,
        art: item.art ? `${config.url}${item.art}?X-Plex-Token=${config.token}` : null,
        year: item.year,
        parentTitle: item.parentTitle,
        grandparentTitle: item.grandparentTitle,
        ratingKey: item.ratingKey,
        viewOffset: item.viewOffset,
        duration: item.duration,
        progress: item.viewOffset && item.duration ? Math.round((item.viewOffset / item.duration) * 100) : 0,
      })) || [],
    });

    // Disable caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    instanceLogger.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Plex data' },
      { status: 500 }
    );
  }
});