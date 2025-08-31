export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      const prefix =
        level === LogLevel.ERROR
          ? '❌'
          : level === LogLevel.WARN
            ? '⚠️'
            : level === LogLevel.INFO
              ? 'ℹ️'
              : '🔍';

      console.log(`${prefix} - ${levelName}: ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  success(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    console.log(`✅ [${timestamp}] SUCCESS: ${message}`, ...args);
  }
}
