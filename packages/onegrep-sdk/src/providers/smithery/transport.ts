import { createSmitheryUrl } from '@smithery/sdk'

import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { SmitheryToolServerClient } from '~/core/index.js'

export function createSmitheryTransports(
  toolServerClient: SmitheryToolServerClient
): Transport[] {
  // ! Use secret manager to get the smithery api key?
  // const secretNames = await secretManager.getSecretNames()
  // if (!secretNames.includes('SMITHERY_API_KEY')) {
  //     throw new Error('SMITHERY_API_KEY secret not found')
  // }

  const smitheryApiKey = process.env.SMITHERY_API_KEY
  if (!smitheryApiKey) {
    throw new Error(
      'SMITHERY_API_KEY environment variable is required for Smithery connections'
    )
  }

  // ! TODO: Parse and validate config from secret manager?
  const config = {
    env: {}
  }

  // Smithery is moving to prioritize http-streaming transport
  // TODO: Create transports for all connection types?
  const http_connection = toolServerClient.connections.find(
    (c) => c.type === 'http'
  )
  if (!http_connection) {
    throw new Error('No HTTP connection found')
  }
  if (!http_connection.deployment_url) {
    throw new Error('No deployment URL found for HTTP connection')
  }

  // ! NOTE: do not log the `smithery_transport_url` as it contains the api key
  const smithery_transport_url = createSmitheryUrl(
    http_connection.deployment_url,
    config,
    smitheryApiKey
  )
  return [new StreamableHTTPClientTransport(smithery_transport_url)]
}
