/**
 * Structured Logger
 * 
 * All logs must go through this logger to ensure consistent formatting, JSON structure, and trace correlation.
 * Logs include: timestamp, level, message, context (user, project, operation), error details, and trace_id.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  projectId?: string;
  operation?: string;
  traceId?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context?: LogContext) {
    this.context = context || {};
  }

  withContext(context: LogContext): Logger {
    const logger = new Logger({ ...this.context, ...context });
    return logger;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      ...(data && { data }),
    };

    const output = JSON.stringify(logEntry);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any) {
    const errorData =
      error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
          }
        : error;
    this.log('error', message, errorData);
  }
}

export const createLogger = (context?: LogContext): Logger => {
  return new Logger(context);
};