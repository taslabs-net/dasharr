// Bazarr API Client
// This client provides access to all Bazarr API endpoints for subtitle management

interface BazarrConfig {
  url: string;
  apiKey: string;
}

export class BazarrAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: BazarrConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Bazarr API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // System Status and Information
  async getSystemStatus() {
    return this.fetch('/system/status');
  }

  async getSystemHealth() {
    return this.fetch('/system/health');
  }

  async getSystemLogs() {
    return this.fetch('/system/logs');
  }

  async getSystemReleases() {
    return this.fetch('/system/releases');
  }

  async getSystemTasks() {
    return this.fetch('/system/tasks');
  }

  async getSystemAnnouncements() {
    return this.fetch('/system/announcements');
  }

  async getSystemBackups() {
    return this.fetch('/system/backups');
  }

  async getSystemLanguages() {
    return this.fetch('/system/languages');
  }

  async getSystemLanguageProfiles() {
    return this.fetch('/system/languages/profiles');
  }

  async getSystemSearches() {
    return this.fetch('/system/searches');
  }

  // System ping for health check
  async ping() {
    return this.fetch('/system/ping');
  }

  // Statistics and History
  async getHistoryStats(timeframe: 'week' | 'month' | 'trimester' | 'year' = 'week') {
    return this.fetch(`/history/stats?timeframe=${timeframe}`);
  }

  async getHistory(start = 0, length = 100) {
    return this.fetch(`/history?start=${start}&length=${length}`);
  }

  // Badge counts for UI
  async getBadges() {
    return this.fetch('/badges');
  }

  // Episodes management
  async getEpisodes(seriesIds?: number[], episodeIds?: number[]) {
    const params = new URLSearchParams();
    if (seriesIds?.length) {
      seriesIds.forEach(id => params.append('seriesid[]', id.toString()));
    }
    if (episodeIds?.length) {
      episodeIds.forEach(id => params.append('episodeid[]', id.toString()));
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/episodes${queryString}`);
  }

  async getEpisodesBlacklist(start = 0, length = 100) {
    return this.fetch(`/episodes/blacklist?start=${start}&length=${length}`);
  }

  async getEpisodesHistory(start = 0, length = 100) {
    return this.fetch(`/episodes/history?start=${start}&length=${length}`);
  }

  async getEpisodesWanted(start = 0, length = 100) {
    return this.fetch(`/episodes/wanted?start=${start}&length=${length}`);
  }

  // Movies management
  async getMovies(radarrIds?: number[], movieIds?: number[]) {
    const params = new URLSearchParams();
    if (radarrIds?.length) {
      radarrIds.forEach(id => params.append('radarrid[]', id.toString()));
    }
    if (movieIds?.length) {
      movieIds.forEach(id => params.append('movieid[]', id.toString()));
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/movies${queryString}`);
  }

  async getMoviesBlacklist(start = 0, length = 100) {
    return this.fetch(`/movies/blacklist?start=${start}&length=${length}`);
  }

  async getMoviesHistory(start = 0, length = 100) {
    return this.fetch(`/movies/history?start=${start}&length=${length}`);
  }

  async getMoviesWanted(start = 0, length = 100) {
    return this.fetch(`/movies/wanted?start=${start}&length=${length}`);
  }

  // Providers
  async getProviders() {
    return this.fetch('/providers');
  }

  async getProvidersMovies() {
    return this.fetch('/providers/movies');
  }

  async getProvidersEpisodes() {
    return this.fetch('/providers/episodes');
  }

  async getProvidersStatus() {
    return this.fetch('/providers/status');
  }

  // Series management
  async getSeries(seriesIds?: number[]) {
    if (seriesIds?.length) {
      const params = seriesIds.map(id => `seriesid[]=${id}`).join('&');
      return this.fetch(`/series?${params}`);
    }
    return this.fetch('/series');
  }

  async getSeriesEpisodes(seriesId: number) {
    return this.fetch(`/series/episodes?seriesid=${seriesId}`);
  }

  // WebHooks
  async getWebhooks() {
    return this.fetch('/webhooks');
  }

  // File system access
  async getBazarrFileSystem(path?: string) {
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.fetch(`/files${params}`);
  }

  async getRadarrFileSystem(path?: string) {
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.fetch(`/files/radarr${params}`);
  }

  async getSonarrFileSystem(path?: string) {
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.fetch(`/files/sonarr${params}`);
  }

  // Subtitles search and download
  async searchEpisodeSubtitles(episodeId: number, language?: string) {
    const params = language ? `?language=${language}` : '';
    return this.fetch(`/episodes/subtitles?episodeid=${episodeId}${params}`);
  }

  async searchMovieSubtitles(movieId: number, language?: string) {
    const params = language ? `?language=${language}` : '';
    return this.fetch(`/movies/subtitles?movieid=${movieId}${params}`);
  }

  // Configuration
  async getSettings() {
    return this.fetch('/settings');
  }

  // Mass actions
  async getWantedSearch() {
    return this.fetch('/wanted/search');
  }

  async getWantedSearchEpisodes() {
    return this.fetch('/wanted/search/episodes');
  }

  async getWantedSearchMovies() {
    return this.fetch('/wanted/search/movies');
  }
}

// Export a singleton instance if config is available
export function createBazarrClient(config: BazarrConfig): BazarrAPI {
  return new BazarrAPI(config);
}
