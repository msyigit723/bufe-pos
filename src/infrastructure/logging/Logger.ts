export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;
export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;

  public static setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  public static debug(moduleOrMessage: string, messageOrData?: unknown, data?: unknown): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      if (typeof messageOrData === "string") {
        console.debug(`[DEBUG][${moduleOrMessage}] ${messageOrData}`, data !== undefined ? data : "");
      } else {
        console.debug(`[DEBUG] ${moduleOrMessage}`, messageOrData !== undefined ? messageOrData : "");
      }
    }
  }

  public static info(moduleOrMessage: string, messageOrData?: unknown, data?: unknown): void {
    if (this.currentLevel <= LogLevel.INFO) {
      if (typeof messageOrData === "string") {
        console.info(`[INFO][${moduleOrMessage}] ${messageOrData}`, data !== undefined ? data : "");
      } else {
        console.info(`[INFO] ${moduleOrMessage}`, messageOrData !== undefined ? messageOrData : "");
      }
    }
  }

  public static warn(moduleOrMessage: string, messageOrData?: unknown, data?: unknown): void {
    if (this.currentLevel <= LogLevel.WARN) {
      if (typeof messageOrData === "string") {
        console.warn(`[WARN][${moduleOrMessage}] ${messageOrData}`, data !== undefined ? data : "");
      } else {
        console.warn(`[WARN] ${moduleOrMessage}`, messageOrData !== undefined ? messageOrData : "");
      }
    }
  }

  public static error(moduleOrMessage: string, messageOrData?: unknown, error?: unknown): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      if (typeof messageOrData === "string") {
        console.error(`[ERROR][${moduleOrMessage}] ${messageOrData}`, error !== undefined ? error : "");
      } else {
        console.error(`[ERROR] ${moduleOrMessage}`, messageOrData !== undefined ? messageOrData : "");
      }
    }
  }
}
