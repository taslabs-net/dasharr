interface ProwlarrConfig {
  url: string;
  apiKey: string;
}

interface ProwlarrIndexer {
  id: number;
  name: string;
  implementation: string;
  protocol: 'torrent' | 'usenet';
  enable: boolean;
  supportsSearch: boolean;
  supportsRedirect: boolean;
  priority: number;
  added: string;
  status: {
    isHealthy: boolean;
    hasError: boolean;
    errorMessage?: string;
  };
  configContract: string;
  implementation_name: string;
  infoLink: string;
  tags: number[];
}

interface ProwlarrIndexerStatus {
  indexerId: number;
  indexerName: string;
  status: 'healthy' | 'error' | 'warning';
  lastCheck: string;
  errorMessage?: string;
  responseTime?: number;
}

interface ProwlarrStats {
  totalIndexers: number;
  enabledIndexers: number;
  healthyIndexers: number;
  torrentIndexers: number;
  usenetIndexers: number;
  searchesTotal: number;
  searchesToday: number;
  grabsTotal: number;
  grabsToday: number;
}

interface ProwlarrSystemStatus {
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isMonoRuntime: boolean;
  isMono: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  mode: string;
  branch: string;
  authentication: string;
  sqliteVersion: string;
  migrationVersion: number;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
}

interface ProwlarrHealth {
  source: string;
  type: 'ok' | 'notice' | 'warning' | 'error';
  message: string;
  wikiUrl?: string;
}

interface ProwlarrSearch {
  guid: string;
  age: number;
  title: string;
  size: number;
  indexer: string;
  indexerId: number;
  infoUrl?: string;
  downloadUrl?: string;
  categories: number[];
  seeders?: number;
  leechers?: number;
  language: string;
  protocol: 'torrent' | 'usenet';
}

