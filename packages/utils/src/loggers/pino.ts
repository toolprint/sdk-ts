import { Logger } from 'ts-log'
import { Env } from '../env'

export async function pinoLogger(env: Env): Promise<Logger> {
  const { default: pino } = await import('pino')
  type PinoLogger = import('pino').Logger

  class LoggerInstance implements Logger {
    private logger: PinoLogger

    constructor(logger: PinoLogger) {
      if (!logger) {
        throw new Error('Pino Logger instance is required')
      }
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

  type LogTransport = 'stdout' | 'file'

  async function consoleTransport() {
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

  async function fileTransport(logFilepath?: string) {
    // If no logFilepath is provided, use the default log filepath
    // Dynamically load path module in case we don't actually need it
    if (!logFilepath) {
      const path = await import('path')

      logFilepath = path.join(process.cwd(), 'onegrep.log')
    }

    return {
      target: 'pino/file',
      options: {
        destination: logFilepath,
        level: 'debug',
        mkdir: true
      }
    }
  }

  async function getLogger(
    logLevel: string,
    logTransport: LogTransport,
    logFilepath?: string
  ): Promise<PinoLogger> {
    if (logTransport === 'stdout') {
      return pino({
        level: logLevel,
        transport: await consoleTransport()
      })
    } else if (logTransport === 'file') {
      return pino({
        level: logLevel,
        transport: await fileTransport(logFilepath)
      })
    }
    throw new Error(`Invalid log transport: ${logTransport}`)
  }

  async function getLoggerFromEnv(env: Env): Promise<PinoLogger> {
    return await getLogger(
      env.LOG_LEVEL,
      env.PINO_LOG_TRANSPORT,
      env.PINO_LOG_FILEPATH
    )
  }

  return new LoggerInstance(await getLoggerFromEnv(env))
}
