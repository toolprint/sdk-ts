import {
  listFunctions,
  ListFunctionsResponse,
  Function as BlaxelFunction
} from '@blaxel/sdk'
import {
  McpTool as BlaxelMcpServer,
  retrieveMCPClient
} from '@blaxel/sdk/tools/mcpTool'

export class BlaxelClient {
  private toolServers: Map<string, BlaxelMcpServer> = new Map()

  constructor() {}

  private async cleanupToolServers(): Promise<void> {
    this.toolServers.forEach((server: BlaxelMcpServer) => {
      server.close()
    })
    this.toolServers.clear()
  }

  async cleanup(): Promise<void> {
    await this.cleanupToolServers()
  }

  async refreshServer(serverName: string): Promise<void> {
    if (!this.toolServers.has(serverName)) {
      throw new Error(`Integration ${serverName} not found`)
    }

    let server = this.toolServers.get(serverName)!
    await server.close()

    // Now retrieve the server again.
    server = retrieveMCPClient(serverName)
    await server.refresh()
    this.toolServers.set(serverName, server)
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
      // console.debug(functions)

      const serverNames = functions
        .map((bfn: BlaxelFunction) => bfn.metadata?.name)
        .filter((name: string | undefined) => name !== undefined)

      // console.debug(
      //   `Discovered servers -> ${JSON.stringify(serverNames, null, 2)}`
      // )

      // Now get the McpToolServer for each of the server names.
      for (const serverName of serverNames) {
        const server = retrieveMCPClient(serverName)
        await server.refresh() // This refreshes the internal tool cache in blaxel for the server and opens up a persistent transport
        this.toolServers.set(serverName, server)

        // const tools = await server.listTools()
        // console.debug(
        //   `Tools for ${serverName} -> ${JSON.stringify(
        //     tools.map((t: BlaxelTool) => t.name),
        //     null,
        //     2
        //   )}`
        // )
      }

      return true
    } catch (error) {
      console.error('Error refreshing Blaxel tools:', error)
      return false
    }
  }

  async refreshIntegration(integrationName: string): Promise<void> {
    if (!this.toolServers.has(integrationName)) {
      throw new Error(`Integration ${integrationName} not found`)
    }

    await this.refreshServer(integrationName)
  }

  async getToolServers(): Promise<Map<string, BlaxelMcpServer>> {
    return this.toolServers
  }

  async getToolServer(serverName: string): Promise<BlaxelMcpServer> {
    if (!this.toolServers.has(serverName)) {
      throw new Error(`Integration ${serverName} not found`)
    }

    return this.toolServers.get(serverName)!
  }
}
