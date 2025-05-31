import { describe, it, expect } from 'vitest'

import { client } from '../src/index.js'

const log = console

describe('API Client Integration Tests', () => {
  it('should successfully call the health endpoint', async () => {
    const response = await client.get({
      url: '/health'
    })
    expect(response).toBeDefined()
    log.info(response)
  })
})
