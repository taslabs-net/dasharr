interface SABnzbdConfig {
  url: string;
  apiKey: string;
}

interface SABnzbdQueueItem {
  nzo_id: string;
  filename: string;
  mb: string;
  mbleft: string;
  mbmissing: string;
  size: string;
  sizeleft: string;
  percentage: string;
  cat: string;
  eta: string;
  priority: string;
  status: string;
  timeleft: string;
}

interface SABnzbdQueue {
  slots: SABnzbdQueueItem[];
  speed: string;
  kbpersec: string;
  size: string;
  sizeleft: string;
  mb: string;
  mbleft: string;
  noofslots: string;
  paused: boolean;
  pause_int: string;
  speedlimit: string;
  speedlimit_abs: string;
  version: string;
}

interface SABnzbdHistoryItem {
  nzo_id: string;
  name: string;
  size: string;
  category: string;
  pp: string;
  script: string;
  report: string;
  url: string;
  status: string;
  nzb_name: string;
  download_time: string;
  postproc_time: string;
  stage_log: string[];
  downloaded: string;
  completeness: string;
  fail_message: string;
  url_info: string;
  bytes: number;
  meta: Record<string, unknown>;
  series: string;
  md5sum: string;
  password: string;
  action_line: string;
  show_details: string;
  loaded: boolean;
  retry: number;
  completed: number;
  duplicate_key: string;
}

interface SABnzbdHistory {
  slots: SABnzbdHistoryItem[];
  noofslots: number;
  total_size: string;
  month_size: string;
  week_size: string;
  day_size: string;
  version: string;
}

interface SABnzbdStatus {
  status: {
    paused: boolean;
    pause_int: string;
    color: string;
    have_warnings: string;
    speed: string;
    mbleft: string;
    mb: string;
    size: string;
    sizeleft: string;
    kbpersec: string;
    speedlimit: string;
    speedlimit_abs: string;
    noofslots: string;
    diskspace1: string;
    diskspace2: string;
    diskspacetotal1: string;
    diskspacetotal2: string;
    loadavg: string;
    cache_art: string;
    cache_size: string;
    finishaction: string;
    quota: string;
    have_quota: boolean;
    left_quota: string;
    version: string;
    uptime: string;
    nt: boolean;
    new_rel_url: string;
    restart_req: boolean;
    darwin: boolean;
    pid: number;
    pp_active: boolean;
    repair_active: boolean;
    unpack_active: boolean;
    check_active: boolean;
    download_active: boolean;
  };
}

export class SABnzbdAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: SABnzbdConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/api`);
    url.searchParams.set('apikey', this.apiKey);
    url.searchParams.set('output', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`SABnzbd API error: ${response.status}`);
    }
    
    return response.json();
  }

  // Queue Management
  async getQueue(start = 0, limit = 10): Promise<{ queue: SABnzbdQueue }> {
    return this.makeRequest('', {
      mode: 'queue',
      start: start.toString(),
      limit: limit.toString()
    });
  }

  async getFullQueue(): Promise<{ queue: SABnzbdQueue }> {
    return this.makeRequest('', { mode: 'queue' });
  }

  async pauseQueue(): Promise<{ status: boolean }> {
    return this.makeRequest('', { mode: 'pause' });
  }

  async resumeQueue(): Promise<{ status: boolean }> {
    return this.makeRequest('', { mode: 'resume' });
  }

  async deleteJob(nzoId: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'queue',
      name: 'delete',
      value: nzoId
    });
  }

  async pauseJob(nzoId: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'queue',
      name: 'pause',
      value: nzoId
    });
  }

  async resumeJob(nzoId: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'queue',
      name: 'resume',
      value: nzoId
    });
  }

  async setJobPriority(nzoId: string, priority: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'queue',
      name: 'priority',
      value: nzoId,
      value2: priority
    });
  }

  // History
  async getHistory(start = 0, limit = 10): Promise<{ history: SABnzbdHistory }> {
    return this.makeRequest('', {
      mode: 'history',
      start: start.toString(),
      limit: limit.toString()
    });
  }

  async getFullHistory(): Promise<{ history: SABnzbdHistory }> {
    return this.makeRequest('', { mode: 'history' });
  }

  async deleteHistoryItem(nzoId: string, delFiles = false): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'history',
      name: 'delete',
      value: nzoId,
      del_files: delFiles ? '1' : '0'
    });
  }

  async retryFailedJob(nzoId: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'retry',
      value: nzoId
    });
  }

  // Status and Configuration
  async getStatus(): Promise<SABnzbdStatus> {
    return this.makeRequest('', { mode: 'status' });
  }

  async getServerStats(): Promise<Record<string, unknown>> {
    return this.makeRequest('', { mode: 'server_stats' });
  }

  async getVersion(): Promise<{ version: string }> {
    return this.makeRequest('', { mode: 'version' });
  }

  // Speed Control
  async setSpeedLimit(limit: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'config',
      name: 'speedlimit',
      value: limit
    });
  }

  // Add Downloads
  async addNzb(url: string, options: {
    nzbname?: string;
    cat?: string;
    priority?: string;
    pp?: string;
    script?: string;
  } = {}): Promise<{ nzo_ids: string[] }> {
    const params: Record<string, string> = {
      mode: 'addurl',
      name: encodeURIComponent(url)
    };

    if (options.nzbname) params.nzbname = options.nzbname;
    if (options.cat) params.cat = options.cat;
    if (options.priority) params.priority = options.priority;
    if (options.pp) params.pp = options.pp;
    if (options.script) params.script = options.script;

    return this.makeRequest('', params);
  }

  // Categories
  async getCategories(): Promise<{ categories: string[] }> {
    return this.makeRequest('', { mode: 'get_cats' });
  }

  // Configuration
  async getConfig(): Promise<Record<string, unknown>> {
    return this.makeRequest('', { mode: 'get_config' });
  }

  async setConfig(section: string, keyword: string, value: string): Promise<{ status: boolean }> {
    return this.makeRequest('', {
      mode: 'set_config',
      section,
      keyword,
      value
    });
  }

  // Warnings
  async getWarnings(): Promise<{ warnings: Record<string, unknown>[] }> {
    return this.makeRequest('', { mode: 'warnings' });
  }

  async clearWarnings(): Promise<{ status: boolean }> {
    return this.makeRequest('', { mode: 'warnings', name: 'clear' });
  }

  // Restart/Shutdown
  async restart(): Promise<{ status: boolean }> {
    return this.makeRequest('', { mode: 'restart' });
  }

  async shutdown(): Promise<{ status: boolean }> {
    return this.makeRequest('', { mode: 'shutdown' });
  }
}