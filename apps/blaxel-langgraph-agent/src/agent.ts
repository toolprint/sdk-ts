import { blModel } from '@blaxel/sdk'
import { HumanMessage } from '@langchain/core/messages'
import { StructuredTool } from '@langchain/core/tools'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { LangchainToolbox, ScoredResult } from '@onegrep/sdk'

interface Stream {
  write: (data: string) => void
  end: () => void
}

export default async function agent(
  toolbox: LangchainToolbox,
  input: string,
  stream: Stream
): Promise<void> {
  // Search for tools that match the input
  const searchResults: ScoredResult<StructuredTool>[] =
    await toolbox.search(input)

  // Convert the search results to Langchain StructuredTools
  const structuredTools = searchResults.map((result) => result.result)

  const streamResponse = await createReactAgent({
    llm: await blModel('sandbox-openai').ToLangChain(),
    prompt: 'If the user ask for the weather, use the weather tool.',
    tools: structuredTools
  }).stream({
    messages: [new HumanMessage(input)]
  })

  for await (const chunk of streamResponse) {
    if (chunk.agent)
      for (const message of chunk.agent.messages) {
        stream.write(message.content)
      }
  }
  stream.end()
}
