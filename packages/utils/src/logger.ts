import pino, { Logger } from 'pino'
import path from 'path'

import { getEnv } from './env'

export type LogMode = 'stdout' | 'file'

const DEFAULT_LOG_FILEPATH = path.join(process.cwd(), 'logs', 'onegrep-sdk.log')

function prettyTransport() {
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
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

export function getLogger(
  logLevel: string,
  logMode: LogMode,
  logFilepath?: string
): Logger {
  return pino({
    level: logLevel,
    transport:
      logMode === 'stdout'
        ? prettyTransport()
        : fileTransport(logFilepath || DEFAULT_LOG_FILEPATH)
  })
}

export function getLoggerFromConfig(): Logger {
  const env = getEnv()
  return getLogger(env.LOG_LEVEL, env.LOG_MODE, env.LOG_FILEPATH)
}

export const log: Logger = getLoggerFromConfig()
