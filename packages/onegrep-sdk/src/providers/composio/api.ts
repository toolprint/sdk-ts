import { Composio, ComposioToolSet } from 'composio-core'

export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY, // Required
  baseUrl: 'https://backend.composio.dev', // Optional, defaults to production URL
  runtime: 'nodejs', // Optional, helps with telemetry
  allowTracing: true // Optional, enables tracing
})

export const composioToolSet = new ComposioToolSet({
  apiKey: process.env.COMPOSIO_API_KEY,
  baseUrl: 'https://backend.composio.dev',
  runtime: 'nodejs',
  allowTracing: true
})
