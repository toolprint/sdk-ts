import {
  createLangchainToolbox,
  getToolbox,
  LangchainToolbox
} from '@toolprint/sdk'
import { ChatOpenAI } from '@langchain/openai'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import {
  HumanMessage,
  AIMessage,
  BaseMessage,
  SystemMessage
} from '@langchain/core/messages'
import inquirer from 'inquirer'
import ora from 'ora'
import chalk from 'chalk'

const OPENAI_MODEL = 'gpt-4o-mini'

interface ChatPrompt {
  message: string
}

/**
 * Calculates the time taken to execute a function and returns the result and the time taken
 * @param fn - The function to wrap
 * @returns The result of the function and the time taken
 */
async function timeIt(fn: () => Promise<any>) {
  const tStart = Date.now()
  const result = await fn()
  const taken = Date.now() - tStart
  return { result, taken }
}

/**
 * Creates a Langchain agent with the given tools
 * @param tools - The tools to use in the agent
 * @returns The agent
 */
async function createAgent(tools: any[]) {
  const model = new ChatOpenAI({
    modelName: OPENAI_MODEL,
    streaming: false
  })

  // Create the React agent
  return createReactAgent({
    llm: model,
    tools
  })
}

/**
 * A simple reflection step to have an LLM understand the intent of the user's message
 * @param message - The user's message
 * @returns The intent of the user's message
 */
async function getAgentGoal(message: string) {
  const spinner = ora('Extracting goal...').start()
  // First, use a separate LLM call to understand the intent and search for relevant tools
  const intentModel = new ChatOpenAI({
    modelName: OPENAI_MODEL,
    streaming: false
  })

  const intentResult = await intentModel.invoke([
    new SystemMessage(
      `Summarize what the sub-goal is based on the user's request: ${message}`
    )
  ])

  spinner.succeed('Done')
  return intentResult.content
}

/**
 * Entrypoint to process any new message from the user
 * @param toolbox - The OneGrep toolbox
 * @param message - The user's message
 * @param chatHistory - The chat history
 */
async function processMessage(
  toolbox: LangchainToolbox,
  message: string,
  chatHistory: BaseMessage[] = []
): Promise<void> {
  try {
    // First, use a separate LLM call to understand the intent and search for relevant tools
    let spinner = ora('Extracting goal...').start()
    const { result: goal, taken: goalTaken } = await timeIt(() =>
      getAgentGoal(message)
    )
    const query = typeof goal === 'string' ? goal : message
    spinner.succeed(`Done ${chalk.gray(goalTaken)}ms`)

    spinner = ora('Searching for relevant tools...').start()

    // Option 1 - Get a more comprehensive recommendation with a rich instruction set as well as specifc tools
    const { result: recommendation, taken: searchTaken } = await timeIt(() =>
      toolbox.recommend(query)
    )
    const selectedTools = recommendation.tools
    const recommendationPrompts = recommendation.messages

    // Option 2 - Get a list of tools based on the goal
    // const searchResult = await toolbox.search(query)
    // const selectedTools = searchResult.map((r) => r.result)
    // console.debug(`Tools found: ${selectedTools.map((t) => t.name).join(', ')}`)

    spinner.succeed(`Done ${chalk.gray(searchTaken)}ms`)

    // Create the agent with the discovered tools
    spinner = ora('Generating response...').start()

    const agent = await createAgent(selectedTools)

    // Execute the agent
    const { result: agentResult, taken: agentTaken } = await timeIt(() =>
      agent.invoke({
        messages: [
          ...chatHistory, // the historical chat history
          new HumanMessage(message), // the user's message
          new AIMessage(query), // the intent we extracted from the user's message
          ...recommendationPrompts // the recommendation prompts
        ]
      })
    )

    const aiResponse =
      agentResult.messages[agentResult.messages.length - 1].content
    const aiMessage = aiResponse
      ? typeof aiResponse === 'string'
        ? aiResponse
        : aiResponse.join('\n')
      : 'No response generated'

    // Only store the user's message and the final response.
    chatHistory.push(new HumanMessage(message))
    chatHistory.push(new AIMessage(aiMessage))

    spinner.succeed(`Done ${chalk.gray(agentTaken)}ms`)
  } catch (error) {
    if (error instanceof Error && error.name === 'GraphRecursionError') {
      throw new Error(
        'I reached my step limit. Could you try breaking down your request into smaller parts?'
      )
    }
    console.error('Full error:', error)
    throw error
  }
}

/**
 * Entrypoint to start the chat agent
 */
async function start() {
  console.log(chalk.cyan('\n🤖 Welcome to the AI Agent!\n'))

  const initSpinner = ora('Initializing toolbox...').start()

  // OneGrep toolbox initialization
  let toolbox: LangchainToolbox | undefined
  try {
    toolbox = await createLangchainToolbox(await getToolbox())
    initSpinner.succeed('Ready to chat')
  } catch (error) {
    initSpinner.fail('Failed to initialize toolbox')
    console.error(chalk.red('Error:'), error)
    process.exit(1)
  }

  if (!toolbox) {
    console.error(chalk.red('Failed to initialize toolbox'))
    process.exit(1)
  }

  // Persistent Message History
  const chatHistory: BaseMessage[] = [
    new SystemMessage(
      `You are a helpful assistant that can answer questions and help with tasks.`
    )
  ]

  // Interaction Loop
  while (true) {
    try {
      const response = await inquirer.prompt<ChatPrompt>({
        type: 'input',
        name: 'message',
        message: '💭 ' + chalk.green('You:')
      })

      if (
        response.message.toLowerCase() === 'exit' ||
        response.message.toLowerCase() === 'quit'
      ) {
        console.log(chalk.yellow('\nGoodbye! 👋\n'))
        process.exit(0)
      } else if (response.message.length === 0) {
        console.log(chalk.yellow('\nPlease enter a message.\n'))
        continue
      }

      // Doing the bread and butter
      await processMessage(toolbox!, response.message, chatHistory)

      // Display the last message
      const lastMessage = chatHistory[chatHistory.length - 1]
      console.log('\n' + chalk.blue('🤖 Assistant:'), lastMessage.content, '\n')
    } catch (error) {
      console.error(chalk.red('\nError:'), error)
      console.log(chalk.yellow('Please try again or type "exit" to quit.\n'))
    }
  }
}

start()
