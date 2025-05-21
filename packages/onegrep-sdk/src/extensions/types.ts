import { StructuredTool } from '@langchain/core/tools'
import { SystemMessage } from '@langchain/core/messages'

export interface StructuredToolsRecommendation {
  goal: string
  tools: StructuredTool[]
  messages: SystemMessage[]
}
