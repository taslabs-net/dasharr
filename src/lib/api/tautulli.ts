// Tautulli API Client
// This client provides access to all Tautulli API endpoints

interface TautulliConfig {
  url: string;
  apiKey: string;
}

export class TautulliAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: TautulliConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async fetch(cmd: string, params?: Record<string, string | number | boolean>) {
    const url = new URL(`${this.baseUrl}/api/v2`);
    url.searchParams.append('apikey', this.apiKey);
    url.searchParams.append('cmd', cmd);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Tautulli API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.response.result !== 'success') {
      throw new Error(`Tautulli API error: ${data.response.message || 'Unknown error'}`);
    }

    return data.response.data;
  }

  // Activity
  async getActivity() {
    return this.fetch('get_activity');
  }

  // History
  async getHistory(length = 25, start = 0) {
    return this.fetch('get_history', { length, start });
  }

  async getHistoryByDate(start_date: string, end_date?: string) {
    return this.fetch('get_history_by_date', { start_date, ...(end_date && { end_date }) });
  }

  // Home Stats
  async getHomeStats(time_range = 30, stats_type = 'plays', stats_count = 5) {
    return this.fetch('get_home_stats', { time_range, stats_type, stats_count });
  }

  // Libraries
  async getLibraries() {
    return this.fetch('get_libraries');
  }

  async getLibrary(section_id: number) {
    return this.fetch('get_library', { section_id });
  }

  async getLibraryMediaInfo(section_id: number) {
    return this.fetch('get_library_media_info', { section_id });
  }

  async getLibraryUserStats(section_id: number) {
    return this.fetch('get_library_user_stats', { section_id });
  }

  async getLibraryWatchTimeStats(section_id: number) {
    return this.fetch('get_library_watch_time_stats', { section_id });
  }

  // Metadata
  async getMetadata(rating_key: number) {
    return this.fetch('get_metadata', { rating_key });
  }

  async getChildrenMetadata(rating_key: number) {
    return this.fetch('get_children_metadata', { rating_key });
  }

  // Recently Added
  async getRecentlyAdded(count = 25, start = 0, section_id?: number) {
    return this.fetch('get_recently_added', { count, start, ...(section_id && { section_id }) });
  }

  // Server Info
  async getServerInfo() {
    return this.fetch('get_server_info');
  }

  async getServerStatus() {
    return this.fetch('get_server_status');
  }

  async getServerIdentity() {
    return this.fetch('get_server_identity');
  }

  async getServerList() {
    return this.fetch('get_server_list');
  }

  async getServerPref(pref: string) {
    return this.fetch('get_server_pref', { pref });
  }

  // Settings
  async getSettings() {
    return this.fetch('get_settings');
  }

  // Synced Items
  async getSyncedItems(machine_id: string) {
    return this.fetch('get_synced_items', { machine_id });
  }

  // Users
  async getUsers() {
    return this.fetch('get_users');
  }

  async getUser(user_id: number) {
    return this.fetch('get_user', { user_id });
  }

  async getUserNames() {
    return this.fetch('get_user_names');
  }

  async getUserPlayerStats(user_id: number) {
    return this.fetch('get_user_player_stats', { user_id });
  }

  async getUserWatchTimeStats(user_id: number) {
    return this.fetch('get_user_watch_time_stats', { user_id });
  }

  // Activity Summary
  async getActivitySummary() {
    return this.fetch('get_activity_summary');
  }

  // Logs
  async getLogs(log_type = 'tautulli', lines = 1000) {
    return this.fetch('get_logs', { log_type, lines });
  }

  // Notification Log
  async getNotificationLog(length = 25, start = 0) {
    return this.fetch('get_notification_log', { length, start });
  }

  // Newsletter Log
  async getNewsletterLog(length = 25, start = 0) {
    return this.fetch('get_newsletter_log', { length, start });
  }

  // Plex Log
  async getPlexLog(window = 100, log_type = 'server') {
    return this.fetch('get_plex_log', { window, log_type });
  }

  // Stream Data
  async getStreamData(session_key: string) {
    return this.fetch('get_stream_data', { session_key });
  }

  async getStreamTypeByTop10Platforms(time_range = 30) {
    return this.fetch('get_stream_type_by_top_10_platforms', { time_range });
  }

  async getStreamTypeByTop10Users(time_range = 30) {
    return this.fetch('get_stream_type_by_top_10_users', { time_range });
  }

  // Plays By
  async getPlaysByDate(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_date', { time_range, y_axis });
  }

  async getPlaysByDayOfWeek(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_dayofweek', { time_range, y_axis });
  }

  async getPlaysByHourOfDay(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_hourofday', { time_range, y_axis });
  }

  async getPlaysBySourceResolution(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_source_resolution', { time_range, y_axis });
  }

  async getPlaysByStreamResolution(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_stream_resolution', { time_range, y_axis });
  }

  async getPlaysByStreamType(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_stream_type', { time_range, y_axis });
  }

  async getPlaysByTop10Platforms(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_top_10_platforms', { time_range, y_axis });
  }

  async getPlaysByTop10Users(time_range = 30, y_axis = 'plays') {
    return this.fetch('get_plays_by_top_10_users', { time_range, y_axis });
  }

  // Plays Per Month
  async getPlaysPerMonth(time_range = 12, y_axis = 'plays') {
    return this.fetch('get_plays_per_month', { time_range, y_axis });
  }

  // Notifiers
  async getNotifiers() {
    return this.fetch('get_notifiers');
  }

  async getNotifierConfig(notifier_id: number) {
    return this.fetch('get_notifier_config', { notifier_id });
  }

  async getNotifierParameters() {
    return this.fetch('get_notifier_parameters');
  }

  // Newsletter Config
  async getNewsletterConfig(newsletter_id: number) {
    return this.fetch('get_newsletter_config', { newsletter_id });
  }

  async getNewsletters() {
    return this.fetch('get_newsletters');
  }

  // Plex URL
  async getPlexUrl(machine_id: string) {
    return this.fetch('get_plex_url', { machine_id });
  }

  // API Key
  async getApikey() {
    return this.fetch('get_apikey');
  }

  // Device
  async getDevice(device_id: string) {
    return this.fetch('get_device', { device_id });
  }

  async getDevices() {
    return this.fetch('get_devices');
  }

  // Date Formats
  async getDateFormats() {
    return this.fetch('get_date_formats');
  }

  // Server Friendly Name
  async getServerFriendlyName() {
    return this.fetch('get_server_friendly_name');
  }

  // Server ID
  async getServerID(hostname: string, port: number) {
    return this.fetch('get_server_id', { hostname, port });
  }

  // Pms Update
  async getPmsUpdate() {
    return this.fetch('get_pms_update');
  }

  // Pms Image Proxy
  pmsImageProxy(img: string, rating_key?: number, width?: number, height?: number) {
    const params: Record<string, string | number> = { img };
    if (rating_key) params.rating_key = rating_key;
    if (width) params.width = width;
    if (height) params.height = height;
    return `${this.baseUrl}/api/v2?apikey=${this.apiKey}&cmd=pms_image_proxy&${new URLSearchParams(params as Record<string, string>).toString()}`;
  }

  // Tautulli Info
  async getTautulliInfo() {
    return this.fetch('get_tautulli_info');
  }

  async getTautulliVersion() {
    return this.fetch('get_tautulli_version');
  }

  async getTautulliUpdateCheck() {
    return this.fetch('get_tautulli_update_check');
  }
}

// Export a singleton instance if config is available
export function createTautulliClient(config: TautulliConfig): TautulliAPI {
  return new TautulliAPI(config);
}