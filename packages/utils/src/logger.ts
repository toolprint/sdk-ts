import { dummyLogger, Logger } from 'ts-log'
import { pinoLogger } from './loggers/pino.js'
import { Env, getEnv } from './env.js'

export function silentLogger(): Logger {
  return dummyLogger
}

export function consoleLogger(): Logger {
  return console
}

async function getLoggerFromEnv(env: Env): Promise<Logger> {
  let logger: Logger
  if (env.LOG_MODE === 'silent') {
    logger = silentLogger()
  } else if (env.LOG_MODE === 'console') {
    logger = consoleLogger()
  } else if (env.LOG_MODE === 'pino') {
    logger = await pinoLogger(env)
  } else if (env.LOG_MODE === 'debug') {
    // ! Debug mode is not supported in the utils package, so we use the silent logger.
    logger = silentLogger()
  } else {
    throw new Error(`Invalid log mode: ${env.LOG_MODE}`)
  }
  return logger
}

export let log: Logger = silentLogger()

export function initLogger(): void {
  const env = getEnv()
  getLoggerFromEnv(env)
    .then((logger) => {
      log = logger
    })
    .catch((error) => {
      log = consoleLogger()
      log.error(
        'Failed to initialize requested logger, using console logger',
        error
      )
    })
  log.info('Logger initialized')
}

initLogger()
