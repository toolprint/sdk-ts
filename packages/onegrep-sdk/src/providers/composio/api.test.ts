import { Composio } from 'composio-core'
import { describe, expect, it } from 'vitest'

describe('composio', () => {
  it('should create a composio instance', async () => {
    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      baseUrl: 'https://backend.composio.dev'
    })
    expect(composio).toBeDefined()
  })
})
