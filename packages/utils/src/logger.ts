import { dummyLogger, Logger } from 'ts-log'
import { LogLevelDesc } from 'loglevel'
import { z } from 'zod'

import { consoleLogger } from './loggers/console.js'
import { fileLogger } from './loggers/file.js'
import { multiLogger } from './loggers/multi.js'

import { getEnv, getEnvIssues, loggingEnvSchema, logModes } from './env.js'

export const asConsole = (logger: Logger): Console => {
  return {
    log: logger.info.bind(logger),
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger)
  } as Console
}

export const silentLogger: Logger = dummyLogger

export function getLogger(
  logMode: z.infer<typeof logModes>,
  loggerName?: string,
  logLevelName?: string
): Logger {
  let logger: Logger

  // Convert the string log level to a LogLevelDesc (so consumers don't need to import loglevel)
  const logLevelDesc = logLevelName as LogLevelDesc | undefined

  if (logMode === 'off') {
    logger = silentLogger
  } else if (logMode === 'console') {
    logger = consoleLogger(loggerName, logLevelDesc)
  } else if (logMode === 'file') {
    logger = fileLogger(loggerName, logLevelDesc)
  } else if (logMode === 'all') {
    const allLoggers: Logger[] = [
      consoleLogger(loggerName, logLevelDesc),
      fileLogger(loggerName, logLevelDesc)
    ]
    logger = multiLogger(allLoggers)
  } else {
    throw new Error(`Unsupported log mode: ${logMode}`)
  }

  logger.debug(
    `${loggerName ?? 'Root'} logger initialized with log level ${logLevelName}`
  )

  return logger
}

const initRootLogger = (): Logger => {
  const issues = getEnvIssues(loggingEnvSchema)
  if (issues) {
    console.error('Invalid environment variables:', issues)
    process.exit(1)
  }
  const env = getEnv(loggingEnvSchema)

  try {
    return getLogger(env.LOG_MODE, undefined, env.LOG_LEVEL)
  } catch (error) {
    console.error(
      'Failed to initialize requested log mode, using console log mode',
      error
    )
    return consoleLogger()
  }
}

/**
 * The root logger for the application.
 * This is initialized when the module is imported.
 */
export const rootLogger: Logger = initRootLogger()

/**
 * Wraps the console object with a logger instance.
 * This is useful for injecting into third party libraries that don't accept a logger instance.
 */
export function wrapConsole() {
  console = asConsole(rootLogger)
}
