interface QBittorrentConfig {
  url: string;
  username: string;
  password: string;
}

interface QBittorrentTorrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  priority: number;
  num_seeds: number;
  num_leechs: number;
  ratio: number;
  eta: number;
  state: string;
  seq_dl: boolean;
  f_l_piece_prio: boolean;
  category: string;
  tags: string;
  super_seeding: boolean;
  force_start: boolean;
  save_path: string;
  added_on: number;
  completion_on: number;
  tracker: string;
  dl_limit: number;
  up_limit: number;
  downloaded: number;
  uploaded: number;
  downloaded_session: number;
  uploaded_session: number;
  amount_left: number;
  completed: number;
  ratio_limit: number;
  seen_complete: number;
  last_activity: number;
  time_active: number;
  auto_tmm: boolean;
  total_size: number;
  max_ratio: number;
  max_seeding_time: number;
  seeding_time_limit: number;
}

interface QBittorrentMainData {
  rid: number;
  full_update: boolean;
  torrents: { [hash: string]: QBittorrentTorrent };
  torrents_removed: string[];
  categories: { [name: string]: { name: string; savePath: string } };
  categories_removed: string[];
  tags: string[];
  tags_removed: string[];
  server_state: {
    alltime_dl: number;
    alltime_ul: number;
    average_time_queue: number;
    connection_status: string;
    dht_nodes: number;
    dl_info_data: number;
    dl_info_speed: number;
    dl_rate_limit: number;
    free_space_on_disk: number;
    global_ratio: string;
    queued_io_jobs: number;
    queueing: boolean;
    read_cache_hits: string;
    read_cache_overload: string;
    refresh_interval: number;
    total_buffers_size: number;
    total_peer_connections: number;
    total_queued_size: number;
    total_wasted_session: number;
    up_info_data: number;
    up_info_speed: number;
    up_rate_limit: number;
    use_alt_speed_limits: boolean;
    write_cache_overload: string;
  };
}

interface QBittorrentPreferences {
  locale: string;
  create_subfolder_enabled: boolean;
  start_paused_enabled: boolean;
  auto_delete_mode: number;
  preallocate_all: boolean;
  incomplete_files_ext: boolean;
  auto_tmm_enabled: boolean;
  torrent_changed_tmm_enabled: boolean;
  save_path_changed_tmm_enabled: boolean;
  category_changed_tmm_enabled: boolean;
  save_path: string;
  temp_path_enabled: boolean;
  temp_path: string;
  scan_dirs: { [path: string]: number };
  export_dir: string;
  export_dir_fin: string;
  mail_notification_enabled: boolean;
  mail_notification_sender: string;
  mail_notification_email: string;
  mail_notification_smtp: string;
  mail_notification_ssl_enabled: boolean;
  mail_notification_auth_enabled: boolean;
  mail_notification_username: string;
  mail_notification_password: string;
  autorun_enabled: boolean;
  autorun_program: string;
  queueing_enabled: boolean;
  max_active_downloads: number;
  max_active_torrents: number;
  max_active_uploads: number;
  dont_count_slow_torrents: boolean;
  slow_torrent_dl_rate_threshold: number;
  slow_torrent_ul_rate_threshold: number;
  slow_torrent_inactive_timer: number;
  max_ratio_enabled: boolean;
  max_ratio: number;
  max_ratio_act: number;
  listen_port: number;
  upnp: boolean;
  random_port: boolean;
  dl_limit: number;
  up_limit: number;
  max_connec: number;
  max_connec_per_torrent: number;
  max_uploads: number;
  max_uploads_per_torrent: number;
  enable_utp: boolean;
  limit_utp_rate: boolean;
  limit_tcp_overhead: boolean;
  limit_lan_peers: boolean;
  alt_dl_limit: number;
  alt_up_limit: number;
  scheduler_enabled: boolean;
  schedule_from_hour: number;
  schedule_from_min: number;
  schedule_to_hour: number;
  schedule_to_min: number;
  scheduler_days: number;
  dht: boolean;
  pex: boolean;
  lsd: boolean;
  encryption: number;
  anonymous_mode: boolean;
  proxy_type: number;
  proxy_ip: string;
  proxy_port: number;
  proxy_peer_connections: boolean;
  proxy_auth_enabled: boolean;
  proxy_username: string;
  proxy_password: string;
  proxy_torrents_only: boolean;
  ip_filter_enabled: boolean;
  ip_filter_path: string;
  ip_filter_trackers: boolean;
  web_ui_domain_list: string;
  web_ui_address: string;
  web_ui_port: number;
  web_ui_upnp: boolean;
  web_ui_username: string;
  web_ui_password: string;
  web_ui_csrf_protection_enabled: boolean;
  web_ui_clickjacking_protection_enabled: boolean;
  web_ui_secure_cookie_enabled: boolean;
  web_ui_max_auth_fail_count: number;
  web_ui_ban_duration: number;
  web_ui_session_timeout: number;
  web_ui_host_header_validation_enabled: boolean;
  bypass_local_auth: boolean;
  bypass_auth_subnet_whitelist_enabled: boolean;
  bypass_auth_subnet_whitelist: string;
  alternative_webui_enabled: boolean;
  alternative_webui_path: string;
  use_https: boolean;
  web_ui_https_cert_path: string;
  web_ui_https_key_path: string;
  dyndns_enabled: boolean;
  dyndns_service: number;
  dyndns_username: string;
  dyndns_password: string;
  dyndns_domain: string;
  rss_refresh_interval: number;
  rss_max_articles_per_feed: number;
  rss_processing_enabled: boolean;
  rss_auto_downloading_enabled: boolean;
  rss_download_repack_proper_episodes: boolean;
  rss_smart_episode_filters: string;
  add_trackers_enabled: boolean;
  add_trackers: string;
  web_ui_use_custom_http_headers_enabled: boolean;
  web_ui_custom_http_headers: string;
  max_seeding_time_enabled: boolean;
  max_seeding_time: number;
  announce_ip: string;
  announce_to_all_tiers: boolean;
  announce_to_all_trackers: boolean;
  async_io_threads: number;
  banned_IPs: string;
  checking_memory_use: number;
  current_interface_address: string;
  current_network_interface: string;
  disk_cache: number;
  disk_cache_ttl: number;
  embedded_tracker_port: number;
  enable_coalesce_read_write: boolean;
  enable_embedded_tracker: boolean;
  enable_multi_connections_from_same_ip: boolean;
  enable_os_cache: boolean;
  enable_upload_suggestions: boolean;
  file_pool_size: number;
  outgoing_ports_max: number;
  outgoing_ports_min: number;
  recheck_completed_torrents: boolean;
  resolve_peer_countries: boolean;
  save_resume_data_interval: number;
  send_buffer_low_watermark: number;
  send_buffer_watermark: number;
  send_buffer_watermark_factor: number;
  socket_backlog_size: number;
  upload_choking_algorithm: number;
  upload_slots_behavior: number;
  upnp_lease_duration: number;
  utp_tcp_mixed_mode: number;
}

