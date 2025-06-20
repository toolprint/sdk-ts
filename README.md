<div align="center">
  <img src="assets/onegrep.png" alt="Toolprint Logo" width="200"/>

# Build AI Agents That Think Like Experts

[![Release](https://img.shields.io/github/v/release/toolprint/sdk-ts)](https://github.com/toolprint/sdk-ts/releases/latest)
[![PNPM](https://img.shields.io/badge/pnpm-v10.4.1-orange)](https://pnpm.io)
[![Node](https://img.shields.io/badge/node-%3E%3D22.14.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Use human-like instructions ("Toolprints") to guide agents in picking the right tools like an expert, secure by default.**

[🚀 Get Started](#-get-started-in-60-seconds-in-cursor) | [🛠️ What are Toolprints?](#-what-are-toolprints-your-agents-reusable-brain) | [📖 SDK Docs](packages/toolprint-sdk/docs/apiSpec.md) | [🤝 Join our Community](https://join.slack.com/t/toolprint-community/shared_invite/placeholder)

</div>

## 🚀 Get Started in 60 Seconds (in Cursor!)

Get from zero to a working, tool-enabled agent in your editor in under a minute.

#### Step 1: Install CLI & Create Your Free Account
```bash
brew install toolprint/tap/cli
toolprint # Follow prompts to create your free account & join the sandbox
```

#### Step 2: Connect to Cursor
Run the `toolprint` CLI and navigate to the `Connect` option to link with Cursor.

#### Step 3: Craft Your First Toolprint in Cursor!
Open Cursor and use the `@toolprint` agent to create your first blueprint.
```bash
@toolprint create 'find all recent github issues in the current repo and summarize their status'
```

That's it! You've just created a reusable blueprint for your agent.

## 🛠️ What are Toolprints? Your Agent's Reusable Brain

Forget brittle, hardcoded workflows. A **Toolprint** is a blueprint for tool usage—a declarative definition, crafted in natural language, that instructs your agent on how to achieve specific goals.

-   **✍️ Talk, Don't Code**: Your agent's new native language? English. Finally.
-   **⚡ Scripts are Brittle, Vibes are Forever**: Let your agent improvise when things go sideways.
-   **🔄 Craft Once, Sync Everywhere**: Create or edit a toolprint and the changes sync instantly across your team and agents.
-   **🔗 One Toolprint to Rule Them All**: Craft in Cursor, run in Claude, use in your SDK. It just works.

## ✨ Your Tool-Using Superpowers

Toolprints are just the start. The Toolprint platform gives you a suite of powerful features to manage and optimize your entire tool ecosystem.

#### 🔌 Universal Tool Connector
Connect tools from any provider, across multiple MCPs, all through one secure gateway. Stop wrestling with dozens of different APIs and authentication schemes.

#### 🧠 A System That Learns
Toolprint isn't static. It watches, learns, and gets smarter with every run. Our feedback loop analyzes agent performance to continuously improve tool selection, so your agents make better decisions tomorrow than they did today.

#### 🎯 Just Need Great Search? We Got You.
Even without using Toolprints, you can leverage our best-in-class semantic search. Point it at your tools, and get a powerful, natural language search interface to find the right tool for any job, instantly.

## 🧑‍💻 Beyond the Editor: Unleash Your Agent

#### Explore with the CLI
Ready to go deeper? Use the Toolprint CLI to explore the sandbox and connect your own tools.
```bash
# Explore all tools available in the sandbox
toolprint tools

# Start the local server to connect your own tools
toolprint mcp
```

#### Build with the SDK
For full control, use the TypeScript SDK to build standalone agents with Toolprint's selection capabilities.

**Install the SDK:**
```bash
pnpm add @toolprint/sdk
```

**Integrate with LangChain:**
```typescript
import { getToolbox } from '@toolprint/sdk'
import { createLangchainToolbox } from '@toolprint/sdk/extensions/langchain'

const toolbox = await getToolbox()
const langchainToolbox = await createLangchainToolbox(toolbox)

// Search for tools using natural language
const searchResults = await toolbox.search('Find recent news about AI developments')
const tools = searchResults.map((result) => result.result)

// Equip your LangChain agent with the best tools for the job
const agent = await createReactAgent({
  llm: new ChatOpenAI(),
  tools: tools,
  prompt: 'Use the most relevant tools to find and analyze AI news.'
})
```

## 🤝 Contributing

We welcome contributions! Please see our [development setup guide](#development-setup) and feel free to open a [feature request](https://github.com/toolprint/sdk-ts/issues/new?template=feature_request.yml) or [bug report](https://github.com/toolprint/sdk-ts/issues/new?template=bug_report.yml).

### Development Setup
```bash
# Fork the repository & clone it
git clone https://github.com/toolprint/sdk-ts.git
cd sdk-ts

# Install dependencies & build
just install
just build
```

## 🔧 Community & Help

-   **Join our Community**: For questions, discussions, and help, join our [Community on Slack](https://join.slack.com/t/toolprint-community/shared_invite/placeholder).
-   **Open an Issue**: Found a bug or have an idea? [Open an Issue](https://github.com/toolprint/sdk-ts/issues) on GitHub.
-   **Troubleshooting**: Common issues like authentication errors can often be resolved by running `toolprint account` to verify your API key and URL.

## 📝 License

[MIT](LICENSE)
