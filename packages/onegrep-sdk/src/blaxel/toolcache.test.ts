import { createApiClientFromParams } from '../core/api/client.js'
import { BlaxelToolCache } from './toolcache.js'
import { describe, expect, it } from 'vitest'

describe('BlaxelToolCacheTests', () => {
  it.skip('should refresh the tool cache', async () => {
    const apiClient = createApiClientFromParams({
      apiKey: process.env.ONEGREP_API_KEY,
      baseUrl: process.env.ONEGREP_BASE_URL!
    })
    const tc = new BlaxelToolCache(apiClient)
    await tc.refresh()
    const tools = await tc.list()
    console.log(JSON.stringify(tools, null, 2))
    expect(true).toBe(true)
  }, 60000) // 60 second timeout
})
