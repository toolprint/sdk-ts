import {
  createConfig,
  createClient,
  ClientOptions
} from '@hey-api/client-axios'
import { getEnv, sdkApiSchema } from '@repo/utils'
import { OneGrepApiClient } from './types.js'

import { log } from '../log.js'

/**
 * Create a raw API Client given multiple optional parameters. A baseURL is always required.
 * @param clientParams - The parameters for the client
 * @returns An instance of the OneGrep API Client
 */
export function createApiClientFromParams(clientParams: {
  baseUrl: string
  apiKey?: string
  accessToken?: string
}): OneGrepApiClient {
  const { baseUrl, apiKey, accessToken } = clientParams

  let authSchemeProvided = false
  const headers: Record<string, string> = {}
  if (apiKey !== undefined) {
    headers['X-ONEGREP-API-KEY'] = apiKey
    authSchemeProvided = true
  }

  if (!authSchemeProvided && accessToken !== undefined) {
    headers['Authorization'] = `Bearer ${accessToken}`
    authSchemeProvided = true
  }

  if (!authSchemeProvided) {
    throw new Error(
      'No authentication scheme provided. Must provide either an API Key or an Access Token.'
    )
  }

  try {
    const client = createClient(
      createConfig<ClientOptions>({
        baseURL: baseUrl,
        headers: headers
      })
    )
    return client as unknown as OneGrepApiClient
  } catch (error) {
    log.error(`Error creating OneGrep API Client: ${error}`)
    throw error
  }
}

/**
 * Create a raw API Client given the state of the environment.
 * @returns A client configured with the environment variables
 */
export function clientFromConfig(): OneGrepApiClient {
  const env = getEnv(sdkApiSchema)

  if (!env.ONEGREP_API_KEY) {
    throw new Error('ONEGREP_API_KEY is not set')
  }

  const params = {
    apiKey: env.ONEGREP_API_KEY.toString(),
    baseUrl: env.ONEGREP_API_URL.toString()
  }

  // console.debug(`Creating client pointing to ${params.baseUrl}`)

  return createApiClientFromParams(params)
}
