import { initialize } from '@blaxel/core'
import { ToolServerClient } from '~/core/index.js'
import {
  BlaxelToolServerClient,
  ComposioToolServerClient,
  SmitheryToolServerClient
} from '@toolprint/api-client'
import { createBlaxelConnection } from '~/providers/blaxel/connection.js'
import { createSmitheryConnection } from '~/providers/smithery/connection.js'
import {
  ConnectionManager,
  ToolServerConnection,
  ToolServerId
} from '~/types.js'
import {
  MultiTransportClientSession,
  RefreshableMultiTransportClientSession
} from '~/providers/mcp/session.js'
import { ClientSessionFactory } from '~/providers/mcp/session.js'
import { ClientSession } from '~/providers/mcp/session.js'
import { ClientSessionManager } from '~/providers/mcp/session.js'

import {
  createBlaxelMcpClientTransports as blaxelMcpTransportOptions,
  BlaxelSettings
} from '~/providers/blaxel/transport.js'
import { createSmitheryTransports as smitheryMcpTransportOptions } from '~/providers/smithery/transport.js'

import { log } from '~/core/log.js'
import { xBlaxelHeaders } from './providers/blaxel/api.js'
import { SecretManager } from './secrets/index.js'
import { SmitheryUrlOptions } from '@smithery/sdk/shared/config.js'
import { createComposioTransports } from './providers/composio/transport.js'
import { createComposioConnection } from './providers/composio/connection.js'

export class ClientSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClientSessionError'
  }
}

export class InvalidTransportConfigError extends ClientSessionError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTransportConfigError'
  }
}

/**
 * A function that creates a client session for a tool server client
 */
export interface ClientSessionMaker<T extends ToolServerClient> {
  create: (client: T) => Promise<ClientSession>
}

export const blaxelClientSessionMaker: ClientSessionMaker<BlaxelToolServerClient> =
{
  create: async (client: BlaxelToolServerClient) => {
    return Promise.resolve(
      new RefreshableMultiTransportClientSession(
        blaxelMcpTransportOptions(client.blaxel_function)
      )
    )
  }
}

export const apiKeyBlaxelClientSessionMaker = (
  apiKey: string,
  workspace: string,
  providedSettings?: BlaxelSettings
): ClientSessionMaker<BlaxelToolServerClient> => {
  const headerOverrides = xBlaxelHeaders(apiKey, workspace)
  log.trace('Blaxel header overrides', headerOverrides)
  initialize({
    apikey: apiKey,
    workspace: workspace
  })
  return {
    create: async (client: BlaxelToolServerClient) => {
      return Promise.resolve(
        new MultiTransportClientSession(
          blaxelMcpTransportOptions(
            client.blaxel_function,
            providedSettings,
            headerOverrides
          )
        )
      )
    }
  }
}

export const smitheryClientSessionMaker: ClientSessionMaker<SmitheryToolServerClient> =
{
  create: async (client: SmitheryToolServerClient) => {
    return Promise.resolve(
      new MultiTransportClientSession(
        smitheryMcpTransportOptions(client, {
          apiKey: process.env.SMITHERY_API_KEY,
          profile: 'default' // ! Probably won't work, it generates a random profile name
        })
      )
    )
  }
}

export const apiKeySmitheryClientSessionMaker = (
  secretManager: SecretManager,
  apiKey: string,
  profileId: string
): ClientSessionMaker<SmitheryToolServerClient> => {
  return {
    create: async (client: SmitheryToolServerClient) => {
      // Initialize the config with an empty object by default
      let smitheryConfig: Record<string, any> = {}

      const launchConfig = client.launch_config
      if (
        launchConfig &&
        typeof launchConfig === 'object' &&
        'source' in launchConfig
      ) {
        // ! We only support Doppler source for now
        if (launchConfig.source === 'doppler') {
          log.debug('Loading Smithery launch config from Doppler')

          const secretName = launchConfig.secret_name
          const hasSecret = await secretManager.hasSecret(secretName)

          // If the secret exists, parse it and use it as the config
          if (hasSecret) {
            const secret = await secretManager.getSecret(secretName)
            try {
              smitheryConfig = JSON.parse(secret)
            } catch (error) {
              throw new ClientSessionError(
                `Failed to parse Smithery launch config: ${error}`
              )
            }
            log.debug('Smithery launch config parsed successfully from Doppler')
          } else {
            log.warn(
              'Smithery launch config not found in Doppler, using empty config'
            )
          }
        }
      }

      const smitheryUrlOptions: SmitheryUrlOptions = {
        apiKey,
        profile: profileId,
        config: smitheryConfig
      }
      return Promise.resolve(
        new MultiTransportClientSession(
          smitheryMcpTransportOptions(client, smitheryUrlOptions)
        )
      )
    }
  }
}

export const apiKeyComposioClientSessionMaker = (
  apiKey: string
): ClientSessionMaker<ComposioToolServerClient> => {
  log.debug('Creating Composio client session maker', apiKey)
  return {
    create: async (client: ComposioToolServerClient) => {
      return Promise.resolve(
        new MultiTransportClientSession(createComposioTransports(client))
      )
    }
  }
}

