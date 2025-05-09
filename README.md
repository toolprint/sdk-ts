<div align="center">
  <img src="assets/onegrep.png" alt="OneGrep Logo" width="200"/>

# OneGrep TypeScript SDK

[![Release](https://img.shields.io/github/v/release/OneGrep/typescript-sdk)](https://github.com/OneGrep/typescript-sdk/releases/latest)
[![PNPM](https://img.shields.io/badge/pnpm-v10.4.1-orange)](https://pnpm.io)
[![Node](https://img.shields.io/badge/node-%3E%3D22.14.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Build agents that pick tools like experts, secure by default**

_Import a single SDK to power your agents with semantic tool search, trainable contexts, and feedback-driven selection that gets smarter over time. Access tools from any provider through a unified API with configurable security policies and guardrails._

[Documentation](packages/onegrep-sdk/docs/apiSpec.md) |
[API Reference](packages/onegrep-sdk/docs/apiSpec.md#api-methods) |
[Getting Started](#getting-started) |
[Join our Community](https://join.slack.com/t/onegrep-community/shared_invite/placeholder)

</div>

## 📚 Table of Contents

- [✨ Features](#-features)
- [🚀 Getting Started](#-getting-started)
- [🔗 Supported Providers](#-supported-providers)
- [📖 Next Steps](#-next-steps)
- [🤝 Contributing](#-contributing)
- [📝 License](#-license)

## ✨ Features

### 🎯 Intelligent Tool Selection

- **Semantic Search**: Find the right tools based on natural language descriptions and agent goals
- **Context Training**: Train custom tool contexts to improve selection accuracy for your specific use cases
- **Feedback Learning**: Selection gets smarter over time by learning from agent interactions and success patterns
- **Adaptive Ranking**: Tools are ranked based on historical performance and contextual relevance

### 🔌 Universal Connectivity

- **Multi-Provider Support**: Connect to any [supported provider](#supported-providers) through a single unified API
- **Type-Safe Integration**: Full TypeScript support with type definitions for all API operations
- **Simple Authentication**: Unified authentication handling across all providers
- **Provider Agnostic**: Write code once, switch providers anytime
- **OpenAPI Integration** `coming soon`: Register any OpenAPI server as a tool source automatically

### 🛡️ Security & Control

- **Guardrails & Access Control**: Configure tool execution rules and approval flows - from automatic execution to human-in-the-loop oversight
- **Audit Logging**: Comprehensive logging of all tool selections and executions
- **Network Security**: Secure HTTPS connections with JWT and API key-based authentication schemes

## 🚀 Getting Started

### Join the Sandbox

1. **Request Access**

   - Visit [onegrep.dev](https://www.onegrep.dev/) to join the waitlist
   - You'll receive an invite to the OneGrep sandbox environment

2. **Install the CLI**

```bash
# Install the OneGrep CLI
npx -y @onegrep/cli

# Create your account
npx @onegrep/cli account
# Select "Create Account" when prompted
```

### Sandbox Environment

The OneGrep sandbox comes pre-configured with:

- A collection of popular AI tools across different categories (chat, search, code analysis, etc.)
- Example tool contexts trained for common agent scenarios
- Pre-configured security policies and guardrails
- Sample agent implementations using different frameworks

### Exploring the Sandbox

Let's try out some common workflows using the CLI:

#### 1. Search for Tools

Find tools that match your agent's goals using natural language:

```bash
# Start the CLI tool explorer
npx @onegrep/cli tools

# Select "search" from the menu
# Enter your query when prompted:
"I want to be able to find recent issues in the MCP repository and what the web says about how to fix them"

# The CLI will return ranked tools matching your query
```

#### 2. Execute Tools

Try out tools directly from the CLI:

```bash
# Start the CLI tool explorer
npx @onegrep/cli tools

# Select "Explore integrations"
# Select "exa" from the list
# Enter your query when prompted:
"what are the recent developments in MCP"

# The tool will execute and return results
```

#### 3. Train Tool Context

Improve tool selection by adding custom context:

```bash
# Start the CLI tool explorer
npx @onegrep/cli tools

# Select "Explore integrations"
# Select any tool
# Choose "Add property"
# Create a new property (e.g., "use_case")
# Add a value (e.g., "mcp monitoring")

# Now search again:
npx @onegrep/cli tools
# Select "search"
# Try a query related to your tag:
"I need to monitor MCP status"

# Your trained tool should appear at the top of the results
```

### Using the SDK

Once you have sandbox access, install the SDK:

```bash
# Install using PNPM
pnpm add @onegrep/sdk
```

Set up your environment:

```bash
# Get your API key from the CLI
npx @onegrep/cli account
# Select "Show authentication status"
# Your API key will be displayed

# Set the API key in your environment
export ONEGREP_API_KEY="your_sandbox_api_key"
# Set the URL to your onegrep deployment (or the public sandbox)
export ONEGREP_API_URL="https://test-sandbox.onegrep.dev"
```

#### Run an Agent

Let's start with a complete example of running an agent that uses OneGrep for dynamic tool selection. This example uses LangChain for the agent loop and Blaxel for managing the agent runtime.

First, install the Just command runner:

```bash
brew install just
just install
just build
```

Then run the example agent:

```bash
# Terminal 1: Start the agent server
just bl-serve

# Terminal 2: Open a chat session with the agent
just bl-chat
```

This will start a local agent that:

- Uses OneGrep SDK for intelligent tool selection
- Implements a ReAct agent loop with LangChain
- Runs in a secure Blaxel runtime environment

#### LangChain Integration

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

// Tools are now available to your agent with proper typing and validation
const result = await agent.invoke({
  input: "What's the latest news about LangChain?"
})
```

For more examples and detailed API documentation, check out our [Documentation](packages/onegrep-sdk/docs/apiSpec.md).

## 🔗 Supported Providers

OneGrep integrates with the following tool providers:

### [Blaxel](https://blaxel.ai)

The AI-first tool hosting platform with built-in security and scalability. Blaxel provides a wide range of pre-built tools and supports custom tool deployment.

### [Smithery](https://smithery.dev)

A modern tool hosting platform focused on developer experience and enterprise features. Smithery offers extensive tool management capabilities and robust security controls.

> Want to add support for your tool hosting platform? Please reach out to us at support@onegrep.dev or [Create a Provider Support Request](https://github.com/OneGrep/typescript-sdk/issues/new?template=feature_request.yml&title=[Provider]%3A+Add+support+for+)!

## 📖 Next Steps

Ready to explore more advanced capabilities? Check out our [API Reference](packages/onegrep-sdk/docs/apiSpec.md#api-methods) to learn about:

- Advanced filtering and search options
- Custom tool context training
- Batch operations and error handling
- Security policy configuration
- And more!

## 🤝 Contributing

We welcome contributions to the OneGrep TypeScript SDK! Here's how you can help:

### Development Setup

```bash
# Fork the repository & clone it
git clone https://github.com/OneGrep/typescript-sdk.git
cd typescript-sdk

# Install dependencies & build
just install
just build
```

### Making Changes

1. Create an issue first to discuss the change
2. Fork the repository
3. Create a feature branch referencing the issue (`git checkout -b issue-123/amazing-feature`)
4. Make your changes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin issue-123/amazing-feature`)
7. Open a Pull Request with:
   - Title: `[Issue-123] Add amazing feature`
   - Description: Include "Fixes #123" or "Resolves #123" to link the issue

### Feature Requests

Have an idea for a new feature? [Create a Feature Request](https://github.com/OneGrep/typescript-sdk/issues/new?template=feature_request.yml) using one of these types:

- General SDK Enhancement
- New Runtime Support
- New Provider Support

The template will guide you through providing:

1. Feature type selection
2. Use case description
3. Proposed solution with example code
4. Alternative approaches considered

### Bug Reports

Found a bug? [Create a Bug Report](https://github.com/OneGrep/typescript-sdk/issues/new?template=bug_report.yml) with:

**Required Information:**

- Bug severity (Critical/Minor)
- Affected providers and runtimes
- Clear description and reproduction steps
- Code example
- Environment details

The template will guide you through providing all necessary information to help us resolve the issue quickly.

## 🔧 Troubleshooting

### Common Issues

#### Authentication Errors

```bash
Error: Failed to authenticate with OneGrep API
```

- Ensure `ONEGREP_API_KEY` is set in your environment
- Verify your API key is valid by running `npx @onegrep/cli account`
- Check if your API URL is correct (`ONEGREP_API_URL`)

#### Tool Not Found

```typescript
Error: Web search tool not found
```

- Confirm you have access to the required provider (Blaxel/Smithery)
- Check if the tool name matches exactly
- Try listing available tools: `await toolbox.listTools()`

#### Tool Execution Failures

```typescript
Error: Tool execution failed: Invalid input
```

- Verify input matches the tool's schema
- Check network connectivity to the tool provider
- Ensure you have necessary permissions

### Getting Help

- Join our [Community Slack](https://join.slack.com/t/onegrep-community/shared_invite/placeholder)
- Open an [Issue](https://github.com/OneGrep/typescript-sdk/issues)
- Check our [API Reference](packages/onegrep-sdk/docs/apiSpec.md) for detailed documentation

## 📝 License

[MIT](LICENSE)