export class ProwlarrAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ProwlarrConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Prowlarr API error: ${response.status}`);
    }
    
    return response.json();
  }

  // System Information
  async getSystemStatus(): Promise<ProwlarrSystemStatus> {
    return this.makeRequest('/system/status');
  }

  async getHealth(): Promise<ProwlarrHealth[]> {
    return this.makeRequest('/health');
  }

  // Indexers
  async getIndexers(): Promise<ProwlarrIndexer[]> {
    return this.makeRequest('/indexer');
  }

  async getIndexer(id: number): Promise<ProwlarrIndexer> {
    return this.makeRequest(`/indexer/${id}`);
  }

  async getIndexerStatus(): Promise<ProwlarrIndexerStatus[]> {
    return this.makeRequest('/indexerstatus');
  }

  async testIndexer(id: number): Promise<{ isValid: boolean; errors: Array<{ message: string }> }> {
    return this.makeRequest(`/indexer/test/${id}`, {
      method: 'POST',
    });
  }

  async enableIndexer(id: number): Promise<ProwlarrIndexer> {
    return this.makeRequest(`/indexer/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enable: true }),
    });
  }

  async disableIndexer(id: number): Promise<ProwlarrIndexer> {
    return this.makeRequest(`/indexer/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enable: false }),
    });
  }

  // Search
  async search(query: string, categories?: number[], indexerIds?: number[]): Promise<ProwlarrSearch[]> {
    const params = new URLSearchParams({ query });
    
    if (categories?.length) {
      categories.forEach(cat => params.append('categories', cat.toString()));
    }
    
    if (indexerIds?.length) {
      indexerIds.forEach(id => params.append('indexerIds', id.toString()));
    }

    return this.makeRequest(`/search?${params.toString()}`);
  }

  async searchMovie(query: string, year?: number, imdbId?: string): Promise<ProwlarrSearch[]> {
    const params = new URLSearchParams({ query, type: 'movie' });
    
    if (year) params.set('year', year.toString());
    if (imdbId) params.set('imdbId', imdbId);

    return this.makeRequest(`/search?${params.toString()}`);
  }

  async searchTv(query: string, season?: number, episode?: number, tvdbId?: string): Promise<ProwlarrSearch[]> {
    const params = new URLSearchParams({ query, type: 'tv' });
    
    if (season) params.set('season', season.toString());
    if (episode) params.set('episode', episode.toString());
    if (tvdbId) params.set('tvdbId', tvdbId);

    return this.makeRequest(`/search?${params.toString()}`);
  }

  // Statistics
  async getIndexerStats(): Promise<{ indexer: { id: number; name: string; numberGrabs: number; numberQueries: number; avgResponseTime: number }[] }> {
    return this.makeRequest('/indexerstats');
  }

  async getApplications(): Promise<Array<{
    id: number;
    name: string;
    implementation: string;
    configContract: string;
    infoLink: string;
    tags: number[];
  }>> {
    return this.makeRequest('/applications');
  }

  // Tags
  async getTags(): Promise<Array<{ id: number; label: string }>> {
    return this.makeRequest('/tag');
  }

  async createTag(label: string): Promise<{ id: number; label: string }> {
    return this.makeRequest('/tag', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  }

  // History
  async getHistory(page = 1, pageSize = 20, sortKey = 'date', sortDirection = 'descending'): Promise<{
    page: number;
    pageSize: number;
    sortKey: string;
    sortDirection: string;
    totalRecords: number;
    records: Array<{
      id: number;
      indexerId: number;
      indexerName: string;
      query: string;
      grabId: string;
      date: string;
      successful: boolean;
      source: string;
      host: string;
      grabMethod: string;
      grabClient: string;
      redirectUrl: string;
    }>;
  }> {
    return this.makeRequest(`/history?page=${page}&pageSize=${pageSize}&sortKey=${sortKey}&sortDirection=${sortDirection}`);
  }

  // Download Clients
  async getDownloadClients(): Promise<Array<{
    id: number;
    name: string;
    implementation: string;
    enable: boolean;
    priority: number;
    protocol: 'torrent' | 'usenet';
  }>> {
    return this.makeRequest('/downloadclient');
  }

  // Notifications
  async getNotifications(): Promise<Array<{
    id: number;
    name: string;
    implementation: string;
    configContract: string;
    infoLink: string;
    tags: number[];
    onGrab: boolean;
    onHealthIssue: boolean;
    onApplicationUpdate: boolean;
    includeHealthWarnings: boolean;
  }>> {
    return this.makeRequest('/notification');
  }

  // Custom Formats
  async getCustomFormats(): Promise<Array<{
    id: number;
    name: string;
    includeCustomFormatWhenRenaming: boolean;
    specifications: Array<{
      name: string;
      implementation: string;
      negate: boolean;
      required: boolean;
    }>;
  }>> {
    return this.makeRequest('/customformat');
  }

  // Configuration
  async getConfig(): Promise<{
    logLevel: string;
    enableSsl: boolean;
    port: number;
    sslPort: number;
    urlBase: string;
    instanceName: string;
    applicationUrl: string;
    enableAuthentication: boolean;
    authenticationMethod: string;
  }> {
    return this.makeRequest('/config/host');
  }

  // Helper method to get comprehensive stats
  async getStats(): Promise<ProwlarrStats> {
    const [indexers, indexerStats] = await Promise.allSettled([
      this.getIndexers(),
      this.getIndexerStats().catch(() => ({ indexer: [] })),
    ]);

    const indexersData = indexers.status === 'fulfilled' ? indexers.value : [];
    const statsData = indexerStats.status === 'fulfilled' ? indexerStats.value : { indexer: [] };
    // const historyData = history.status === 'fulfilled' ? history.value : { totalRecords: 0, records: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let searchesToday = 0;
    let grabsToday = 0;

    // Count today's activity from indexer stats
    statsData.indexer.forEach(stat => {
      searchesToday += stat.numberQueries || 0;
      grabsToday += stat.numberGrabs || 0;
    });

    return {
      totalIndexers: indexersData.length,
      enabledIndexers: indexersData.filter(i => i.enable).length,
      healthyIndexers: indexersData.filter(i => i.status?.isHealthy).length,
      torrentIndexers: indexersData.filter(i => i.protocol === 'torrent').length,
      usenetIndexers: indexersData.filter(i => i.protocol === 'usenet').length,
      searchesTotal: statsData.indexer.reduce((sum, stat) => sum + (stat.numberQueries || 0), 0),
      searchesToday,
      grabsTotal: statsData.indexer.reduce((sum, stat) => sum + (stat.numberGrabs || 0), 0),
      grabsToday,
    };
  }
}