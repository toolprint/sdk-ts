<div align="center">
  <img src="../../assets/toolprint.png" alt="Toolprint Logo" width="200"/>

# Build AI Agents That Think Like Experts

[![Release](https://img.shields.io/github/v/release/toolprint/sdk-ts)](https://github.com/toolprint/sdk-ts/releases/latest)
[![PNPM](https://img.shields.io/badge/pnpm-v10.4.1-orange)](https://pnpm.io)
[![Node](https://img.shields.io/badge/node-%3E%3D22.14.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Use human-like instructions ("Toolprints") to guide agents in picking the right tools like an expert, secure by default.**

[🚀 Get Started](#-get-started-in-60-seconds-in-cursor) | [🛠️ What are Toolprints?](#-what-are-toolprints-your-agents-reusable-brain) | [📖 SDK Docs](docs/apiSpec.md)

</div>

## 🚀 Get Started in 60 Seconds (in Cursor!)

Get from zero to a working, tool-enabled agent in your editor in under a minute.

#### Step 1: Install the CLI & Create Your Account

```bash
brew install toolprint/tap/toolprint

# Follow prompts to create your free account & join the sandbox
toolprint
```

#### Step 2: Start the Toolprint Server

In your terminal, run the MCP server. This is the bridge that allows Toolprint to connect with your local tools and editor.

```bash
toolprint mcp
```

#### Step 3: Connect to Cursor

In a **new terminal**, run the `toolprint` CLI again and navigate to the `Connect` option to link with your editor.

#### Step 4: Craft Your First Toolprint!

You're all set. Go to Cursor and tag the `@toolprint` assistant to create your first blueprint.

```
@toolprint help me find the best tools to create linear tickets

@toolprint create a new workflow to find all the recent github issues in model context protocol and track them in linear
```

## 🛠️ What are Toolprints? Your Agent's Reusable Brain

Forget brittle, hardcoded workflows. A **Toolprint** is a blueprint for tool usage—a declarative definition, crafted in natural language, that instructs your agent on how to achieve specific goals.

- **✍️ Talk, Don't Code**: Your agent's new native language? English. Finally.
- **⚡ Scripts are Brittle, Vibes are Forever**: Let your agent improvise when things go sideways.
- **🔄 Craft Once, Sync Everywhere**: Create or edit a toolprint and the changes sync instantly across your team and agents.
- **🔗 One Toolprint to Rule Them All**: Craft in Cursor, run in Claude, use in your SDK. It just works.

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

For full control, use the TypeScript SDK to build standalone agents. Here's how easy it is to inject recommended tools and prompts from Toolprint into a LangChain agent.

**Install the SDK:**

```bash
pnpm add @toolprint/sdk
```

**Example: Tool & Prompt Injection**

```typescript
import { createLangchainToolbox, getToolbox } from '@toolprint/sdk'
import { createReactAgent, ChatOpenAI, HumanMessage } from '...' // Other LangChain imports

// 1. Initialize Toolprint
const toolbox = await createLangchainToolbox(await getToolbox())

const userMessage = 'Find recent news about AI developments and summarize them.'

// 2. Get tool & prompt recommendations from Toolprint
const recommendation = await toolbox.recommend(userMessage)

// 3. Inject recommended tools and prompts into your agent
const agent = await createReactAgent({
  llm: new ChatOpenAI(),
  tools: recommendation.tools // <-- Tool injection
})

const result = await agent.invoke({
  messages: [
    new HumanMessage(userMessage),
    ...recommendation.messages // <-- Prompt injection
  ]
})
```

For a complete, runnable example, check out the [LangChain Chat Agent README](../../apps/examples/langchain/chat-agent/README.md).

## 🗣️ Have an Idea? Let's Talk!

- **Got a Killer Feature Idea?**: We're all ears. [Open a feature request](https://github.com/toolprint/sdk-ts/issues/new?template=feature_request.yml) and let's build the future of agents together.
- **Found a Gremlin?**: Bugs happen. [Report it here](https://github.com/toolprint/sdk-ts/issues/new?template=bug_report.yml) and we'll send out the exterminators.

## 🙏 Acknowledgements

A huge thank you to our partners at **[Blaxel](https://blaxel.ai)** for providing the MCPs and agent infrastructure that power our public sandbox.

## 📝 License

[MIT](LICENSE)
