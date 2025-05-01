import {
  FetchLikeInit,
  EventSourceInit,
  FetchLike,
  FetchLikeResponse
} from 'eventsource'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

import { RemoteClientConfig } from '~/core/index.js'

import { log } from '@repo/utils'

// Get an SSE transport for a remote client
export const createSSEClientTransport = (
  clientConfig: RemoteClientConfig,
  apiKey: string | undefined,
  ignoreReadyCheck: boolean
) => {
  // Check if the client config reports server as ready
  if (!clientConfig.ready) {
    if (!ignoreReadyCheck) {
      throw new Error(`Server ${clientConfig.name} is not ready`)
    } else {
      log.warn(`Server ${clientConfig.name} reporting as not ready`)
    }
  }

  const url = clientConfig.endpoint
  if (!url) {
    throw new Error('Endpoint is undefined')
  }
  const headers = clientConfig.required_headers || {}
  if (apiKey) {
    log.debug(`Adding api key to headers`)
    headers['X-ONEGREP-API-KEY'] = apiKey
  }

  log.debug(`SSE headers: ${Object.keys(headers).join(', ')}`)

  const fetchLikeWithHeaders: FetchLike = async (
    url: string | URL,
    init?: FetchLikeInit
  ) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        ...headers
      }
    })
    return response as FetchLikeResponse
  }

  const eventSourceInit: EventSourceInit = {
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

  const transport = new SSEClientTransport(new URL(url), sse_opts)

  transport.onclose = () => {
    log.debug(`SSE transport closed`)
  }

  transport.onerror = (error) => {
    log.error(`SSE transport error: ${error}`)
  }

  transport.onmessage = (_message) => {
    log.debug(`SSE transport message`)
  }

  return transport
}
