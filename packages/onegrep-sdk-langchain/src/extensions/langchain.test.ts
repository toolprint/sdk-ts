import { describe, it, expect, beforeEach } from 'vitest'
import { createLangchainToolbox, LangchainToolbox } from './langchain'
import { StructuredTool } from '@langchain/core/tools'
import { RemoteClientConfig } from '@repo/onegrep-sdk'
import { clientFromConfig } from '@repo/onegrep-api-client'
import { createToolbox } from '@repo/onegrep-sdk'

describe('Toolbox Tests', () => {
  let langchainToolbox: LangchainToolbox

  beforeEach(async () => {
    const apiClient = clientFromConfig()
    const toolbox = await createToolbox(apiClient)
    langchainToolbox = await createLangchainToolbox(toolbox) // Initialize toolbox before each test
  })

  it('should get all tool resources', async () => {
    const tools: StructuredTool[] = await langchainToolbox.getAllTools()
    expect(tools.length).toBeGreaterThan(0)
  })

  it('should be able to make a tool call', async () => {
    const tools: StructuredTool[] = await langchainToolbox.getAllTools()
    console.log(tools.map((tool) => tool.name))
    const clientConfigTool = tools.find(
      (tool) => tool.name === 'client_config_meta_server'
    )
    if (!clientConfigTool) {
      throw new Error('client_config_meta_server tool not found')
    }

    const args = {}
    const response = await clientConfigTool.invoke(args)
    expect(response).toBeDefined()
    expect(response).toBeTypeOf('object')
    expect(response.length).toBeGreaterThan(0)

    // TODO: check output schema
    const toolOutput = response[0] as RemoteClientConfig
    console.log(toolOutput)
  })
})
