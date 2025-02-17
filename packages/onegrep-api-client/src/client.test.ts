import { clientFromConfig } from './client'
import { describe, it, expect } from 'vitest'

describe('API Client Integration Tests', () => {
  it('should successfully call the health endpoint', async () => {
    const client = clientFromConfig()
    const response = await client.health_health_get()
    expect(response).toBeDefined()
    console.log(response)
  })

  it('should successfully get meta server remote client config', async () => {
    const client = clientFromConfig()
    const response = await client.get_meta_client_api_v1_clients_meta_get()
    expect(response).toBeDefined()
    console.log(response)
  })

  it('should successfully get host servers', async () => {
    const client = clientFromConfig()
    const response = await client.get_hosts_clients_api_v1_clients_hosts_get()
    expect(response).toBeDefined()
    console.log(response)
  })
})
