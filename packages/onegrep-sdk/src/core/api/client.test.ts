import { clientFromConfig } from './client.js'
import { describe, it, expect } from 'vitest'

import { getLogger } from '@repo/utils'

const log = getLogger('console', 'test')

describe('API Client Integration Tests', () => {
  it.skip('should successfully call the health endpoint', async () => {
    const client = clientFromConfig()
    const response = await client.health_health_get()
    expect(response).toBeDefined()
    log.info(response)
  })

  it('should successfully list servers', async () => {
    const client = clientFromConfig()
    const response = await client.list_servers_api_v1_servers__get()
    expect(response).toBeDefined()
    log.info(response)
  })

  it('should successfully get server client', async () => {
    const client = clientFromConfig()
    const servers = await client.list_servers_api_v1_servers__get()
    const server = servers[0]
    const response =
      await client.get_server_client_api_v1_servers__server_id__client_get({
        params: {
          server_id: server.id
        }
      })
    expect(response).toBeDefined()
    log.info(response)
  })
})
