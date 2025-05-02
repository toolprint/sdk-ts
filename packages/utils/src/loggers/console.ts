import { Logger } from 'ts-log'
import loglevel from 'loglevel'
import { LogLevelDesc } from 'loglevel'
import chalk from 'chalk'

/**
 * Custom console logger with chalk
 */
export function consoleLogger(
  loggerName?: string,
  logLevel?: LogLevelDesc
): Logger {
  let logger: loglevel.Logger = loglevel // root logger

  // if a logger name is provided, get a child logger instead of the root logger
  if (loggerName) {
    logger = loglevel.getLogger(loggerName)
  }

  // if a log level is provided, set the logger level
  if (logLevel) {
    logger.setLevel(logLevel)
  }

  class LoggerInstance implements Logger {
    trace(message?: any, ...optionalParams: any[]): void {
      logger.trace(chalk.dim(chalk.gray(message)), ...optionalParams)
    }

    debug(message?: any, ...optionalParams: any[]): void {
      logger.debug(chalk.dim(chalk.yellow(message)), ...optionalParams)
    }

    info(message?: any, ...optionalParams: any[]): void {
      logger.info(chalk.blue(message), ...optionalParams)
    }

    warn(message?: any, ...optionalParams: any[]): void {
      logger.warn(chalk.magenta(message), ...optionalParams)
    }

    error(message?: any, ...optionalParams: any[]): void {
      logger.error(chalk.red(message), ...optionalParams)
    }

    [x: string]: any // Allow for additional properties
  }

  return new LoggerInstance()
}
