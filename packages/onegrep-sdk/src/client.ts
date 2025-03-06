import { type ZodiosOptions } from '@zodios/core'
import { getEnv } from '@repo/utils'
import { createApiClient } from '@repo/onegrep-api-client'

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
  if (!env.ONEGREP_API_KEY) {
    throw new Error('ONEGREP_API_KEY is not set')
  }
  return createApiKeyClient(
    env.ONEGREP_API_KEY.toString(),
    env.ONEGREP_API_URL.toString()
  )
}
