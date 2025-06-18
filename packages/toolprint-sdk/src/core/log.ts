import { z } from 'zod'
import {
  getEnv,
  getLogger,
  wrapConsole,
  loggingSchema
} from '@repo/utils'

/**
 * NOTE: We previously had a custom sdkLoggingSchema that extended the base loggingSchema
 * to validate ONEGREP_SDK_LOG_LEVEL. This was removed due to TypeScript type conflicts
 * between different instances of Zod types when extending schemas.
 * 
 * Instead, we now:
 * 1. Use the base loggingSchema directly from @repo/utils
 * 2. Handle ONEGREP_SDK_LOG_LEVEL through the sdkLogLevel function with its own validation
 * 3. Trade schema validation for type compatibility
 */

// Separate schema just for SDK log level validation
const sdkLogLevelSchema = z.string().default('info')

const sdkLogLevel = () => {
  const rawLevel = process.env.ONEGREP_SDK_LOG_LEVEL ?? process.env.LOG_LEVEL ?? 'info'
  // Parse and validate the log level
  return sdkLogLevelSchema.parse(rawLevel)
}

const initSdkLogger = () => {
  const env = getEnv(loggingSchema)
  return getLogger(env.LOG_MODE, 'sdk', sdkLogLevel())
}

/**
 * The child logger for the onegrep-sdk.
 */
export const log = initSdkLogger()

/**
 * Wraps the console object with the sdk root logger.
 * NOTE: Should call this as soon as possible in the application
 * to ensure that any third party libraries that use the console
 * object will log to the sdk root logger.
 */
export const useRootLoggerAsConsole = () => {
  wrapConsole()
}
