import { clientFromConfig } from './client.js'
import { describe, it, expect } from 'vitest'
import { testLog } from '../../../test/log.test.js'
import { ToolServer } from '@toolprint/api-client'

const log = testLog

describe('API Client Integration Tests', () => {
  it('should successfully call the health endpoint', async () => {
    const client = clientFromConfig()
    const response = await client.get({
      url: '/health'
    })
    expect(response).toBeDefined()
    expect(response.response.status).toBe(200)
    log.info(JSON.stringify(response.data))
  })

  it('should successfully list servers', async () => {
    const client = clientFromConfig()
    const response = await client.get({
      url: '/api/v1/servers'
    })
    expect(response).toBeDefined()
    expect(response.response.status).toBe(200)
    log.info(JSON.stringify(response.data))
  })

  it('should successfully get server client', async () => {
    const client = clientFromConfig()
    const serversResponse = await client.get({
      url: '/api/v1/servers'
    })
    const servers = serversResponse.data as Map<string, ToolServer>
    const server = Array.from(servers.values())[0]
    const response = await client.get({
      url: `/api/v1/servers/${server.id}/client`
    })
    expect(response).toBeDefined()
    expect(response.response.status).toBe(200)
    log.info(JSON.stringify(response.data))
  })
})
