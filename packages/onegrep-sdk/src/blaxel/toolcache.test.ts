import { createApiClientFromParams } from '../core/api/client.js'
import { BlaxelToolCache } from './toolcache.js'
import { describe, expect, it } from 'vitest'

describe('BlaxelToolCacheTests', () => {
  it('should refresh the tool cache', async () => {
    const apiClient = createApiClientFromParams({
      apiKey: process.env.ONEGREP_API_KEY,
      baseUrl: process.env.ONEGREP_BASE_URL!
    })
    const tc = new BlaxelToolCache(apiClient)

    await tc.refresh()
    expect(true).toBe(true)
  })
})
