import { describe, it, expect, beforeEach } from 'vitest'
import {
  AndFilter,
  ServerNameFilter,
  ToolNameFilter,
  Toolbox,
  createToolbox,
  getToolbox
} from './toolbox.js'
import { ToolResource } from './resource.js'

describe('Toolbox Tests', () => {
  let toolbox: Toolbox

  beforeEach(async () => {
    toolbox = await getToolbox()
  })

  it('should get all tool resources', async () => {
    const toolResources: ToolResource[] = await toolbox.getToolResources()
    expect(toolResources.length).toBeGreaterThan(0)
  })

  it('should be able to make a tool call', async () => {
    const metaServerName = toolbox.metaServerClient.name
    const statusNamespaceFilter = AndFilter(
      ServerNameFilter(metaServerName),
      ToolNameFilter('status_namespace')
    )
    const statusNamespaceResource = await toolbox.matchUniqueToolResource(
      statusNamespaceFilter
    )

    const args = {}
    const result = await statusNamespaceResource.callTool(args)
    expect(result.isError).toBe(false)
    expect(result.content.length).toBeGreaterThan(0)
    const content = result.content[0]
    if (!content) {
      throw new Error('No content returned')
    }
    expect(content.type).toBe('text')
    expect(content.text).toBeDefined()
    expect(content.text).toEqual("{'conditions': None, 'phase': 'Active'}")
  })
})
