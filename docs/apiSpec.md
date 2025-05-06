# OneGrep SDK API Reference

## Table of Contents

- [Authentication](#authentication)
- [Core Concepts](#core-concepts)
  - [Creating a Toolbox](#creating-a-toolbox)
  - [Key Concepts](#key-concepts)
  - [Tool Selection & Execution](#tool-selection--execution-steps-simplest-example)
- [API Methods](#api-methods)
  - [Tool Discovery Methods](#tool-discovery-methods)
  - [Tool Equip Methods](#tool-equip-methods)
  - [Resource Management Methods](#resource-management-methods)
- [Agent Runtime Integration](#agent-runtime-integration)
  - [LangChain](#langchain)
  - [CrewAI](#crewai)
  - [OpenAI Assistants](#openai-assistants)
  - [Anthropic Claude](#anthropic-claude)

## Authentication

The SDK uses environment variables for configuration. Set these before using the SDK:

```bash
# Required: Your OneGrep API key and an API URL for your deployment.
export ONEGREP_API_KEY="your_api_key"
export ONEGREP_API_URL="https://test-sandbox.onegrep.dev"
```

That's it! The `getToolbox()` function will automatically use these environment variables to configure the SDK.

## Core Concepts

The OneGrep SDK is centered around the `Toolbox` class, which provides methods for searching for and selecting tools.

### Creating a Toolbox

```typescript
import { getToolbox } from '@onegrep/sdk'

// Create a toolbox with default configuration
const toolbox = await getToolbox()
```

That's all you need to do! The toolbox will automatically:

- Set up the API client with your environment configuration
- Initialize the tool cache
- Handle secret management

## Key Concepts

### Tools, Integrations, and Providers

OneGrep organizes tools in a hierarchical structure:

#### Tools

Individual functions or capabilities that your agent can use. Each tool has:

- A unique identifier
- Input/output specifications
- Guardrails in the form of Policies

#### Integrations

Collections of related tools that work together. For example:

- GitHub Integration: Issues, PRs, and repository management tools
- Trello Integration: Board, list, and card management tools
- Slack Integration: Message, channel, and user management tools

#### Providers

Platforms that host and serve tools:

- [Blaxel](https://blaxel.ai): AI-first tool hosting platform
- [Smithery](https://smithery.dev): Enterprise tool management platform

Each provider can host multiple integrations, and each integration can contain multiple tools.

### Tool Selection & Execution Steps (Simplest Example)

1. Search or list available tools

```typescript
const searchPrompt = 'Find weather information for a city'
const searchResults = await toolbox.search(searchPrompt)
console.log('Ranked tools:', searchResults.map(r => `${r.result.name)} | Score: ${r.score}`)
```

2. "Equip" the selected tools (which will create connections to the underlying provider)

```typescript
const tools = searchResults.map((r) => await r.result.equip())
```

3. Bind tools to an LLM instance in your agent

## API Methods

### Tool Discovery Methods

| Method                                 | Description                                                                                                   | Return Type                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `search(query: string)`                | Search for tools using natural language queries. Returns ranked results based on relevance to the query.      | `Promise<Array<ScoredResult<ToolDetails>>>` |
| `listTools()`                          | List all available tools across all integrations. Returns a map of tool IDs to their basic details.           | `Promise<Map<ToolId, BasicToolDetails>>`    |
| `listIntegrations()`                   | Get a list of all available tool integrations (e.g., "GitHub", "Trello", "Slack").                            | `Promise<string[]>`                         |
| `get(toolId: ToolId)`                  | Get comprehensive details about a specific tool, including its configuration, permissions, and usage metrics. | `Promise<ToolDetails>`                      |
| `filterTools(options?: FilterOptions)` | Filter tools based on criteria like integration name, permissions, or custom metadata.                        | `Promise<Map<ToolId, ToolDetails>>`         |

### Tool Equip Methods

Most toolbox operations will give you metadata around a tool in order to improve performance. When you decide that you want to use a tool, you **equip** the tool to spawn the connection to the provider.

```typescript
let tool: ToolDetails

// continuing from the previous example
tool = tools[0]

// Find a tool by a its tool id and then equip it
tool = await toolbox.get(toolId)

// Equip it to get a bindable and executable tool.
const equippedTool = await tool.equip()
```

### Tool Filtering Methods

| Method                                 | Description                             | Return Type                         |
| -------------------------------------- | --------------------------------------- | ----------------------------------- |
| `filterTools(options?: FilterOptions)` | Filter tools based on specific criteria | `Promise<Map<ToolId, ToolDetails>>` |

### Resource Management Methods

| Method      | Description                                             | Return Type        |
| ----------- | ------------------------------------------------------- | ------------------ |
| `refresh()` | Refresh the tool cache to ensure up-to-date information | `Promise<boolean>` |
| `close()`   | Clean up resources and close connections                | `Promise<void>`    |

#### Usage Examples

```typescript
// Refresh tool cache
const success = await toolbox.refresh()
if (!success) {
  console.error('Failed to refresh tool cache')
}

// Clean up resources
await toolbox.close()
```

## Agent Runtime Integration

A toolbox can be instantiated in the runtime integration of your choice. Below are the runtimes that we currently support.

Each runtime integration provides:

- Type-safe tool bindings
- Runtime-specific optimizations

> Want support for a different runtime? [Create a Runtime Support Request](https://github.com/OneGrep/typescript-sdk/issues/new?template=feature_request.yml&title=[Runtime]%3A+Add+support+for+) and select "New Runtime Support" as the feature type.

### LangChain

OneGrep seamlessly integrates with LangChain, providing type-safe tool bindings:

```typescript
import { getToolbox } from '@onegrep/sdk'
import { createLangchainToolbox } from '@onegrep/sdk/extensions/langchain'

// Initialize toolboxes
const toolbox = await getToolbox()
const langchainToolbox = await createLangchainToolbox(toolbox)

// Search for relevant tools based on your agent's goals
const searchResults = await toolbox.search(
  'Find recent news about AI developments'
)

// Tools are already structured for LangChain
const tools = searchResults.map((result) => result.result)

// Use in your LangChain agent
const agent = await createReactAgent({
  llm: new ChatOpenAI(),
  tools: tools,
  prompt: 'Use the most relevant tools to find and analyze AI news.'
})

const result = await agent.invoke({
  input: "What's the latest news about LangChain?"
})
```

### CrewAI

_Coming Soon_

### OpenAI Assistants

_Coming Soon_

### Anthropic Claude

_Coming Soon_

Want to add support for your tool hosting platform? [Create a Provider Support Request](https://github.com/OneGrep/typescript-sdk/issues/new?template=feature_request.yml&title=[Provider]%3A+Add+support+for+) and select "New Provider Support" as the feature type.

### [Blaxel](https://blaxel.ai)

The AI-first tool hosting platform with built-in security and scalability. Blaxel provides a wide range of pre-built tools and supports custom tool deployment.

### [Smithery](https://smithery.dev)

A modern tool hosting platform focused on developer experience and enterprise features. Smithery offers extensive tool management capabilities and robust security controls.

Want to add support for your tool hosting platform? [Create a Provider Support Request](https://github.com/OneGrep/typescript-sdk/issues/new?template=feature_request.yml&title=[Provider]%3A+Add+support+for+) and select "New Provider Support" as the feature type.
