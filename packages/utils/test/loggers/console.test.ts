import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockInstance,
  beforeAll
} from 'vitest'
import { consoleLogger } from '../../src/loggers/console.js'
import { Logger } from 'ts-log'
import chalk from 'chalk'
import loglevel from 'loglevel'

describe('ConsoleLogger', () => {
  // Verify chalk is in the environment
  // Force chalk to use colors
  beforeAll(() => {
    expect(typeof chalk).toBe('function')
    chalk.level = 2 // Force level 2 color support
    process.env.FORCE_COLOR = '2' // Force color in child processes
  })

  let logger: Logger
  let loglevelLoggerSpy: {
    trace: MockInstance
    debug: MockInstance
    info: MockInstance
    warn: MockInstance
    error: MockInstance
  }

  beforeEach(async () => {
    logger = await consoleLogger('utils-test', 'trace')

    const loglevelLogger = loglevel.getLogger('utils-test')

    // Spy on console methods
    loglevelLoggerSpy = {
      trace: vi.spyOn(loglevelLogger, 'trace'),
      debug: vi.spyOn(loglevelLogger, 'debug'),
      info: vi.spyOn(loglevelLogger, 'info'),
      warn: vi.spyOn(loglevelLogger, 'warn'),
      error: vi.spyOn(loglevelLogger, 'error')
    }
  })

  afterEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should log trace messages', () => {
    const message = 'Trace message'
    logger.trace(message)
    expect(loglevelLoggerSpy.trace).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log trace messages with objects', () => {
    const message = 'Trace message'
    const obj = { a: 1, b: 2 }
    logger.trace(message, obj)
    expect(loglevelLoggerSpy.trace).toHaveBeenCalledWith(
      expect.stringContaining(message),
      obj
    )
  })

  it('should log debug messages', () => {
    const message = 'Debug message'
    logger.debug(message)
    expect(loglevelLoggerSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log debug messages with objects', () => {
    const message = 'Debug message'
    const obj = { a: 1, b: 2 }
    logger.debug(message, obj)
    expect(loglevelLoggerSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining(message),
      obj
    )
  })

  it('should log info messages', () => {
    const message = 'Info message'
    logger.info(message)
    expect(loglevelLoggerSpy.info).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log warning messages', () => {
    const message = 'Warning message'
    logger.warn(message)
    expect(loglevelLoggerSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log error messages', () => {
    const message = 'Error message'
    logger.error(message)
    expect(loglevelLoggerSpy.error).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log error messages with error objects', () => {
    const message = 'Error message'
    const error = new Error('Test error')
    logger.error(message, error)
    expect(loglevelLoggerSpy.error).toHaveBeenCalledWith(
      expect.stringContaining(message),
      error
    )
  })
})
