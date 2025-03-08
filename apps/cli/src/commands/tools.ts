import { Command } from 'commander'
import { chalk, logger } from '../utils/logger'
import { getSpinner, isDefined } from 'utils/helpers'
import {
  getToolbox,
  ToolResource,
  ToolCallInput,
  ToolCallError
} from '@onegrep/sdk'

function validateToolRunOptions(
  options: {
    integration: string
    tool: string
    getSchema: boolean
    dryRun: boolean
    params: string
  },
  command: Command
) {
  if (!isDefined(options.integration) || !isDefined(options.tool)) {
    logger.error('Please provide the correct options for this command.')
    command.help()
    process.exit(1)
  }
}
/**
 * Fetches audit logs with the specified pagination options
 */
async function attemptToolRun(options: {
  integration: string
  tool: string
  getSchema: boolean
  dryRun: boolean
  params: string | undefined
}) {
  let spinner = getSpinner('Setting up toolbox...', 'yellow')
  spinner.start()
  const toolbox = await getToolbox()
  spinner.succeed('Toolbox setup complete')

  try {
    spinner = getSpinner('Finding integrations and tools...', 'yellow')
    spinner.start()

    const toolResources: Array<ToolResource> = await toolbox.listAll()

    // Find the tools for the given integration
    const integrationTools = toolResources.filter(
      (tool) => tool.metadata.integrationName === options.integration
    )

    logger.info(
      `Found ${integrationTools.length} tools for integration ${options.integration}`
    )

    // Find the tool with the given name
    const cleanedToolName = options.tool.trim()
    const tool: ToolResource | undefined = integrationTools.find(
      (tool) => tool.metadata.name === cleanedToolName
    )

    if (!isDefined(tool)) {
      spinner.fail(`Tool not found: ${options.tool}`)
      throw new Error(
        `Tool ${options.tool} not found in integration ${options.integration}.\nAvailable tools: ${integrationTools.map((t) => t.metadata.name).join(', ')}`
      )
    }

    spinner.succeed(`Tool found: ${tool!.metadata.name}`)

    if (options.getSchema) {
      logger.log(
        chalk.bold.blueBright(`Integration: ${tool!.metadata.integrationName}`)
      )
      logger.log(chalk.bold.blueBright(`Tool: ${tool!.metadata.name}`))
      logger.log(chalk.bold.greenBright('\nSchema: \n'))
      const schema = tool!.metadata.inputSchema
      logger.log(
        chalk.greenBright(
          JSON.stringify(
            {
              args: schema
            },
            null,
            2
          )
        )
      )
    }

    // Parse any params passed in.
    let params: Record<string, any> = { args: {} }
    if (isDefined(options.params)) {
      try {
        params = JSON.parse(options.params!)
      } catch (e) {
        logger.error('Invalid JSON provided for --params')
        logger.error(
          `Expected schema:\n${JSON.stringify({ args: tool!.metadata.inputSchema }, null, 2)}`
        )
        process.exit(1)
      }
    }

    // * Execute the tool either in dry run mode or not
    if (options.dryRun) {
      logger.info('--dry-run mode enabled. Not running tool.\n')
      logger.log(
        chalk.bold.blueBright(`Integration: ${tool!.metadata.integrationName}`)
      )
      logger.log(chalk.bold.blueBright(`Tool: ${tool!.metadata.name}`))
      logger.log(chalk.bold.greenBright('\nParameters: \n'))
      logger.log(chalk.greenBright(JSON.stringify(params, null, 2)))
    } else {
      spinner = getSpinner('Running tool...', 'yellow')
      spinner.start()

      const tcInput: ToolCallInput = {
        args: params.args,
        approval: undefined
      }

      console.log(chalk.bold.blueBright('Tool Call Input: \n'))
      console.log(chalk.blueBright(JSON.stringify(tcInput, null, 2)))

      const result = await tool!.call(tcInput)

      if (result.isError) {
        spinner.fail('Tool execution failed')
        logger.error((result as ToolCallError).message)
      } else {
        spinner.succeed('Tool execution successful')
        logger.info(chalk.bold.green('\nTool Call Result\n'))
        logger.log(chalk.greenBright(JSON.stringify(result.content, null, 2)))
      }
    }
  } catch (error) {
    throw error
  } finally {
    await toolbox.close()
  }
}

async function listTools(options: { integration?: string }) {
  let spinner = getSpinner('Setting up toolbox...', 'yellow')
  spinner.start()
  const toolbox = await getToolbox()
  spinner.succeed('Toolbox setup complete')
  const toolResources: Array<ToolResource> = await toolbox.listAll()

  spinner = getSpinner('Finding integrations and tools...', 'yellow')
  spinner.start()

  const toolsByIntegration: Record<string, string[]> = {}
  toolResources.forEach((tool) => {
    if (!toolsByIntegration[tool.metadata.integrationName]) {
      toolsByIntegration[tool.metadata.integrationName] = []
    }
    toolsByIntegration[tool.metadata.integrationName].push(tool.metadata.name)
  })

  spinner.succeed('Integrations and tools found\n')

  if (!isDefined(options.integration)) {
    // Just list out all the integrations and their tools in a bulleted list.
    // Print out the integrations and their tools in a bulleted list:
    // > Integration Name
    //   - Tool 1
    //   - Tool 2
    //   - Tool 3
    //
    // > Integration Name
    //   - Tool 1
    //   - Tool 2

    Object.entries(toolsByIntegration).forEach(([integration, tools]) => {
      logger.log(chalk.bold.blueBright(`> ${integration}`))
      tools.forEach((tool) => {
        logger.log(chalk.blueBright(`\t- ${tool}`))
      })
      logger.log('\n')
    })

    await toolbox.close()

    return
  }

  if (!toolsByIntegration[options.integration!]) {
    await toolbox.close()
    throw new Error(
      `Integration ${options.integration} not found. Available integrations: ${Object.keys(toolsByIntegration).join(', ')}`
    )
  }

  const tools = toolsByIntegration[options.integration!]
  // Print it out in a bulleted list.
  logger.log(chalk.bold.blueBright(`${options.integration}`))
  tools.forEach((tool) => {
    logger.log(chalk.blueBright(`\t- ${tool}`))
  })

  await toolbox.close()
}

export const runTool = new Command()
  .name('run-tool')
  .aliases(['t'])
  .description('Run a tool from an available integration')
  .requiredOption(
    '-i, --integration <string>',
    'Integration to run the tool from'
  )
  .requiredOption('-t, --tool <string>', 'Tool to run')
  .option('-s, --get-schema', 'Get the schema for the tool', false)
  .option('-p, --params <JSON string>', 'Parameters to pass to the tool')
  .option(
    '--dry-run',
    'Dry run the tool. This will output the payload that would be sent to the tool',
    false
  )
  .hook('preAction', (command) => {
    validateToolRunOptions(command.opts(), command)
  })
  .action(async (options) => {
    await attemptToolRun(options)
  })

export const listIntegrations = new Command()
  .name('list')
  .aliases(['lt'])
  .description('List all tools from an available integration')
  .requiredOption(
    '-i, --integration <string>',
    'Integration to list tools from'
  )
  .action(async (options) => {
    await listTools(options)
  })
