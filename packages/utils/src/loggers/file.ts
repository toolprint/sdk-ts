import { Logger } from 'ts-log'
import loglevel from 'loglevel'
import { LogLevelDesc } from 'loglevel'

import fs from 'fs'
import path from 'path'
import { initConfigDir } from '../config.js'

export const getLogFilepath = (filename: string) => {
  const configDir = initConfigDir()
  return path.join(configDir, filename)
}

export const clearLogFile = (filename: string) => {
  const logFilepath = getLogFilepath(filename)

  // Clear the log file by writing an empty string to it
  fs.writeFileSync(logFilepath, '')
}

const levelString = (level: LogLevelDesc) => {
  const levelString = Object.keys(loglevel.levels).find(
    (key) => loglevel.levels[key as keyof typeof loglevel.levels] === level
  )
  if (!levelString) {
    throw new Error(`Invalid log level: ${level}`)
  }
  return levelString.toUpperCase()
}

// Format the log message
const formatMessage = (
  loglevel: LogLevelDesc,
  message: any,
  ...optionalParams: any[]
) => {
  // If the message is an object, convert it to a string
  if (typeof message === 'object') {
    message = JSON.stringify(message, null, 2)
  }
  // Formatted log line
  const logLine = `${new Date().toISOString()} ${levelString(loglevel).padEnd(5)}: ${message}\n`
  // If there are no optional params, return the log line
  if (optionalParams.length === 0) {
    return logLine
  }
  // If there are optional params, format them and append them to the log line
  const formattedParams = optionalParams
    .map((param) =>
      typeof param === 'object' ? JSON.stringify(param, null, 2) : param
    )
    .join('\n')
  return [logLine, formattedParams].join('\n')
}

/**
 * Custom file logger
 */
export function fileLogger(
  loggerName?: string,
  level: LogLevelDesc = loglevel.levels.INFO
): Logger {
  // Construct the log file path based on the logger name
  let logFilepath = getLogFilepath('onegrep.log')
  if (loggerName) {
    logFilepath = getLogFilepath(`onegrep.${loggerName}.log`)
  }

  // Create a filter function to check if the message should be logged
  const shouldLogMessage = (messageLevel: LogLevelDesc) => {
    return level.valueOf() <= messageLevel.valueOf()
  }

  // Create a write stream to the log file
  const fileOutput = fs.createWriteStream(logFilepath, { flags: 'w' })

  // Define the LoggerInstance class which filters and formats the log messages
  class LoggerInstance implements Logger {
    trace(message?: any, ...optionalParams: any[]): void {
      const messageLevel = loglevel.levels.TRACE

      if (shouldLogMessage(messageLevel)) {
        fileOutput.write(
          `${formatMessage(messageLevel, message, ...optionalParams)}`
        )
      }
    }

    debug(message?: any, ...optionalParams: any[]): void {
      const messageLevel = loglevel.levels.DEBUG
      if (shouldLogMessage(messageLevel)) {
        fileOutput.write(
          `${formatMessage(messageLevel, message, ...optionalParams)}`
        )
      }
    }

    info(message?: any, ...optionalParams: any[]): void {
      const messageLevel = loglevel.levels.INFO
      if (shouldLogMessage(messageLevel)) {
        fileOutput.write(
          `${formatMessage(messageLevel, message, ...optionalParams)}`
        )
      }
    }

    warn(message?: any, ...optionalParams: any[]): void {
      const messageLevel = loglevel.levels.WARN
      if (shouldLogMessage(messageLevel)) {
        fileOutput.write(
          `${formatMessage(messageLevel, message, ...optionalParams)}`
        )
      }
    }

    error(message?: any, ...optionalParams: any[]): void {
      const messageLevel = loglevel.levels.ERROR
      if (shouldLogMessage(messageLevel)) {
        fileOutput.write(
          `${formatMessage(messageLevel, message, ...optionalParams)}`
        )
      }
    }

    [x: string]: any // Allow for additional properties
  }

  return new LoggerInstance()
}

// export const fileLogger = {
//     log: (msg: string) => {
//       if (currentLogLevel <= LOG_LEVEL_INFO) {
//         fileOutput.write(`${msg}\n`)
//       }
//     },
//     debug: (msg: string) => {
//       if (currentLogLevel <= LOG_LEVEL_DEBUG) {
//         fileOutput.write(`DEBUG: ${msg}\n`)
//       }
//     },
//     info: (msg: string) => {
//       if (currentLogLevel <= LOG_LEVEL_INFO) {
//         fileOutput.write(`INFO: ${msg}\n`)
//       }
//     },
//     success: (msg: string) => fileOutput.write(`SUCCESS: ${msg}\n`),
//     warn: (msg: string) => fileOutput.write(`WARN: ${msg}\n`),
//     error: (msg: string) => fileOutput.write(`ERROR: ${msg}\n`)
//   } as const
