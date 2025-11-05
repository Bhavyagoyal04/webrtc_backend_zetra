type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data }),
    };

    const colorCodes = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[35m',
    };

    const resetColor = '\x1b[0m';
    const color = colorCodes[level];

    console.log(`${color}[${logEntry.level}]${resetColor} ${timestamp} - ${message}`, data || '');
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData) {
    this.log('error', message, data);
  }

  debug(message: string, data?: LogData) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }
}

export default new Logger();
