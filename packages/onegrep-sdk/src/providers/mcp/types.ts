import { z } from 'zod'

const McpToolCallInput = z.object({
  toolName: z.string(),
  toolArgs: z.record(z.string(), z.any())
})

export type McpToolCallInput = z.infer<typeof McpToolCallInput>

export class McpToolCallError extends Error {
  input: McpToolCallInput
  constructor(
    input: McpToolCallInput,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'McpToolCallError'
    this.input = input

    Object.setPrototypeOf(this, McpToolCallError.prototype)
  }
}
