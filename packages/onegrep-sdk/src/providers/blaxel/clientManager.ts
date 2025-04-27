import {
  listFunctions,
  ListFunctionsResponse,
  Function as BlaxelFunction
} from '@blaxel/sdk'
import {
  McpTool as BlaxelMcpServer,
  retrieveMCPClient
} from '@blaxel/sdk/tools/mcpTool'
import { IServerClientManager } from '../domain/types.js'

export class BlaxelClientManager
  implements IServerClientManager<BlaxelMcpServer>
{
  private serverNameMap: Map<string, BlaxelMcpServer> = new Map()

  constructor() {}

  private async cleanupToolServers(): Promise<void> {
    this.serverNameMap.forEach((server: BlaxelMcpServer) => {
      server.close()
    })
    this.serverNameMap.clear()
  }

  async cleanup(): Promise<void> {
    await this.cleanupToolServers()
  }

  async refreshServer(serverName: string): Promise<void> {
    if (!this.serverNameMap.has(serverName)) {
      throw new Error(`Integration ${serverName} not found`)
    }

    let server = this.serverNameMap.get(serverName)!
    await server.close()

    // Now retrieve the server again.
    server = retrieveMCPClient(serverName)
    await server.refresh()
    this.serverNameMap.set(serverName, server)
  }

  async refresh(): Promise<boolean> {
    try {
      // Clear existing tool servers
      await this.cleanupToolServers()

      // Get all available functions
      const { data, error } = await listFunctions()
      if (error !== undefined) {
        console.error('Error refreshing Blaxel tools:', error)
        return false
      }

      const functions: BlaxelFunction[] = data as ListFunctionsResponse

      const serverNames = functions
        .map((bfn: BlaxelFunction) => bfn.metadata?.name)
        .filter((name: string | undefined) => name !== undefined)

      // Now get the McpToolServer for each of the server names.
      for (const serverName of serverNames) {
        const server = retrieveMCPClient(serverName)
        await server.refresh() // This refreshes the internal tool cache in blaxel for the server and opens up a persistent transport
        this.serverNameMap.set(serverName, server)
      }

      return true
    } catch (error) {
      console.error('Error refreshing Blaxel tools:', error)
      return false
    }
  }

  async getServers(
    serverNames: string[]
  ): Promise<Map<string, BlaxelMcpServer>> {
    const servers = new Map<string, BlaxelMcpServer>()
    for (const serverName of serverNames) {
      const server = await this.getServer(serverName)
      if (server) {
        servers.set(serverName, server)
      }
    }

    return servers
  }

  async getServer(serverName: string): Promise<BlaxelMcpServer | undefined> {
    if (this.serverNameMap.get(serverName)) {
      return this.serverNameMap.get(serverName)!
    }

    try {
      // Generate a connection to the underlying server and cache it for cleanup later.
      const server = retrieveMCPClient(serverName)
      await server.refresh()
      this.serverNameMap.set(serverName, server)

      return server
    } catch (error) {
      console.error('Error getting Blaxel server:', error)
      return undefined
    }
  }
}
