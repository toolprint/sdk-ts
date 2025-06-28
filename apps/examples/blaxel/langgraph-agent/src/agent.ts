import { blModel } from '@blaxel/langgraph'
import { HumanMessage } from '@langchain/core/messages'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { LangchainToolbox } from '@toolprint/sdk'

interface Stream {
  write: (data: string) => void
  end: () => void
}

export default async function agent(
  toolbox: LangchainToolbox,
  input: string,
  stream: Stream
): Promise<void> {
  console.log('input', input)
  // Search for tools that match the input
  const searchResults = await toolbox.search(input)

  // Extract the tools from the search results
  const tools = searchResults.map((result) => result.result)

  // Use a type assertion at the point of use to handle version differences
  const streamResponse = await createReactAgent({
    llm: await blModel('sandbox-openai'),
    prompt: 'If the user ask for the weather, use the weather tool.',
    tools: tools
  }).stream({
    messages: [new HumanMessage(input)]
  })

  for await (const chunk of streamResponse) {
    if (chunk.agent && chunk.agent.messages) {
      // Handle both array and non-array message types
      const messages = Array.isArray(chunk.agent.messages)
        ? chunk.agent.messages
        : [chunk.agent.messages]

      for (const message of messages) {
        // Handle different message content types
        if (typeof message === 'string') {
          stream.write(message)
        } else if (message && typeof message === 'object') {
          // Extract content from LangChain message objects
          const content = (message as any).content || ''

          // Only write non-empty content
          if (content && content.trim()) {
            stream.write(content)
          }

          // For tool call messages, we can optionally add a note
          // but skip the complex metadata
        }
      }
    }
  }
  stream.end()
}
