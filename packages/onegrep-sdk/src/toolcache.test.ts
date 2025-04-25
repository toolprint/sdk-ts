import { clientFromConfig } from './core/api/client.js'
import { UniversalToolCache } from './toolcache.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('UniversalToolCacheTests', () => {
  let tc: UniversalToolCache

  beforeEach(async () => {
    tc = new UniversalToolCache(clientFromConfig())
    console.log('toolcache created')
  })

  afterEach(async () => {
    console.log('toolcache teardown complete')
  })

  it('should refresh the tool cache', async () => {
    const refreshed = await tc.refresh()
    console.log('refreshed', refreshed)
    expect(refreshed).toBe(true)
  })

  it('should get metadata for all tools', async () => {
    const metadata = await tc.metadata()
    console.log('metadata', metadata)
    expect(metadata).toBeDefined()
    expect(metadata.size).toBeGreaterThan(0)
  })

  it('should get a tool', async () => {
    const toolMetadataMap = await tc.metadata()
    expect(toolMetadataMap.size).toBeGreaterThan(0)
    console.log(
      'tool names: ',
      Array.from(toolMetadataMap.values()).map((metadata) => metadata.name)
    )

    const toolMetadata = Array.from(toolMetadataMap.values()).find(
      (metadata) => metadata.name === 'web_search'
    )
    expect(toolMetadata).toBeDefined()
    if (!toolMetadata) {
      throw new Error('Tool not found')
    }

    const tool = await tc.get(toolMetadata.id)
    expect(tool).toBeDefined()
    console.log('tool', tool)
    if (!tool) {
      throw new Error('Tool not found')
    }
    expect(tool.metadata.name).toBe('web_search')
  })
})
