import { SecretManager } from './secrets/types.js'
import {
  BlaxelToolServerClient,
  SmitheryToolServerClient,
  ToolServerClient
} from './core/api/types.js'
import { createBlaxelConnection } from './providers/blaxel/connection.js'
import { createSmitheryConnection } from './providers/smithery/connection.js'
import {
  ConnectionManager,
  ToolServerConnection,
  ToolServerId
} from './types.js'
import {
  MultiTransportClientSession,
  RefreshableMultiTransportClientSession
} from './providers/mcp/session.js'
import { ClientSessionFactory } from './providers/mcp/session.js'
import { ClientSession } from './providers/mcp/session.js'
import { ClientSessionManager } from './providers/mcp/session.js'

import { createBlaxelMcpClientTransports as blaxelMcpTransportOptions } from './providers/blaxel/transport.js'
import { createSmitheryTransports as smitheryMcpTransportOptions } from './providers/smithery/transport.js'

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
  private connections: Map<ToolServerId, ToolServerConnection>

  constructor() {
    this.connections = new Map()
  }

  private async newConnection(
    client: ToolServerClient
  ): Promise<ToolServerConnection> {
    if (client.client_type === 'blaxel') {
      return createBlaxelConnection(client as BlaxelToolServerClient)
    }
    if (client.client_type === 'smithery') {
      return createSmitheryConnection(
        client as SmitheryToolServerClient,
        await toolServerSessionManager.getSession(client)
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
    if (this.connections.has(client.server_id)) {
      return this.connections.get(client.server_id)!
    }

    const connection = await this.newConnection(client)
    this.connections.set(client.server_id, connection)
    return connection
  }

  /**
   * Close all connections.
   */
  async close(): Promise<void> {
    for (const connection of this.connections.values()) {
      await connection.close()
    }
  }
}
