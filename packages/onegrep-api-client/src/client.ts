import { type ZodiosOptions } from '@zodios/core'
import { createApiClient } from './api.js'
import { getEnv } from './env.js'

export type OneGrepApiClient = ReturnType<typeof createApiClient>

export function createApiKeyClient(apiKey: string, baseUrl: string) {
  const options: ZodiosOptions = {
    axiosConfig: {
      headers: {
        'X-ONEGREP-API-KEY': apiKey
      }
    }
  }
  return createApiClient(baseUrl, options) as OneGrepApiClient
}

export function clientFromConfig(): OneGrepApiClient {
  const env = getEnv()
  return createApiKeyClient(
    env.ONEGREP_API_KEY.toString(),
    env.ONEGREP_API_URL.toString()
  )
}
