import { logger } from '../logger';

interface JellyseerrConfig {
  url: string;
  apiKey: string;
}

interface JellyseerrStatus {
  version: string;
  commitTag?: string;
  updateAvailable?: boolean;
  commitsBehind?: number;
}

interface JellyseerrSettings {
  main?: {
    applicationTitle?: string;
    applicationUrl?: string;
    initialized?: boolean;
  };
}

interface JellyseerrRequestCount {
  total: number;
  movie: number;
  tv: number;
  pending: number;
  approved: number;
  declined: number;
  processing: number;
  available: number;
}

interface JellyseerrIssueCount {
  total: number;
  open: number;
  resolved: number;
}

interface JellyseerrMediaItem {
  id: number;
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  status: number;
  mediaType: 'movie' | 'tv';
  createdAt: string;
  updatedAt: string;
  lastSeasonChange?: string;
  mediaAddedAt?: string;
  serviceId?: number;
  serviceId4k?: number;
  externalServiceId?: string;
  externalServiceId4k?: string;
  externalServiceSlug?: string;
  externalServiceSlug4k?: string;
  ratingKey?: string;
  ratingKey4k?: string;
  jellyfinMediaId?: string;
  jellyfinMediaId4k?: string;
}

interface JellyseerrRequest {
  id: number;
  type: 'movie' | 'tv';
  status: number;
  media: JellyseerrMediaItem;
  createdAt: string;
  updatedAt: string;
  requestedBy: {
    id: number;
    email: string;
    displayName: string;
    avatar?: string;
  };
}

interface JellyseerrUser {
  id: number;
  email: string;
  displayName: string;
  avatar?: string;
  permissions: number;
  createdAt: string;
  updatedAt: string;
  requestCount: number;
}

export function createJellyseerrClient(config: JellyseerrConfig) {
  const baseUrl = config.url.replace(/\/$/, '');
  const headers = {
    'X-Api-Key': config.apiKey,
    'Content-Type': 'application/json',
  };

  async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${baseUrl}/api/v1${endpoint}`;
    logger.debug('Jellyseerr API request:', url);
    
    const response = await fetch(url, { 
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Jellyseerr API error:', { status: response.status, error });
      throw new Error(`Jellyseerr API error: ${response.status} - ${error}`);
    }
    
    return response.json();
  }

  return {
    async getStatus(): Promise<JellyseerrStatus> {
      return fetchAPI<JellyseerrStatus>('/status');
    },

    async getSettings(): Promise<JellyseerrSettings> {
      return fetchAPI<JellyseerrSettings>('/settings/public');
    },

    async getRequestCount(): Promise<JellyseerrRequestCount> {
      return fetchAPI<JellyseerrRequestCount>('/request/count');
    },

    async getRequests(take = 20): Promise<{ results: JellyseerrRequest[] }> {
      return fetchAPI<{ results: JellyseerrRequest[] }>(`/request?take=${take}`);
    },

    async getRecentlyAdded(take = 20): Promise<{ results: JellyseerrMediaItem[] }> {
      return fetchAPI<{ results: JellyseerrMediaItem[] }>(`/media?take=${take}&sort=added`);
    },

    async getIssueCount(): Promise<JellyseerrIssueCount> {
      return fetchAPI<JellyseerrIssueCount>('/issue/count');
    },

    async getUsers(take = 20): Promise<{ results: JellyseerrUser[] }> {
      return fetchAPI<{ results: JellyseerrUser[] }>(`/user?take=${take}`);
    },

    async getMovieDetails(tmdbId: number): Promise<unknown> {
      return fetchAPI<unknown>(`/movie/${tmdbId}`);
    },

    async getTvDetails(tmdbId: number): Promise<unknown> {
      return fetchAPI<unknown>(`/tv/${tmdbId}`);
    },

    async testConnection(): Promise<boolean> {
      try {
        await this.getStatus();
        return true;
      } catch {
        return false;
      }
    },

    // Search endpoints
    async searchMulti(query: string, page = 1): Promise<unknown> {
      return fetchAPI<unknown>(`/search?query=${encodeURIComponent(query)}&page=${page}`);
    },

    async searchMovies(query: string, page = 1): Promise<unknown> {
      return fetchAPI<unknown>(`/search/movie?query=${encodeURIComponent(query)}&page=${page}`);
    },

    async searchTv(query: string, page = 1): Promise<unknown> {
      return fetchAPI<unknown>(`/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
    },

    // Discover endpoints
    async discoverMovies(page = 1): Promise<unknown> {
      return fetchAPI<unknown>(`/discover/movies?page=${page}`);
    },

    async discoverTv(page = 1): Promise<unknown> {
      return fetchAPI<unknown>(`/discover/tv?page=${page}`);
    },

    async discoverTrending(): Promise<unknown> {
      return fetchAPI<unknown>('/discover/trending');
    },

    async discoverPopular(): Promise<unknown> {
      return fetchAPI<unknown>('/discover/movies/popular');
    },

    async discoverUpcoming(): Promise<unknown> {
      return fetchAPI<unknown>('/discover/movies/upcoming');
    },

    // Request management
    async createRequest(body: unknown): Promise<unknown> {
      return fetchAPI<unknown>('/request', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    async updateRequest(requestId: number, body: unknown): Promise<unknown> {
      return fetchAPI<unknown>(`/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },

    async deleteRequest(requestId: number): Promise<void> {
      return fetchAPI<void>(`/request/${requestId}`, {
        method: 'DELETE',
      });
    },

    // Media availability
    async checkMovieAvailability(tmdbId: number): Promise<unknown> {
      return fetchAPI<unknown>(`/movie/${tmdbId}/available`);
    },

    async checkTvAvailability(tmdbId: number): Promise<unknown> {
      return fetchAPI<unknown>(`/tv/${tmdbId}/available`);
    },

    // Library sync
    async syncLibraries(): Promise<unknown> {
      return fetchAPI<unknown>('/settings/jellyfin/sync', {
        method: 'POST',
      });
    },

    async getLibraryStatus(): Promise<unknown> {
      return fetchAPI<unknown>('/settings/jellyfin/library');
    },
  };
}