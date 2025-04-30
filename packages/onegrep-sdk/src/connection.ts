import {
  BlaxelToolServerClient,
  SmitheryToolServerClient,
  ToolServerClient
} from './core/api/types.js'
import { createBlaxelConnection } from './providers/blaxel/connection.js'
import { createSmitheryConnection } from './providers/smithery/connection.js'
import { ConnectionManager, ToolServerConnection } from './types.js'

/**
 * Manages connections to tool servers of different types.
 *
 * connections are cached and reused for efficiency
 *
 * Must use close() to clean up connections
 */
export class ToolServerConnectionManager implements ConnectionManager {
  private connections: Map<string, ToolServerConnection>

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
      return createSmitheryConnection(client as SmitheryToolServerClient)
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
