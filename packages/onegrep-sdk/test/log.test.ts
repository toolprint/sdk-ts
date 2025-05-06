import { z } from 'zod'

import { loggingSchema, getEnv, getLogger } from '@repo/utils'

const testLogLevel = () => {
  return process.env.ONEGREP_SDK_TEST_LOG_LEVEL ?? 'debug'
}

const initTestLogger = () => {
  const env = getEnv(loggingSchema)

  return getLogger(env.LOG_MODE, 'test', testLogLevel())
}

/**
 * The child logger for test files.
 */
export const testLog = initTestLogger()
