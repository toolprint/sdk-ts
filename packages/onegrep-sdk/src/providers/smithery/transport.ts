import {
  createSmitheryUrl,
  SmitheryUrlOptions
} from '@smithery/sdk/shared/config.js'

import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { log } from '~/core/index.js'
import { SmitheryToolServerClient } from '@repo/onegrep-api-client'
import { jsonSchemaUtils } from '~/schema.js'
import { InvalidTransportConfigError } from '~/connection.js'

export function createSmitheryTransports(
  toolServerClient: SmitheryToolServerClient,
  smitheryUrlOptions: SmitheryUrlOptions
): Transport[] {
  if (!smitheryUrlOptions.apiKey) {
    throw new InvalidTransportConfigError(
      'Smithery API key is required for Smithery connections'
    )
  }

  // Smithery is moving to prioritize http-streaming transport
  // TODO: Create transports for all connection types?
  const http_connection = toolServerClient.connections.find(
    (c: any) => c.type === 'http'
  )
  if (!http_connection) {
    throw new InvalidTransportConfigError('No HTTP connection found')
  }
  if (!http_connection.deployment_url) {
    throw new InvalidTransportConfigError(
      'No deployment URL found for HTTP connection'
    )
  }

  // Validate the provided config against the config schema (not required if using profile)
  if (!smitheryUrlOptions.profile && http_connection.config_schema) {
    log.debug('Validating Smithery launch config')
    const validator = jsonSchemaUtils.getValidator(
      http_connection.config_schema
    )
    if (!validator(smitheryUrlOptions.config)) {
      log.warn(
        `Invalid Smithery launch config for: ${toolServerClient.server_id}`
      )
    }
  }

  // ! NOTE: do not log the `smithery_transport_url` as it contains the api key
  const smithery_transport_url = createSmitheryUrl(
    http_connection.deployment_url,
    smitheryUrlOptions
  )
  return [new StreamableHTTPClientTransport(smithery_transport_url)]
}
