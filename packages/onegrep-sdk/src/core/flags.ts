import { Keyv } from 'keyv'
import { Cache, createCache } from 'cache-manager'
import { OneGrepApiHighLevelClient } from './api/high.js'
import { log } from './log.js'

export type Flags = Record<string, FlagValue>
export type FlagValue = string | boolean

export class FlagsProvider {
  private flagsCache: Cache

  constructor(private readonly apiClient: OneGrepApiHighLevelClient) {
    this.flagsCache = createCache({
      cacheId: 'flags',
      stores: [
        new Keyv({ ttl: 1000 * 60 }) // 1 minute
      ]
    })
  }

  private async getAuthenticatedUserId(): Promise<string | undefined> {
    const authStatus = await this.apiClient.authStatus()
    if (authStatus.is_authenticated) {
      return authStatus.user_id! as string // ! Should be a string if authenticated
    } else {
      return undefined
    }
  }

  async all(): Promise<Flags> {
    const user_id = await this.getAuthenticatedUserId()
    if (!user_id) {
      log.warn(
        'No authenticated user id found for flags: returning empty flags'
      )
      return {}
    }

    // Cache flags by user_id in case the SDK is used in a multi-user environment
    return this.flagsCache.wrap(user_id, async () => {
      const flags = await this.apiClient.getFlags()
      return flags.flags
    })
  }

  async value(flagName: string): Promise<FlagValue | undefined> {
    const flags = await this.all()
    return flags[flagName]
  }
}

export const getFlagsProvider = (
  apiClient: OneGrepApiHighLevelClient
): FlagsProvider => {
  return new FlagsProvider(apiClient)
}
