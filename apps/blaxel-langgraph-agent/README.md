# Blaxel LangGraph Agent

<p align="center">
  <img src="https://blaxel.ai/logo.png" alt="Blaxel"/>
</p>

A template implementation of a conversational agent using LangGraph and GPT-4. This agent demonstrates the power of LangGraph for building interactive AI agents with tool integration capabilities.

## Features

- Interactive conversational interface
- Tool integration support (including weather and search capabilities)
- Streaming responses for real-time interaction
- Built on LangGraph for efficient agent orchestration
- Easy deployment and integration with Blaxel platform

## Prerequisites

- **Node.js:** v18 or later.
- **[Blaxel CLI](https://docs.blaxel.ai/Get-started):** Ensure you have the Blaxel CLI installed. If not, install it globally:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/beamlit/toolkit/main/install.sh | BINDIR=$HOME/.local/bin sh
  ```
- **Blaxel login:** Login to Blaxel platform
  ```bash
  bl login YOUR-WORKSPACE
  ```

## Installation

**Clone the repository and install dependencies:**

```bash
git clone https://github.com/beamlit/template-langgraph-ts.git
cd template-langgraph-ts
uv sync
```

## Running the Server Locally

Start the development server with hot reloading:

```bash
bl serve --hotreload
```

_Note:_ This command starts the server and enables hot reload so that changes to the source code are automatically reflected.

## Testing your agent

You can test your agent using the chat interface:

```bash
bl chat --local blaxel-agent
```

Or run it directly with specific input:

```bash
bl run agent blaxel-agent --local --data '{"input": "What is the weather in Paris?"}'
```

## Deploying to Blaxel

When you are ready to deploy your application:

```bash
bl deploy
```

This command uses your code and the configuration files under the `.blaxel` directory to deploy your application.

## Project Structure

- **src/index.ts** - Application entry point
- **src/agent.ts** - Core agent implementation with LangGraph integration
- **blaxel.toml** - Blaxel deployment configuration

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
