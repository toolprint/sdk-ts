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

describe('ConsoleLogger', () => {
  // Verify chalk is in the environment
  // Force chalk to use colors
  beforeAll(() => {
    expect(typeof chalk).toBe('function')
    chalk.level = 2 // Force level 2 color support
    process.env.FORCE_COLOR = '2' // Force color in child processes
  })

  let logger: Logger
  let consoleSpy: {
    log: MockInstance
    debug: MockInstance
    info: MockInstance
    warn: MockInstance
    error: MockInstance
  }

  beforeEach(async () => {
    // Spy on console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log'),
      debug: vi.spyOn(console, 'debug'),
      info: vi.spyOn(console, 'info'),
      warn: vi.spyOn(console, 'warn'),
      error: vi.spyOn(console, 'error')
    }

    logger = await consoleLogger()
  })

  afterEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should log trace messages', () => {
    const message = 'Trace message'
    logger.trace(message)
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log trace messages with objects', () => {
    const message = 'Trace message'
    const obj = { a: 1, b: 2 }
    logger.trace(message, obj)
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(message),
      obj
    )
  })

  it('should log debug messages', () => {
    const message = 'Debug message'
    logger.debug(message)
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log info messages', () => {
    const message = 'Info message'
    logger.info(message)
    expect(consoleSpy.info).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log warning messages', () => {
    const message = 'Warning message'
    logger.warn(message)
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log error messages', () => {
    const message = 'Error message'
    logger.error(message)
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining(message)
    )
  })

  it('should log error messages with error objects', () => {
    const message = 'Error message'
    const error = new Error('Test error')
    logger.error(message, error)
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining(message),
      error
    )
  })
})
