import {
  FetchLikeInit,
  EventSourceInit,
  FetchLike,
  FetchLikeResponse
} from 'eventsource'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

import { log } from '~/core/log.js'

// Get an SSE transport for the OneGrep Gateway
export const createGatewaySSETransport = (
  url: URL,
  additionalHeaders?: Record<string, string>,
  apiKey?: string
) => {
  const headers = additionalHeaders || {}
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

  const transport = new SSEClientTransport(url, sse_opts)

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
