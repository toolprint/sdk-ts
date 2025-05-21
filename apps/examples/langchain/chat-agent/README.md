# LangChain Chat Agent

A goal-oriented ReAct agent powered by LangChain and OneGrep SDK that dynamically discovers and executes tools based on intent extraction. The agent uses a ReAct (Reason + Act) loop to break down complex queries into actionable steps, intelligently selecting the most relevant tools from OneGrep's toolbox for each sub-goal.

> This is an example project showcasing the OneGrep TypeScript SDK. For comprehensive documentation on the SDK, please refer to the [main project README](../../../README.md).

## Showcases

- Interactive command-line chat interface
- Dynamic tool discovery and selection
- Persistent chat history

## Prerequisites

- Node.js (Latest LTS version recommended)
- OneGrep SDK access and configuration
  - Follow the [Getting Started guide](../../../README.md#-getting-started) to set up your OneGrep account and API key
  - Make sure to set the required environment variables:
    ```bash
    export ONEGREP_API_KEY="your_sandbox_api_key"
    export ONEGREP_API_URL="https://test-sandbox.onegrep.dev"
    ```
- OpenAI API key

  - Set your OpenAI API key:
    ```bash
    export OPENAI_API_KEY="your_openai_api_key"
    ```

- You can also add these environment variables to a `.env` file in this project.

## Installation

1. Clone the repository
2. Navigate to the project directory:

```bash
cd apps/examples/langchain/chat-agent
```

3. Install dependencies:

```bash
pnpm install
```

## Usage

```bash
pnpm run start
```

## How It Works

The chat agent combines several powerful technologies:

1. **Tool Discovery**: The agent uses OneGrep SDK to dynamically discover and select relevant tools based on user queries.

2. **LangChain Integration**: Utilizes LangChain's React agent for reasoning and action planning.

3. **Conversation Flow**:
   - User inputs a message
   - System extracts the intent/goal
   - Relevant tools are discovered
   - Agent processes the request using selected tools
   - Response is generated and displayed

## Code Structure

The main logic is in `src/index.ts`:

- `createAgent()`: Initializes a LangChain React agent with the specified tools
- `getAgentGoal()`: Extracts the intent from user messages
- `processMessage()`: Core function that handles message processing, tool selection, and response generation
- `start()`: Main entry point that sets up the chat loop and handles user interaction

## Key Dependencies

- `@langchain/core`, `@langchain/langgraph`, `@langchain/openai`: LangChain framework components
- `@onegrep/sdk`: OneGrep SDK for tool discovery and management

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

For more information about OneGrep SDK and its capabilities, check out:

- [Main Project Documentation](../../../README.md)
- [API Reference](../../../packages/onegrep-sdk/docs/apiSpec.md)
- [Getting Started Guide](../../../README.md#-getting-started)
