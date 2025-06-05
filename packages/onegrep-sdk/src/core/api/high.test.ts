import { describe, it, expect } from 'vitest'
import { OneGrepApiHighLevelClient } from './high.js'
import { clientFromConfig } from './client.js'
import { testLog } from '../../../test/log.test.js'
import {
  ToolprintInput,
  ToolprintMetaInput,
  ToolprintTool
} from '@onegrep/api-client'
import { OneGrepApiError } from './utils.js'

const log = testLog

describe('OneGrepApiHighLevelClient', () => {
  const client = new OneGrepApiHighLevelClient(clientFromConfig())

  describe('HighLevelClient .well-known endpoints', () => {
    it('should get toolprint JSON schema', async () => {
      const schema = await client.getToolprintJsonSchema()
      expect(schema).toBeDefined()
      expect(typeof schema).toBe('object')
      log.info('Retrieved toolprint schema:', schema)
    })

    it('HighLevelClient should retrieve toolprint template', async () => {
      const template = await client.getToolprintTemplate()
      expect(template).toBeDefined()
      expect(typeof template).toBe('string')
      expect(template.length).toBeGreaterThan(0)
      log.info('Retrieved toolprint template:', template)
    })
  })

  describe('HighLevelClient toolprint validation', () => {
    it('should show validation errors', async () => {
      const meta: ToolprintMetaInput = {
        name: 'test',
        resource_id: 'test',
        version: '1.0.0'
      }
      const tool: ToolprintTool = {
        ref: {
          name: 'test'
        },
        usage_hints: 'HINT'
      }
      const toolprintInput: ToolprintInput = {
        meta: meta,
        goal: 'test',
        instructions: 'test',
        tools: [tool]
      }

      await expect(
        client.newToolprint(toolprintInput as ToolprintInput)
      ).rejects.toThrow(OneGrepApiError)

      try {
        await client.newToolprint(toolprintInput as ToolprintInput)
      } catch (err) {
        expect(err).toBeInstanceOf(OneGrepApiError)
        const oneGrepError = err as OneGrepApiError
        expect(oneGrepError.data).toBeDefined()
        expect(oneGrepError.data).toBeTypeOf('object')
        log.info(
          'Validation error data:',
          JSON.stringify(oneGrepError.data, null, 2)
        )
        // You can add more specific assertions about the error data structure if you know what to expect
      }
    })
  })
})
