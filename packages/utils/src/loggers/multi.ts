import { Logger } from 'ts-log'

/**
 * Log to multiple loggers
 */
export function multiLogger(loggers: Logger[]): Logger {
  class LoggerInstance implements Logger {
    trace(message?: any, ...optionalParams: any[]): void {
      for (const logger of loggers) {
        logger.trace(message, ...optionalParams)
      }
    }

    debug(message?: any, ...optionalParams: any[]): void {
      for (const logger of loggers) {
        logger.debug(message, ...optionalParams)
      }
    }

    info(message?: any, ...optionalParams: any[]): void {
      for (const logger of loggers) {
        logger.info(message, ...optionalParams)
      }
    }

    warn(message?: any, ...optionalParams: any[]): void {
      for (const logger of loggers) {
        logger.warn(message, ...optionalParams)
      }
    }

    error(message?: any, ...optionalParams: any[]): void {
      for (const logger of loggers) {
        logger.error(message, ...optionalParams)
      }
    }

    [x: string]: any // Allow for additional properties
  }

  return new LoggerInstance()
}
