import { dummyLogger, Logger } from 'ts-log'
import { Env, getEnv } from './env.js'

function silentLogger(): Logger {
  return dummyLogger
}

function consoleLogger(): Logger {
  return console
}

async function getLoggerFromEnv(env: Env): Promise<Logger> {
  let logger: Logger
  if (env.LOG_MODE === 'silent') {
    logger = silentLogger()
  } else if (env.LOG_MODE === 'console') {
    logger = consoleLogger()
  } else {
    throw new Error(`Invalid log mode: ${env.LOG_MODE}`)
  }
  return logger
}

export let log: Logger = silentLogger()

function initLogger(): void {
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
