// Configurable logger with level support
// Users can set LOG_LEVEL environment variable to control verbosity
// Levels: error, warn, info, debug, trace (default: info)

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

export class Logger {
  private prefix = '[Dasharr]';
  private currentLevel: number;
  private useColors: boolean;
  private sensitivePatterns: RegExp[] = [
    // API Keys and tokens (various formats)
    /(?:api[_-]?key|apikey|token|secret|password|passwd|pwd)[\s:='"]*([a-zA-Z0-9_-]{20,})/gi,
    // Bearer tokens
    /Bearer\s+([a-zA-Z0-9_.-]+)/gi,
    // Basic auth
    /Basic\s+([a-zA-Z0-9+/]+=*)/gi,
    // URLs with credentials
    /(https?:\/\/)([^:]+:[^@]+)@/gi,
    // Email passwords in URLs
    /password=([^&\s]+)/gi,
    // JSON values for sensitive keys
    /"(?:api_key|apiKey|api-key|token|secret|password|auth|authorization)":\s*"([^"]+)"/gi,
    // Environment variable values
    /(?:SONARR|RADARR|PROWLARR|PLEX|JELLYFIN|OVERSEERR|JELLYSEERR|QBITTORRENT|SABNZBD|BAZARR|TAUTULLI|DASHARR)_(?:API_KEY|TOKEN|PASSWORD|SECRET)=([^\s]+)/gi,
  ];
  
  constructor() {
    // Get log level from environment variable or default to 'info'
    const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    this.currentLevel = LOG_LEVELS[envLevel] ?? LOG_LEVELS.info;
    
    // Determine if we should use colors (not in production or when NO_COLOR is set)
    this.useColors = process.env.NODE_ENV !== 'production' && !process.env.NO_COLOR;
  }
  
  private maskSensitiveData(input: unknown): unknown {
    if (typeof input === 'string') {
      let masked = input;
      
      // Apply all sensitive patterns
      for (const pattern of this.sensitivePatterns) {
        pattern.lastIndex = 0; // Reset regex state
        masked = masked.replace(pattern, (match, ...groups) => {
          // Find the actual secret value in the groups
          const secretGroup = groups.find(g => typeof g === 'string' && g.length > 0);
          if (!secretGroup) return match;
          
          // Keep first 3 chars if long enough, otherwise just mask
          const maskLength = Math.max(secretGroup.length - 3, 3);
          const maskedValue = secretGroup.length > 6 
            ? secretGroup.substring(0, 3) + '*'.repeat(maskLength)
            : '*'.repeat(secretGroup.length);
          
          // Reconstruct the match with masked value
          return match.replace(secretGroup, maskedValue);
        });
      }
      
      return masked;
    }
    
    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(item => this.maskSensitiveData(item));
      }
      
      const masked: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        // Mask values for sensitive keys
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('api') || lowerKey.includes('key') || 
            lowerKey.includes('token') || lowerKey.includes('secret') || 
            lowerKey.includes('password') || lowerKey.includes('auth')) {
          if (typeof value === 'string' && value.length > 0) {
            masked[key] = value.length > 6 
              ? value.substring(0, 3) + '*'.repeat(value.length - 3)
              : '*'.repeat(value.length);
          } else {
            masked[key] = value;
          }
        } else {
          masked[key] = this.maskSensitiveData(value);
        }
      }
      return masked;
    }
    
    return input;
  }
  
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelText = `[${level.toUpperCase()}]`;
    
    if (this.useColors) {
      const colors: Record<LogLevel, string> = {
        error: '\x1b[31m', // red
        warn: '\x1b[33m',  // yellow
        info: '\x1b[36m',  // cyan
        debug: '\x1b[90m', // gray
        trace: '\x1b[35m', // magenta
      };
      const reset = '\x1b[0m';
      const color = colors[level];
      return `${timestamp} ${this.prefix} ${color}${levelText}${reset} ${message}`;
    }
    
    return `${timestamp} ${this.prefix} ${levelText} ${message}`;
  }
  
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      const maskedMessage = this.maskSensitiveData(message) as string;
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.log(this.formatMessage('info', maskedMessage), ...maskedArgs);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      const maskedMessage = this.maskSensitiveData(message) as string;
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.warn(this.formatMessage('warn', maskedMessage), ...maskedArgs);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      const maskedMessage = this.maskSensitiveData(message) as string;
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.error(this.formatMessage('error', maskedMessage), ...maskedArgs);
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      const maskedMessage = this.maskSensitiveData(message) as string;
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.log(this.formatMessage('debug', maskedMessage), ...maskedArgs);
    }
  }

  trace(message: string, ...args: unknown[]) {
    if (this.shouldLog('trace')) {
      const maskedMessage = this.maskSensitiveData(message) as string;
      const maskedArgs = args.map(arg => this.maskSensitiveData(arg));
      console.log(this.formatMessage('trace', maskedMessage), ...maskedArgs);
    }
  }

  // Log HTTP requests
  request(method: string, url: string, status?: number) {
    const statusText = status ? ` -> ${status}` : '';
    const message = `${method} ${url}${statusText}`;
    
    // Log at debug level for successful requests, info for errors
    if (status && status >= 400) {
      this.warn(message);
    } else {
      this.debug(message);
    }
  }
  
  // Get current log level (useful for debugging)
  getLevel(): string {
    const level = Object.entries(LOG_LEVELS).find(([, value]) => value === this.currentLevel);
    return level ? level[0] : 'info';
  }
}

export const logger = new Logger();

// Log the current log level on startup
if (typeof process !== 'undefined' && process.env) {
  logger.info(`Logger initialized with level: ${logger.getLevel()}`);
}