import { describe, it, expect, beforeEach } from 'vitest'
import { createLangchainToolbox, LangchainToolbox } from './langchain'
import { StructuredTool } from '@langchain/core/tools'
import { RemoteClientConfig } from 'onegrep-sdk'
import { createToolbox } from 'onegrep-sdk'
import { clientFromConfig } from 'onegrep-sdk'
import { log } from '@repo/utils'

describe('Toolbox Tests', () => {
  let langchainToolbox: LangchainToolbox

  beforeEach(async () => {
    const apiClient = clientFromConfig()
    const toolbox = await createToolbox(apiClient)
    langchainToolbox = await createLangchainToolbox(toolbox) // Initialize toolbox before each test
  })

  it('should get all tool resources', { timeout: 20000 }, async () => {
    const tools: StructuredTool[] = await langchainToolbox.getAllTools()
    expect(tools.length).toBeGreaterThan(0)
  })

  it('should be able to make a tool call', { timeout: 20000 }, async () => {
    const tools: StructuredTool[] = await langchainToolbox.getAllTools()
    log.info(tools.map((tool) => tool.name))
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
    log.info(toolOutput)
  })
})
