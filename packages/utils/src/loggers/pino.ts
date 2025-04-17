import { Logger } from 'ts-log'
import { Env } from '../env.js'
import pino from 'pino'
import path from 'path'
import fs from 'fs'

export async function pinoLogger(env: Env): Promise<Logger> {
  class LoggerInstance implements Logger {
    private logger: pino.Logger

    constructor(logger: pino.Logger) {
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

  async function getLogger(
    logLevel: string,
    logTransport: LogTransport,
    logFilepath?: string
  ): Promise<pino.Logger> {
    const options: pino.LoggerOptions = {
      level: logLevel
      // Other options can be added here
    }

    if (logTransport === 'stdout') {
      // For stdout in Pino v6, we can just use standard output
      // Pino-pretty can be used as a separate process with pipe
      return pino(options)
    } else if (logTransport === 'file') {
      // For file, create the directory if it doesn't exist
      if (logFilepath) {
        const dir = path.dirname(logFilepath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        // Create a destination stream for the file
        const fileStream = fs.createWriteStream(logFilepath, { flags: 'a' })
        return pino(options, fileStream)
      } else {
        const defaultLogPath = path.join(process.cwd(), 'onegrep.log')
        const dir = path.dirname(defaultLogPath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        const fileStream = fs.createWriteStream(defaultLogPath, { flags: 'a' })
        return pino(options, fileStream)
      }
    }

    throw new Error(`Invalid log transport: ${logTransport}`)
  }

  async function getLoggerFromEnv(env: Env): Promise<pino.Logger> {
    return await getLogger(
      env.LOG_LEVEL,
      env.PINO_LOG_TRANSPORT,
      env.PINO_LOG_FILEPATH
    )
  }

  return new LoggerInstance(await getLoggerFromEnv(env))
}
