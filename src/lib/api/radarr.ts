// Radarr API Client
// This client provides access to all Radarr API endpoints

interface RadarrConfig {
  url: string;
  apiKey: string;
}

export class RadarrAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: RadarrConfig) {
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
      throw new Error(`Radarr API error: ${response.status} ${response.statusText}`);
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

  // Movies
  async getMovies() {
    return this.fetch('/movie');
  }

  async getMovie(id: number) {
    return this.fetch(`/movie/${id}`);
  }

  async getMovieLookup(term: string) {
    return this.fetch(`/movie/lookup?term=${encodeURIComponent(term)}`);
  }

  // Calendar
  async getCalendar(start?: Date, end?: Date) {
    const params = new URLSearchParams();
    if (start) params.append('start', start.toISOString());
    if (end) params.append('end', end.toISOString());
    return this.fetch(`/calendar?${params.toString()}`);
  }

  // Queue
  async getQueue(includeUnknownMovieItems = false) {
    return this.fetch(`/queue?includeUnknownMovieItems=${includeUnknownMovieItems}`);
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

  async getHistoryMovie(movieId: number) {
    return this.fetch(`/history/movie?movieId=${movieId}`);
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
  async getReleases(movieId: number) {
    return this.fetch(`/release?movieId=${movieId}`);
  }

  // Rename
  async getRenamePreviews(movieId: number) {
    return this.fetch(`/rename?movieId=${movieId}`);
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

  // Extra Files
  async getExtraFiles() {
    return this.fetch('/extrafile');
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

  // Delay Profiles
  async getDelayProfiles() {
    return this.fetch('/delayprofile');
  }

  // Collection
  async getCollections() {
    return this.fetch('/collection');
  }

  async getCollection(id: number) {
    return this.fetch(`/collection/${id}`);
  }

  // Credits
  async getCredits(movieId: number) {
    return this.fetch(`/credit?movieId=${movieId}`);
  }
}

// Export a singleton instance if config is available
export function createRadarrClient(config: RadarrConfig): RadarrAPI {
  return new RadarrAPI(config);
}