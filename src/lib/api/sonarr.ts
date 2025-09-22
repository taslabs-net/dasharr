// Sonarr API Client
// This client provides access to all Sonarr API endpoints

interface SonarrConfig {
  url: string;
  apiKey: string;
}

export class SonarrAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: SonarrConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}/api/v3${endpoint}`, {
      ...options,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Sonarr API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // System & Health
  async getSystemStatus() {
    return this.fetch('/system/status');
  }

  async getHealth() {
    return this.fetch('/health');
  }

  async getDiskSpace() {
    return this.fetch('/diskspace');
  }

  // Series
  async getSeries() {
    return this.fetch('/series');
  }

  async getSeriesById(id: number) {
    return this.fetch(`/series/${id}`);
  }

  async getSeriesLookup(term: string) {
    return this.fetch(`/series/lookup?term=${encodeURIComponent(term)}`);
  }

  // Episodes
  async getEpisodes(seriesId?: number) {
    const params = seriesId ? `?seriesId=${seriesId}` : '';
    return this.fetch(`/episode${params}`);
  }

  async getEpisodeById(id: number) {
    return this.fetch(`/episode/${id}`);
  }

  // Calendar
  async getCalendar(start?: Date, end?: Date, includeSeries = true) {
    const params = new URLSearchParams();
    if (start) params.append('start', start.toISOString());
    if (end) params.append('end', end.toISOString());
    if (includeSeries) params.append('includeSeries', 'true');
    return this.fetch(`/calendar?${params.toString()}`);
  }

  // Queue
  async getQueue(includeUnknownSeriesItems = false) {
    return this.fetch(`/queue?includeUnknownSeriesItems=${includeUnknownSeriesItems}`);
  }

  async getQueueDetails() {
    return this.fetch('/queue/details');
  }

  async getQueueStatus() {
    return this.fetch('/queue/status');
  }

  // History
  async getHistory(pageSize = 20, page = 1) {
    return this.fetch(`/history?pageSize=${pageSize}&page=${page}`);
  }

  async getHistorySince(date: Date) {
    return this.fetch(`/history/since?date=${date.toISOString()}`);
  }

  async getHistorySeries(seriesId: number) {
    return this.fetch(`/history/series?seriesId=${seriesId}`);
  }

  // Wanted/Missing
  async getWantedMissing(pageSize = 20, page = 1) {
    return this.fetch(`/wanted/missing?pageSize=${pageSize}&page=${page}`);
  }

  async getWantedCutoff(pageSize = 20, page = 1) {
    return this.fetch(`/wanted/cutoff?pageSize=${pageSize}&page=${page}`);
  }

  // Commands
  async getCommands() {
    return this.fetch('/command');
  }

  async getCommand(id: number) {
    return this.fetch(`/command/${id}`);
  }

  // Indexer
  async getIndexers() {
    return this.fetch('/indexer');
  }

  // Download Clients
  async getDownloadClients() {
    return this.fetch('/downloadclient');
  }

  // Quality Profiles
  async getQualityProfiles() {
    return this.fetch('/qualityprofile');
  }

  async getQualityDefinitions() {
    return this.fetch('/qualitydefinition');
  }

  // Tags
  async getTags() {
    return this.fetch('/tag');
  }

  // Root Folders
  async getRootFolders() {
    return this.fetch('/rootfolder');
  }

  // Logs
  async getLogFiles() {
    return this.fetch('/log/file');
  }

  async getUpdates() {
    return this.fetch('/update');
  }

  // Backups
  async getBackups() {
    return this.fetch('/system/backup');
  }

  // Tasks
  async getTasks() {
    return this.fetch('/system/task');
  }

  // UI Config
  async getUIConfig() {
    return this.fetch('/config/ui');
  }

  // Notifications
  async getNotifications() {
    return this.fetch('/notification');
  }

  // Metadata
  async getMetadata() {
    return this.fetch('/metadata');
  }

  // Custom Filters
  async getCustomFilters() {
    return this.fetch('/customfilter');
  }

  // Import Lists
  async getImportLists() {
    return this.fetch('/importlist');
  }

  // Blocklist
  async getBlocklist(pageSize = 20, page = 1) {
    return this.fetch(`/blocklist?pageSize=${pageSize}&page=${page}`);
  }

  // Release
  async getReleases(episodeId: number) {
    return this.fetch(`/release?episodeId=${episodeId}`);
  }

  // Rename
  async getRenamePreviews(seriesId: number) {
    return this.fetch(`/rename?seriesId=${seriesId}`);
  }

  // Manual Import
  async getManualImport(path: string) {
    return this.fetch(`/manualimport?path=${encodeURIComponent(path)}`);
  }

  // File System
  async getFileSystem(path?: string) {
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.fetch(`/filesystem${params}`);
  }

  // Remote Path Mappings
  async getRemotePathMappings() {
    return this.fetch('/remotepathmapping');
  }

  // MediaManagement Config
  async getMediaManagementConfig() {
    return this.fetch('/config/mediamanagement');
  }

  // Naming Config
  async getNamingConfig() {
    return this.fetch('/config/naming');
  }

  // Host Config
  async getHostConfig() {
    return this.fetch('/config/host');
  }

  // Language Profiles
  async getLanguageProfiles() {
    return this.fetch('/languageprofile');
  }

  // Delay Profiles
  async getDelayProfiles() {
    return this.fetch('/delayprofile');
  }

  // Episode Files
  async getEpisodeFiles(seriesId?: number) {
    const params = seriesId ? `?seriesId=${seriesId}` : '';
    return this.fetch(`/episodefile${params}`);
  }

  async getEpisodeFile(id: number) {
    return this.fetch(`/episodefile/${id}`);
  }

  // Parse
  async getParse(title: string) {
    return this.fetch(`/parse?title=${encodeURIComponent(title)}`);
  }
}

// Export a singleton instance if config is available
export function createSonarrClient(config: SonarrConfig): SonarrAPI {
  return new SonarrAPI(config);
}