# typescript-sdk

[![Release](https://img.shields.io/github/v/release/OneGrep/typescript-sdk)](https://img.shields.io/github/v/release/OneGrep/typescript-sdk)
[![Build status](https://img.shields.io/github/actions/workflow/status/OneGrep/typescript-sdk/main.yml?branch=main)](https://github.com/OneGrep/typescript-sdk/actions/workflows/main.yml?query=branch%3Amain)
[![codecov](https://codecov.io/gh/OneGrep/typescript-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/OneGrep/typescript-sdk)
[![Commit activity](https://img.shields.io/github/commit-activity/m/OneGrep/typescript-sdk)](https://img.shields.io/github/commit-activity/m/OneGrep/typescript-sdk)
[![License](https://img.shields.io/github/license/OneGrep/typescript-sdk)](https://img.shields.io/github/license/OneGrep/typescript-sdk)

OneGrep TypeScript SDK

- **Github repository**: <https://github.com/onegrep/typescript-sdk/>
- **Documentation** <https://onegrep.github.io/typescript-sdk/>

## 🚀 Getting Started

TODO: add getting started

### Prerequisites

- [Just](https://just.systems/) command runner
- [Node.js](https://nodejs.org/) (v22 or higher)
- [PNPM](https://pnpm.io/) (v10 or higher)

### Installation

## Initial setup

Install the dependencies:

```shell
just install
```

Build the project:

```shell
# Using build cache
just build

# Without build cache
just rebuild
```

Run the tests:

```shell
just test
```

## Run an example Agent

In the examples directory, there is an example agent that uses the SDK and Blaxel to run a simple agent.

You'll need the Blaxel CLI and a free Blaxel account with some deployed MCP Servers before you can run the example locally.

Use the Blaxel Getting Started guide to install the Blaxel CLI and create a free account: <https://docs.blaxel.ai/Get-started>

Make sure `blaxel-search` is installed on your Blaxel account and the Blaxel CLI is logged in.

```shell
# Start the Agent locally
just bl-serve

# Open a terminal chat window with the Agent
just bl-chat
```

## Using the SDK

Add the SDK to your project:

```shell
npm add @onegrep/sdk
```

Export the following environment variables for your application:

```shell
export ONEGREP_API_KEY=<your-onegrep-api-key>
export ONEGREP_API_URL=<your-onegrep-api-url>
```

Import the SDK and create a toolbox somewhere it the boot-sequence of your application:

```typescript
import { getToolbox } from '@onegrep/sdk'

const toolbox = await getToolbox()

// Optionally, create a LangchainToolbox for use with LangGraph framework directly
import { createLangchainToolbox } from '@onegrep/sdk'
const langchainToolbox = await createLangchainToolbox(toolbox)
```

NOTE: It is recommended to create toolboxes as soon as possible in the boot-sequence of your application as a singleton and reuse it throughout your application. It will perform caching operations and manage connections to Tool Servers.

In your agent loop, you can use the toolbox to search for tools based on natural language queries, then bind it to the LangGraph agent:

```typescript
const searchResults: ScoredResult<StructuredTool>[] = await toolbox.search(
  'What is the weather in Tokyo?'
)

// Extract the tools from the search results
const tools = searchResults.map((result) => result.result)

const agent = await createReactAgent({
  llm: 'your-llm-model-of-choice',
  prompt: 'If the user ask for the weather, use the weather tool.',
  tools: tools
})
```

## 🛠 Tech Stack

- **Build System**: [Turborepo](https://turborepo.org/)
- **Package Manager**: [PNPM](https://pnpm.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundle**: [rollup](https://rollupjs.org/)
- **Task Runner**: [Just](https://just.systems/)

## 📦 Project Structure

This repository includes the following packages/apps:

Apps:

- `blaxel-langgraph-agent`: A simple LangGraph agent that uses the OneGrep SDK and Blaxel

Packages:

- `onegrep-sdk`: The SDK used by your agents
- `onegrep-api-client`: The generated OpenAPI client

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Husky](https://typicode.github.io/husky/#/) for git hooks

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

## 📚 Documentation

For more detailed documentation about each package, please refer to their respective README files:

- [OneGrep SDK](packages/onegrep-sdk/README.md)
- [OneGrep Gateway](apps/onegrep-gateway/README.md)
- [Blaxel LangGraph Agent](apps/blaxel-langgraph-agent/README.md)

## Additional Notes

- All packages in the repo that are part of a `pnpm pack` dependency chain must have a version (even if it's 0.0.0). [Related issue](https://github.com/pnpm/pnpm/issues/4164#issuecomment-1236762286)

## 📝 License

[MIT](LICENSE)
