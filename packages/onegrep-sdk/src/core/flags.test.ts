import { describe, it, expect } from 'vitest'

import { testLog } from '../../test/log.test.js'

const log = testLog

import { OneGrepApiHighLevelClient } from './api/high.js'
import { getFlagsProvider } from './flags.js'

class MockHighLevelClient extends OneGrepApiHighLevelClient {
  constructor() {
    super({} as any)
  }

  async authStatus() {
    return {
      credentials_provided: true,
      is_authenticated: true,
      user_id: 'test-user-id'
    }
  }

  async getFlags(): Promise<Record<string, boolean | string>> {
    return {
      'test-flag-boolean': true,
      'test-flag-string': 'value'
    }
  }
}

const flagsProvider = getFlagsProvider(new MockHighLevelClient())

describe('FlagsProvider', () => {
  it('should get flags', async () => {
    const allFlags = await flagsProvider.all()
    log.info('All flags: ', allFlags)
    expect(allFlags).toBeDefined()
    expect(allFlags['test-flag-boolean']).toBe(true)
    expect(allFlags['test-flag-string']).toBe('value')
  })

  it('should get a flag boolean value', async () => {
    const flagValue = await flagsProvider.value('test-flag-boolean')
    log.info('Flag value: ', flagValue)
    expect(flagValue).toBeDefined()
    expect(flagValue).toBe(true)
  })

  it('should get a flag string value', async () => {
    const flagValue = await flagsProvider.value('test-flag-string')
    log.info('Flag value: ', flagValue)
    expect(flagValue).toBeDefined()
    expect(flagValue).toBe('value')
  })

  it('should get a flag undefined value', async () => {
    const flagValue = await flagsProvider.value('test-flag-undefined')
    log.info('Flag value: ', flagValue)
    expect(flagValue).toBeUndefined()
  })
})