export class QBittorrentAPI {
  private baseUrl: string;
  private username: string;
  private password: string;
  private sid?: string;

  constructor(config: QBittorrentConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.username = config.username;
    this.password = config.password;
  }

  private async login(): Promise<void> {
    const url = `${this.baseUrl}/api/v2/auth/login`;
    const formData = new URLSearchParams();
    formData.append('username', this.username);
    formData.append('password', this.password);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`qBittorrent login failed: ${response.status}`);
    }

    // Check response is OK
    await response.text();
    
    // Extract SID cookie from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const sidMatch = setCookie.match(/SID=([^;]+)/);
      if (sidMatch) {
        this.sid = sidMatch[1];
      }
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, returnText = false): Promise<T> {
    if (!this.sid) {
      await this.login();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.sid) {
      headers['Cookie'] = `SID=${this.sid}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 403) {
      // Session expired, try to re-login
      await this.login();
      if (this.sid) {
        headers['Cookie'] = `SID=${this.sid}`;
      }
      const retryResponse = await fetch(url, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        throw new Error(`qBittorrent API error: ${retryResponse.status}`);
      }
      return returnText ? retryResponse.text() as unknown as T : retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`qBittorrent API error: ${response.status}`);
    }

    return returnText ? response.text() as unknown as T : response.json();
  }

  // Application
  async getVersion(): Promise<string> {
    return this.makeRequest('/api/v2/app/version', {}, true);
  }

  async getAPIVersion(): Promise<string> {
    return this.makeRequest('/api/v2/app/webapiVersion');
  }

  async getBuildInfo(): Promise<{ qt: string; libtorrent: string; boost: string; openssl: string; bitness: number }> {
    return this.makeRequest('/api/v2/app/buildInfo');
  }

  async shutdown(): Promise<void> {
    await this.makeRequest('/api/v2/app/shutdown', { method: 'POST' });
  }

  async getPreferences(): Promise<QBittorrentPreferences> {
    return this.makeRequest('/api/v2/app/preferences');
  }

  async setPreferences(prefs: Partial<QBittorrentPreferences>): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('json', JSON.stringify(prefs));
    
    await this.makeRequest('/api/v2/app/setPreferences', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // Sync
  async getMainData(rid = 0): Promise<QBittorrentMainData> {
    return this.makeRequest(`/api/v2/sync/maindata?rid=${rid}`);
  }

  async getTorrentPeers(hash: string, rid = 0): Promise<unknown> {
    return this.makeRequest(`/api/v2/sync/torrentPeers?hash=${hash}&rid=${rid}`);
  }

  // Torrents
  async getTorrents(filter?: string, category?: string, tag?: string, sort?: string, reverse?: boolean, limit?: number, offset?: number): Promise<QBittorrentTorrent[]> {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    if (sort) params.append('sort', sort);
    if (reverse !== undefined) params.append('reverse', reverse.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());

    return this.makeRequest(`/api/v2/torrents/info?${params.toString()}`);
  }

  async getTorrentProperties(hash: string): Promise<unknown> {
    return this.makeRequest(`/api/v2/torrents/properties?hash=${hash}`);
  }

  async getTorrentTrackers(hash: string): Promise<unknown[]> {
    return this.makeRequest(`/api/v2/torrents/trackers?hash=${hash}`);
  }

  async getTorrentWebSeeds(hash: string): Promise<unknown[]> {
    return this.makeRequest(`/api/v2/torrents/webseeds?hash=${hash}`);
  }

  async getTorrentFiles(hash: string): Promise<unknown[]> {
    return this.makeRequest(`/api/v2/torrents/files?hash=${hash}`);
  }

  async getTorrentPieceStates(hash: string): Promise<number[]> {
    return this.makeRequest(`/api/v2/torrents/pieceStates?hash=${hash}`);
  }

  async getTorrentPieceHashes(hash: string): Promise<string[]> {
    return this.makeRequest(`/api/v2/torrents/pieceHashes?hash=${hash}`);
  }

  async pauseTorrents(hashes: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('hashes', Array.isArray(hashes) ? hashes.join('|') : hashes);
    
    await this.makeRequest('/api/v2/torrents/pause', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async resumeTorrents(hashes: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('hashes', Array.isArray(hashes) ? hashes.join('|') : hashes);
    
    await this.makeRequest('/api/v2/torrents/resume', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async deleteTorrents(hashes: string | string[], deleteFiles = false): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('hashes', Array.isArray(hashes) ? hashes.join('|') : hashes);
    formData.append('deleteFiles', deleteFiles.toString());
    
    await this.makeRequest('/api/v2/torrents/delete', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async recheckTorrents(hashes: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('hashes', Array.isArray(hashes) ? hashes.join('|') : hashes);
    
    await this.makeRequest('/api/v2/torrents/recheck', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async reannounceTorrents(hashes: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('hashes', Array.isArray(hashes) ? hashes.join('|') : hashes);
    
    await this.makeRequest('/api/v2/torrents/reannounce', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // Categories
  async getCategories(): Promise<{ [name: string]: { name: string; savePath: string } }> {
    return this.makeRequest('/api/v2/torrents/categories');
  }

  async createCategory(name: string, savePath?: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('category', name);
    if (savePath) formData.append('savePath', savePath);
    
    await this.makeRequest('/api/v2/torrents/createCategory', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async editCategory(name: string, savePath: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('category', name);
    formData.append('savePath', savePath);
    
    await this.makeRequest('/api/v2/torrents/editCategory', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async removeCategories(categories: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('categories', Array.isArray(categories) ? categories.join('\n') : categories);
    
    await this.makeRequest('/api/v2/torrents/removeCategories', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // Tags
  async getTags(): Promise<string[]> {
    return this.makeRequest('/api/v2/torrents/tags');
  }

  async createTags(tags: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    
    await this.makeRequest('/api/v2/torrents/createTags', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async deleteTags(tags: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
    
    await this.makeRequest('/api/v2/torrents/deleteTags', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // Transfer info
  async getGlobalTransferInfo(): Promise<{
    dht_nodes: number;
    connection_status: string;
    dl_info_data: number;
    dl_info_speed: number;
    up_info_data: number;
    up_info_speed: number;
  }> {
    return this.makeRequest('/api/v2/transfer/info');
  }

  async getSpeedLimitsMode(): Promise<1 | 0> {
    return this.makeRequest('/api/v2/transfer/speedLimitsMode');
  }

  async toggleSpeedLimitsMode(): Promise<void> {
    await this.makeRequest('/api/v2/transfer/toggleSpeedLimitsMode', { method: 'POST' });
  }

  async getGlobalDownloadLimit(): Promise<number> {
    return this.makeRequest('/api/v2/transfer/downloadLimit');
  }

  async setGlobalDownloadLimit(limit: number): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('limit', limit.toString());
    
    await this.makeRequest('/api/v2/transfer/setDownloadLimit', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async getGlobalUploadLimit(): Promise<number> {
    return this.makeRequest('/api/v2/transfer/uploadLimit');
  }

  async setGlobalUploadLimit(limit: number): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('limit', limit.toString());
    
    await this.makeRequest('/api/v2/transfer/setUploadLimit', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async banPeers(peers: string | string[]): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('peers', Array.isArray(peers) ? peers.join('|') : peers);
    
    await this.makeRequest('/api/v2/transfer/banPeers', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }
}

export function createQBittorrentClient(config: QBittorrentConfig): QBittorrentAPI {
  return new QBittorrentAPI(config);
}