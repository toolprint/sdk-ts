import { describe, expect, it } from 'vitest'
import { BlaxelClientManager } from './clientManager.js'

// @deprecated
describe.skip('BlaxelClientManagerTests', () => {
  it('should get the web search server', async () => {
    const blaxelClient = new BlaxelClientManager()
    const server = await blaxelClient.getServer('exa')
    expect(server).toBeDefined()
    console.log('server', server)
  }, 60000) // 60 second timeout
})
