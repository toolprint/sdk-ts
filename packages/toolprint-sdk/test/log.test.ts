import { loggingSchema, getEnv, getLogger } from '@repo/utils'
import { describe, expect, it } from 'vitest'

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

describe('LoggerTests', () => {
  it('should be a logger', () => {
    expect(testLog).toHaveProperty('debug')
    expect(testLog).toHaveProperty('info')
    expect(testLog).toHaveProperty('warn')
    expect(testLog).toHaveProperty('error')
    expect(testLog).toHaveProperty('trace')
  })
})
