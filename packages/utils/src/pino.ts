import { Logger } from 'ts-log'
import { Env, getEnv } from './env'

export async function getPinoLogger(env: Env): Promise<Logger> {
  const { default: pino } = await import('pino')
  type PinoLogger = import('pino').Logger

  const path = await import('path')
  const dirname = path.dirname(__filename)

  class LoggerInstance implements Logger {
    private logger: PinoLogger

    constructor(logger: PinoLogger) {
      this.logger = logger
    }

    trace(message?: any, ...optionalParams: any[]): void {
      this.logger.trace(message, ...optionalParams)
    }

    debug(message?: any, ...optionalParams: any[]): void {
      this.logger.debug(message, ...optionalParams)
    }

    info(message?: any, ...optionalParams: any[]): void {
      this.logger.info(message, ...optionalParams)
    }

    warn(message?: any, ...optionalParams: any[]): void {
      this.logger.warn(message, ...optionalParams)
    }

    error(message?: any, ...optionalParams: any[]): void {
      this.logger.error(message, ...optionalParams)
    }

    [x: string]: any // Allow for additional properties
  }

  type LogMode = 'stdout' | 'file'

  const DEFAULT_LOG_FILEPATH = path.join(
    process.cwd(),
    'logs',
    'onegrep-sdk.log'
  )

  function prettyTransport() {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        colorizeObjects: true,
        levelFirst: true,
        translateTime: 'HH:MM:ss'
      }
    }
  }

  function fileTransport(logFile: string) {
    return {
      target: 'pino/file',
      options: {
        destination: logFile,
        level: 'debug',
        mkdir: true
      }
    }
  }

  function getLogger(
    logLevel: string,
    logMode: LogMode,
    logFilepath?: string
  ): PinoLogger {
    return pino({
      level: logLevel,
      transport:
        logMode === 'stdout'
          ? prettyTransport()
          : fileTransport(logFilepath || DEFAULT_LOG_FILEPATH)
    })
  }

  function getLoggerFromEnv(env: Env): PinoLogger {
    return getLogger(
      env.LOG_LEVEL,
      env.PINO_LOG_TRANSPORT,
      env.PINO_LOG_FILEPATH
    )
  }

  return new LoggerInstance(getLoggerFromEnv(env))
}
