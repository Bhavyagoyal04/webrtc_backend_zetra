type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(level: LogLevel, message: string, meta?: any): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...(meta && { meta }),
    };
  }

  private output(logEntry: LogEntry): void {
    const { timestamp, level, message, meta } = logEntry;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    
    const colorCodes: Record<LogLevel, string> = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[35m',   // Magenta
    };
    
    const reset = '\x1b[0m';
    const color = colorCodes[level];
    
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaStr}`);
  }

  info(message: string, meta?: any): void {
    this.output(this.formatLog('info', message, meta));
  }

  warn(message: string, meta?: any): void {
    this.output(this.formatLog('warn', message, meta));
  }

  error(message: string, meta?: any): void {
    this.output(this.formatLog('error', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.output(this.formatLog('debug', message, meta));
    }
  }
}

export default new Logger();
