import { BaseToolPrinter } from './types.js'
import { OneGrepApiHighLevelClient } from './core/index.js'
import YAML from 'yaml'
import {
  RegisteredToolprintReadable,
  ToolprintInput
} from '../../toolprint-api-client/dist/types/src/index.js'

class ToolprintValidationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'ToolprintValidationError'
  }
}

class ToolprintRegistrationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'ToolprintRegistrationError'
  }
}

export class ToolPrinter implements BaseToolPrinter {
  constructor(private readonly client: OneGrepApiHighLevelClient) { }

  async validate(
    content: string,
    format: 'json' | 'yaml'
  ): Promise<ToolprintInput> {
    // ! TODO: validation in API should return Toolprint object parsed and validated
    if (format === 'json') {
      const parsed = JSON.parse(content)
      const isValid = await this.client.validateToolprintInJson(
        JSON.stringify(parsed)
      )
      if (!isValid) {
        throw new ToolprintValidationError(
          'Invalid Toolprint',
          new Error('Validation failures: ' + JSON.stringify(isValid)) // TODO: return validation errors from API
        )
      }
      return parsed as ToolprintInput
    } else if (format === 'yaml') {
      const parsed = YAML.parse(content)
      const isValid = await this.client.validateToolprintInYaml(
        YAML.stringify(parsed)
      )
      if (!isValid) {
        throw new ToolprintValidationError(
          'Invalid Toolprint',
          new Error('Validation failures: ' + JSON.stringify(isValid)) // TODO: return validation errors from API
        )
      }
      return parsed as ToolprintInput
    } else {
      throw new ToolprintValidationError('Invalid format: ' + format)
    }
  }

  async register(
    toolprint: ToolprintInput
  ): Promise<RegisteredToolprintReadable> {
    try {
      return await this.client.newToolprint(toolprint)
    } catch (error) {
      throw new ToolprintRegistrationError(
        'Failed to register Toolprint',
        error
      )
    }
  }
}
