import {
  type ZodiosOptions,
  type ZodiosInstance,
  type ApiOf
} from '@zodios/core'

import { createApiClient, api } from '@repo/onegrep-api-client'
import { getEnv, sdkApiSchema } from '@repo/utils'

import { log } from '../log.js'

// Use the default Zodios to re-export the type as our own type
export type OneGrepApiClient = ZodiosInstance<ApiOf<typeof api>>

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

  const options: ZodiosOptions = {
    axiosConfig: {
      headers: headers
    }
  }
  log.debug(`Creating client pointing to ${baseUrl}`)

  try {
    return createApiClient(baseUrl, options) as OneGrepApiClient
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
