import { Ajv } from 'ajv'
import { JsonSchema, EquippedTool } from '~/types.js'
import {
  jsonSchemaToZod,
  JsonSchema as ToZodJsonSchema
} from '@onegrep/json-schema-to-zod'
import { log } from '@repo/utils'
import { v5 as uuidv5 } from 'uuid'

const TOOL_SCHEMA_NAMESPACE = uuidv5('onegrep-sdk-tool-schemas', uuidv5.DNS)
const INPUT_SCHEMA_NAMESPACE = uuidv5('input', TOOL_SCHEMA_NAMESPACE)
// const OUTPUT_SCHEMA_NAMESPACE = uuidv5('output', TOOL_SCHEMA_NAMESPACE)

function schemaIdForTool(toolId: string, namespace: string) {
  return uuidv5(toolId, namespace)
}

function toZodAdapter(jsonSchema: JsonSchema): ToZodJsonSchema {
  // If the jsonSchema is a boolean, return it as-is
  if (typeof jsonSchema === 'boolean') {
    return jsonSchema
  }

  // Remove the "$defs" from the jsonSchema (excessive complexity and unused)
  const { $defs, ...rest } = jsonSchema
  return {
    type: 'object',
    properties: rest.properties,
    required: rest.required
  }
}

function schemaIdsForTool(tool: EquippedTool): Record<string, JsonSchema> {
  const schemas: Record<string, JsonSchema> = {}
  if (tool.details.inputSchema) {
    const inputId = schemaIdForTool(tool.details.id, INPUT_SCHEMA_NAMESPACE)
    schemas[inputId] = tool.details.inputSchema
  }
  // if (tool.metadata.outputSchema) {
  //   const outputId = schemaIdForTool(tool.metadata.id, OUTPUT_SCHEMA_NAMESPACE)
  //   schemas[outputId] = tool.metadata.outputSchema
  // }
  return schemas
}

class ToolValidator {
  private _ajv: Ajv
  private _toolId: string

  constructor(ajv: Ajv, toolId: string) {
    this._ajv = ajv
    this._toolId = toolId
  }

  validateInputData(data: any) {
    const validate = this._ajv.getSchema(
      schemaIdForTool(this._toolId, INPUT_SCHEMA_NAMESPACE)
    )
    if (!validate) {
      throw new Error(`Tool ${this._toolId} has no input schema`)
    }
    return validate(data)
  }

  // validateOutputData(data: any) {
  //   const validate = this._ajv.getSchema(
  //     schemaIdForTool(this._toolId, OUTPUT_SCHEMA_NAMESPACE)
  //   )
  //   if (!validate) {
  //     throw new Error(`Tool ${this._toolId} has no output schema`)
  //   }
  //   return validate(data)
  // }
}

/**
 * Utilities for working with JSON schemas
 *
 * MCP uses JSON Schema to define input for tools and is used as part of the OpenAPI spec,
 * therefore it's a decent choice for schema validation. However, it defines the restrictions
 * on the data, rather than the shape of the data, so it's not as good for code-generation.
 * Ajv also supports [JTD](https://jsontypedef.com/), but it's not as well-supported in
 * other languages.  Ajv supports a JTD distribution for TypeScript, for parsing and validating,
 * but it's not in the main distribution.
 *
 * See Ajv docs for more information on JSON Schema vs. JTD and why there are different exports:
 * https://ajv.js.org/guide/schema-language.html
 */
class JsonSchemaUtils {
  private _ajv: Ajv
  private _toolValidators: Record<string, ToolValidator>

  constructor(ajv?: Ajv) {
    this._ajv = ajv ?? new Ajv()
    this._toolValidators = {}
  }

  validateJsonSchema(schema: JsonSchema) {
    return this._ajv.validateSchema(schema)
  }

  getValidator(schema: JsonSchema) {
    return this._ajv.compile(schema)
  }

  registerTool(tool: EquippedTool) {
    const schemas = schemaIdsForTool(tool)
    for (const [id, schema] of Object.entries(schemas)) {
      if (!this.validateJsonSchema(schema)) {
        log.error(`Tool ${tool.details.id} has invalid JSON schemas`)
        throw new Error(`Tool ${tool.details.id} has invalid JSON schemas`)
      }
      this._ajv.addSchema(schema, id)
    }
    this._toolValidators[tool.details.id] = new ToolValidator(
      this._ajv,
      tool.details.id
    )
    log.info(`Registered tool ${tool.details.id}`)
  }

  getToolValidator(tool: EquippedTool) {
    return this._toolValidators[tool.details.id]
  }

  toZodType(schema: JsonSchema) {
    return jsonSchemaToZod(toZodAdapter(schema))
  }
}

export const jsonSchemaUtils = new JsonSchemaUtils()
