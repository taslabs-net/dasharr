interface OverseerrConfig {
  url: string;
  apiKey: string;
}

interface OverseerrUser {
  id: number;
  displayName: string;
  email: string;
  avatar: string;
  permissions: number;
  plexToken?: string;
  plexUsername?: string;
  userType: number;
  createdAt: string;
  updatedAt: string;
  requestCount: number;
}

interface OverseerrMediaRequest {
  id: number;
  status: number;
  media: {
    id: number;
    tmdbId: number;
    imdbId?: string;
    tvdbId?: number;
    status: number;
    title: string;
    originalTitle?: string;
    releaseDate?: string;
    genre?: string[];
    mediaType: 'movie' | 'tv';
    posterPath?: string;
    backdropPath?: string;
  };
  requestedBy: OverseerrUser;
  modifiedBy?: OverseerrUser;
  createdAt: string;
  updatedAt: string;
  type: 'movie' | 'tv';
  is4k: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
}


interface OverseerrSettings {
  initialized: boolean;
  applicationTitle: string;
  applicationUrl?: string;
  hideAvailable: boolean;
  localLogin: boolean;
  movie4kEnabled: boolean;
  series4kEnabled: boolean;
  region?: string;
  originalLanguage?: string;
}

interface OverseerrStatus {
  version: string;
  commitTag: string;
  updateAvailable: boolean;
  commitsBehind: number;
}

export class OverseerrAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: OverseerrConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Overseerr API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Status and Info
  async getStatus(): Promise<OverseerrStatus> {
    return this.makeRequest('/api/v1/status');
  }

  async getSettings(): Promise<OverseerrSettings> {
    return this.makeRequest('/api/v1/settings/main');
  }

  // Requests
  async getRequests(take = 20, skip = 0, filter?: string, sort = 'modified'): Promise<{
    pageInfo: {
      pages: number;
      pageSize: number;
      results: number;
      page: number;
    };
    results: OverseerrMediaRequest[];
  }> {
    const params = new URLSearchParams({
      take: take.toString(),
      skip: skip.toString(),
      sort,
    });
    
    if (filter) {
      params.append('filter', filter);
    }

    return this.makeRequest(`/api/v1/request?${params}`);
  }

  async getRequestCount(): Promise<{
    total: number;
    movie: number;
    tv: number;
    pending: number;
    approved: number;
    declined: number;
    processing: number;
    available: number;
  }> {
    return this.makeRequest('/api/v1/request/count');
  }

  // Media
  async getRecentlyAdded(take = 20): Promise<{
    page: number;
    totalPages: number;
    totalResults: number;
    results: Array<{
      id: number;
      mediaType: 'movie' | 'tv';
      tmdbId: number;
      imdbId?: string;
      status: number;
      title: string;
      originalTitle?: string;
      releaseDate?: string;
      genre?: string[];
      posterPath?: string;
      backdropPath?: string;
      ratingKey?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    return this.makeRequest(`/api/v1/media?take=${take}&sort=created&filter=available`);
  }

  // Users
  async getUsers(take = 20, skip = 0): Promise<{
    pageInfo: {
      pages: number;
      pageSize: number;
      results: number;
      page: number;
    };
    results: OverseerrUser[];
  }> {
    return this.makeRequest(`/api/v1/user?take=${take}&skip=${skip}`);
  }

  async getCurrentUser(): Promise<OverseerrUser> {
    return this.makeRequest('/api/v1/auth/me');
  }

  // Issues
  async getIssueCount(): Promise<{
    total: number;
    video: number;
    audio: number;
    subtitles: number;
    others: number;
    open: number;
    closed: number;
  }> {
    return this.makeRequest('/api/v1/issue/count');
  }

  // Media Details
  async getMovieDetails(tmdbId: number): Promise<{
    id: number;
    tmdbId: number;
    title: string;
    posterPath?: string;
    backdropPath?: string;
    releaseDate?: string;
    overview?: string;
    runtime?: number;
    tagline?: string;
  }> {
    return this.makeRequest(`/api/v1/movie/${tmdbId}`);
  }

  async getTvDetails(tmdbId: number): Promise<{
    id: number;
    tmdbId: number;
    name: string;
    posterPath?: string;
    backdropPath?: string;
    firstAirDate?: string;
    overview?: string;
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
  }> {
    return this.makeRequest(`/api/v1/tv/${tmdbId}`);
  }
}

export function createOverseerrClient(config: OverseerrConfig): OverseerrAPI {
  return new OverseerrAPI(config);
}