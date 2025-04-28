import { type ZodiosOptions } from '@zodios/core'
import { getEnv } from '@repo/utils'
import { createApiClient } from '@repo/onegrep-api-client'

export type OneGrepApiClient = ReturnType<typeof createApiClient>

/**
 * Create a raw API Client given multiple optional parameters. A baseURL is always required.
 * @param clientParams - The parameters for the client
 * @returns An instance of the OneGrep API Client
 */
export function createApiClientFromParams(clientParams: {
  baseUrl: string
  apiKey?: string
  accessToken?: string
}) {
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

  const options: ZodiosOptions = {
    axiosConfig: {
      headers: headers
    }
  }
  console.debug(`Creating client pointing to ${baseUrl}`)

  return createApiClient(baseUrl, options) as OneGrepApiClient
}

/**
 * Create a raw API Client given the state of the environment.
 * @returns A client configured with the environment variables
 */
export function clientFromConfig(): OneGrepApiClient {
  const env = getEnv()

  if (!env.ONEGREP_API_KEY) {
    throw new Error('ONEGREP_API_KEY is not set')
  }

  const params = {
    apiKey: env.ONEGREP_API_KEY.toString(),
    baseUrl: env.ONEGREP_API_URL.toString()
  }

  console.debug(`Creating client pointing to ${params.baseUrl}`)

  return createApiClientFromParams(params)
}
