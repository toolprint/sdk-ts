import { clientFromConfig } from './core/api/client.js'
import { UniversalToolCache } from './toolcache.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ToolServerConnectionManager } from './connection.js'
import { SecretManager } from './secrets/types.js'

class MockSecretManager implements SecretManager {
  private secrets: Map<string, string>

  constructor() {
    this.secrets = new Map()
  }

  async getSecret(secretName: string): Promise<string> {
    return this.secrets.get(secretName) ?? ''
  }

  async getSecretNames(): Promise<string[]> {
    return ['test-secret']
  }
}

describe.skip('UniversalToolCacheTests', () => {
  let tc: UniversalToolCache
  let secretManager: SecretManager

  beforeEach(async () => {
    secretManager = new MockSecretManager()
    tc = new UniversalToolCache(
      clientFromConfig(),
      new ToolServerConnectionManager()
    )
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

  it('should refresh a tool', async () => {
    const tools = await tc.listTools()
    const tool = Array.from(tools.values())[0]

    console.log('tool', tool)
    expect(tool).toBeDefined()
    await tc.refreshTool(tool.id)
    const refreshedTool = await tc.get(tool.id)
    console.log('refreshedTool', refreshedTool)
    expect(refreshedTool).toBeDefined()
    expect(refreshedTool.id).toBe(tool.id)
  })

  // it('should get metadata for all tools', async () => {
  //   const metadata = await tc.getToolMetadata()
  //   console.log('metadata', metadata)
  //   expect(metadata).toBeDefined()
  //   expect(metadata.size).toBeGreaterThan(0)
  // })

  // it('should get a tool', async () => {
  //   const integrationNames = await tc.listIntegrations()
  //   console.log('integration names', integrationNames)
  //   expect(integrationNames.length).toBeGreaterThan(0)

  //   const toolDetailsMap = await tc.filterTools({
  //     integrationNames: [integrationNames[0]]
  //   })
  //   expect(toolDetailsMap.size).toBeGreaterThan(0)
  //   console.log(
  //     'tool names: ',
  //     Array.from(toolDetailsMap.values()).map((metadata) => metadata.name)
  //   )

  //   // const toolMetadata = Array.from(toolDetailsMap.values()).find(
  //   //   (metadata) => metadata.name === 'web_search'
  //   // )
  //   // expect(toolMetadata).toBeDefined()
  //   // if (!toolMetadata) {
  //   //   throw new Error('Tool not found')
  //   // }

  //   // const tool = await tc.get(toolMetadata.id)
  //   // expect(tool).toBeDefined()
  //   // console.log('tool', tool)
  //   // if (!tool) {
  //   //   throw new Error('Tool not found')
  //   // }
  //   // expect(tool.metadata.name).toBe('web_search')
  // })

  // it('should get a tool for a web search', async () => {
  //   const integrationNames = await tc.listIntegrations()
  //   console.log('integration names', integrationNames)
  //   expect(integrationNames.length).toBeGreaterThan(0)

  //   const toolDetailsMap = await tc.filterTools({
  //     integrationNames: [integrationNames[0]]
  //   })
  //   expect(toolDetailsMap.size).toBeGreaterThan(0)
  //   console.log(
  //     'tool names: ',
  //     Array.from(toolDetailsMap.values()).map((metadata) => metadata.name)
  //   )

  //   const toolMetadata = Array.from(toolDetailsMap.values()).find(
  //     (metadata) => metadata.name === 'web_search'
  //   )
  //   expect(toolMetadata).toBeDefined()
  //   if (!toolMetadata) {
  //     throw new Error('Tool not found')
  //   }

  //   const tool = await tc.get(toolMetadata.id)
  //   expect(tool).toBeDefined()
  //   console.log('tool', tool)
  //   if (!tool) {
  //     throw new Error('Tool not found')
  //   }
  //   expect(tool.metadata.name).toBe('web_search')
  // })
})
