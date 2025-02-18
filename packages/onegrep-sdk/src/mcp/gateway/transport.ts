import { FetchLikeInit } from 'eventsource'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { RemoteClientConfig } from './types.js'
import { getEnv } from '@repo/utils'

export const createClientTransport = (
  remoteClientConfig: RemoteClientConfig
) => {
  const env = getEnv() // TODO: inject?

  const url = remoteClientConfig.endpoint
  if (!url) {
    throw new Error('Endpoint is undefined')
  }
  const headers = remoteClientConfig.required_headers || {}
  headers['X-ONEGREP-API-KEY'] = env.ONEGREP_API_KEY // TODO: get api key from env

  const fetchLikeWithHeaders = (url: string | URL, init?: FetchLikeInit) => {
    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        ...headers
      }
    })
  }

  const eventSourceInit = {
    withCredentials: false,
    fetch: fetchLikeWithHeaders
  }
  const requestInit = {
    headers: {
      ...headers
    }
  }
  const sse_opts = {
    eventSourceInit: eventSourceInit,
    requestInit: requestInit
  }

  return new SSEClientTransport(new URL(url), sse_opts)
}
