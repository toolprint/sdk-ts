import { blModel } from '@blaxel/sdk'
import { HumanMessage } from '@langchain/core/messages'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { LangchainToolbox } from '@onegrep/sdk'

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
    llm: await blModel('sandbox-openai').ToLangChain(),
    prompt: 'If the user ask for the weather, use the weather tool.',
    tools: tools
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
