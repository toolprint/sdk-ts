import {
  BlaxelToolServerClient,
  SmitheryToolServerClient,
  ToolServerClient
} from '~/core/index.js'
import { createBlaxelConnection } from '~/providers/blaxel/connection.js'
import { createSmitheryConnection } from '~/providers/smithery/connection.js'
import { ConnectionManager, ToolServerConnection } from '~/types.js'
import {
  MultiTransportClientSession,
  RefreshableMultiTransportClientSession
} from '~/providers/mcp/session.js'
import { ClientSessionFactory } from '~/providers/mcp/session.js'
import { ClientSession } from '~/providers/mcp/session.js'
import { ClientSessionManager } from '~/providers/mcp/session.js'

import { createBlaxelMcpClientTransports as blaxelMcpTransportOptions } from '~/providers/blaxel/transport.js'
import { createSmitheryTransports as smitheryMcpTransportOptions } from '~/providers/smithery/transport.js'

import { Cache, createCache } from 'cache-manager'
import Keyv from 'keyv'

import { log } from '~/core/log.js'

/**
 * Creates a client session for a tool server based on the client type.
 */
const toolServerSessionFactory: ClientSessionFactory<
  ToolServerClient,
  ClientSession
> = {
  create: async (client: ToolServerClient) => {
    if (client.client_type === 'blaxel') {
      const blaxelClient = client as BlaxelToolServerClient
      return new RefreshableMultiTransportClientSession(
        blaxelMcpTransportOptions(blaxelClient.blaxel_function)
      )
    }
    if (client.client_type === 'smithery') {
      const smitheryClient = client as SmitheryToolServerClient
      return new MultiTransportClientSession(
        smitheryMcpTransportOptions(smitheryClient)
      )
    }
    throw new Error(
      `Unsupported tool server client type: ${client.client_type}`
    )
  }
}

/**
 * Manages tool server sessions for different tool servers.
 *
 * Sessions are cached by tool server id
 *
 * Must use close() to clean up sessions
 */
export const toolServerSessionManager = new ClientSessionManager<
  ToolServerClient,
  ClientSession
>(toolServerSessionFactory, (client) => Promise.resolve(client.server_id))

/**
 * Manages connections to tool servers of different types.
 *
 * connections are cached and reused for efficiency
 *
 * Must use close() to clean up connections
 */
export class ToolServerConnectionManager implements ConnectionManager {
  // private connections: Map<ToolServerId, ToolServerConnection>
  private connectionCache: Cache

  constructor() {
    // this.connections = new Map()
    this.connectionCache = createCache({
      cacheId: 'tool-server-connection-cache',
      stores: [new Keyv({ ttl: 1000 * 60 * 5 })] // 5 minutes
    })
  }

  private async newConnection(
    client: ToolServerClient
  ): Promise<ToolServerConnection> {
    if (client.client_type === 'blaxel') {
      return await createBlaxelConnection(client as BlaxelToolServerClient)
    }
    if (client.client_type === 'smithery') {
      return await createSmitheryConnection(
        client as SmitheryToolServerClient,
        await toolServerSessionManager.getSession(client)
      )
    }

    throw new Error(
      `Unsupported tool server client type: ${client.client_type}`
    )
  }

  /**
   * Get a cached connection for a tool server client.
   *
   * returns an active connection for a given server id if one exists
   * otherwise returns undefined
   */
  private async getCachedConnection(
    client: ToolServerClient
  ): Promise<ToolServerConnection> {
    return await this.connectionCache.wrap(client.server_id, async () => {
      log.info(`Creating new connection for ${client.server_id}`)
      return await this.newConnection(client)
    })
  }

  /**
   * Connect to a tool server and return a connection.
   *
   * returns an active connection for a given server id if one exists
   * otherwise creates a new connection and caches it
   */
  async connect(client: ToolServerClient): Promise<ToolServerConnection> {
    return await this.getCachedConnection(client)
  }

  /**
   * Close all connections.
   */
  async close(): Promise<void> {
    await this.connectionCache.clear()
  }
}