class RegisteredClientSessionFactory {
  private clientTypeToSessionMaker: Map<
    string,
    ClientSessionMaker<ToolServerClient>
  >

  constructor(
    sessionMakers?: Map<string, ClientSessionMaker<ToolServerClient>>
  ) {
    this.clientTypeToSessionMaker = sessionMakers ?? new Map()
  }

  register(
    client_type: string,
    sessionMaker: ClientSessionMaker<ToolServerClient>
  ) {
    this.clientTypeToSessionMaker.set(client_type, sessionMaker)
  }

  create(client: ToolServerClient): Promise<ClientSession> {
    if (!this.clientTypeToSessionMaker.has(client.client_type)) {
      throw new Error(
        `Session maker not registered for client type: ${client.client_type}`
      )
    }
    return this.clientTypeToSessionMaker.get(client.client_type)!.create(client)
  }
}

/**
 * Creates a client session for a tool server based on the client type.
 */
export const defaultToolServerSessionFactory: RegisteredClientSessionFactory =
  new RegisteredClientSessionFactory()

/**
 * Manages tool server sessions for different tool servers.
 *
 * Sessions are cached by tool server id
 *
 * Must use close() to clean up sessions
 */
export function createToolServerSessionManager(
  factory: ClientSessionFactory<
    ToolServerClient,
    ClientSession
  > = defaultToolServerSessionFactory
): ClientSessionManager<ToolServerClient, ClientSession> {
  return new ClientSessionManager<ToolServerClient, ClientSession>(
    factory,
    (client) => Promise.resolve(client.server_id) // KeyExtractor uses the server_id as the key
  )
}

/**
 * Manages connections to tool servers of different types.
 *
 * connections are cached and reused for efficiency
 *
 * Must use close() to clean up connections
 */
export class ToolServerConnectionManager implements ConnectionManager {
  private readonly toolServerSessionManager: ClientSessionManager<
    ToolServerClient,
    ClientSession
  >
  private openConnections: Map<ToolServerId, ToolServerConnection>

  constructor(
    factory: ClientSessionFactory<
      ToolServerClient,
      ClientSession
    > = defaultToolServerSessionFactory
  ) {
    this.toolServerSessionManager = createToolServerSessionManager(factory)
    this.openConnections = new Map()
  }

  private async removeClosedConnection(
    client: ToolServerClient
  ): Promise<void> {
    this.openConnections.delete(client.server_id)
    log.debug(`Removed closed connection for tool server ${client.server_id}`)
  }

  private async newConnection(
    client: ToolServerClient
  ): Promise<ToolServerConnection> {
    // ! Extend the onClose callback to remove the closed connection from the open connections map
    async function extendOnClose(
      manager: ToolServerConnectionManager,
      mcpClientSession: ClientSession
    ) {
      const originalOnClose = mcpClientSession.onClose
      mcpClientSession.onClose = async () => {
        await originalOnClose?.()
        await manager.removeClosedConnection(client)
      }
    }

    if (client.client_type === 'blaxel') {
      // ! Use the SDK's MCP client sessions if the environment variable is set
      if (process.env.ONEGREP_SDK_BLAXEL_USE_SDK_SESSIONS) {
        return await createBlaxelConnection(client as BlaxelToolServerClient)
      }

      // Otherwise we manage our own sessions
      const mcpClientSession =
        await this.toolServerSessionManager.getSession(client)
      extendOnClose(this, mcpClientSession)

      return await createBlaxelConnection(
        client as BlaxelToolServerClient,
        mcpClientSession
      )
    }
    if (client.client_type === 'smithery') {
      const mcpClientSession =
        await this.toolServerSessionManager.getSession(client)
      extendOnClose(this, mcpClientSession)

      return await createSmitheryConnection(
        client as SmitheryToolServerClient,
        mcpClientSession
      )
    }

    if (client.client_type === 'composio') {
      const mcpClientSession =
        await this.toolServerSessionManager.getSession(client)
      extendOnClose(this, mcpClientSession)

      return await createComposioConnection(
        client as ComposioToolServerClient,
        mcpClientSession
      )
    }

    throw new Error(
      `Unsupported tool server client type: ${client.client_type}`
    )
  }

  /**
   * Connect to a tool server and return a connection.
   *
   * returns an active connection for a given server id if one exists
   * otherwise creates a new connection and caches it
   */
  async connect(client: ToolServerClient): Promise<ToolServerConnection> {
    if (this.openConnections.has(client.server_id)) {
      log.info(`Returning open connection for tool server: ${client.server_id}`)
      return this.openConnections.get(client.server_id)!
    }
    const connection = await this.newConnection(client)
    this.openConnections.set(client.server_id, connection)
    log.info(
      `Opening ${connection.constructor.name} for tool server: ${client.server_id}`
    )

    await connection.initialize()
    log.info(`Connection initialized for tool server: ${client.server_id}`)

    return connection
  }

  /**
   * Close all connections.
   */
  async close(): Promise<void> {
    for (const connection of this.openConnections.values()) {
      await connection.close()
    }
    this.openConnections.clear()
  }
}
