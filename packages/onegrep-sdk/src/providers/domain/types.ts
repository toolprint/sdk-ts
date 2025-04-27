/**
 * Describes the implementation for a ServerClientManager which is responsible
 * for returning instances of Servers for a higher-level module to utilize.
 */
export interface IServerClientManager<T = any> {
  cleanup(): Promise<void>
  refreshServer(serverName: string): Promise<void>
  getServers(serverNames: string[]): Promise<Map<string, T>>
  getServer(serverName: string): Promise<T | undefined>
}
