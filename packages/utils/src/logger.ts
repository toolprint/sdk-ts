import { dummyLogger, Logger } from 'ts-log'
import { Env, getEnv } from './env'
import { getPinoLogger } from './pino'
import { env } from 'process'

export function getNoOpLogger(): Logger {
  return dummyLogger
}

class ConsoleLogger implements Logger {
  trace(message?: any, ...optionalParams: any[]): void {
    console.trace(message, ...optionalParams)
  }

  debug(message?: any, ...optionalParams: any[]): void {
    console.debug(message, ...optionalParams)
  }

  info(message?: any, ...optionalParams: any[]): void {
    console.info(message, ...optionalParams)
  }

  warn(message?: any, ...optionalParams: any[]): void {
    console.warn(message, ...optionalParams)
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams)
  }

  [x: string]: any // Allow for additional properties
}

export function getConsoleLogger(): Logger {
  return new ConsoleLogger()
}

async function getLoggerFromEnv(env: Env): Promise<Logger> {
  let logger: Logger
  if (env.LOG_MODE === 'silent') {
    logger = getNoOpLogger()
  } else if (env.LOG_MODE === 'console') {
    logger = getConsoleLogger()
  } else if (env.LOG_MODE === 'pino') {
    logger = await getPinoLogger(env)
  } else {
    throw new Error(`Invalid log mode: ${env.LOG_MODE}`)
  }
  return logger
}

export let log: Logger = getNoOpLogger()

export function initLogger(): void {
  const env = getEnv()
  getLoggerFromEnv(env)
    .then((logger) => {
      log = logger
    })
    .catch((error) => {
      log = getConsoleLogger()
      log.error(
        'Failed to initialize requested logger, using console logger',
        error
      )
    })
  log.info('Logger initialized')
}

initLogger()
