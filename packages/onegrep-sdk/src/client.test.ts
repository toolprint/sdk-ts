import { clientFromConfig } from './client'
import { describe, it, expect } from 'vitest'
import { log } from '@repo/utils'

describe('API Client Integration Tests', () => {
  it('should successfully call the health endpoint', async () => {
    const client = clientFromConfig()
    const response = await client.health_health_get()
    expect(response).toBeDefined()
    log.info(response)
  })

  it(
    'should successfully get meta server remote client config',
    { timeout: 20000 },
    async () => {
      const client = clientFromConfig()
      const response = await client.get_meta_client_api_v1_clients_meta_get()
      expect(response).toBeDefined()
      log.info(response)
    }
  )

  it('should successfully get host servers', { timeout: 20000 }, async () => {
    const client = clientFromConfig()
    const response = await client.get_hosts_clients_api_v1_clients_hosts_get()
    expect(response).toBeDefined()
    log.info(response)
  })
})
