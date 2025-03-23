import { Command } from 'commander'
import { chalk, logger } from '../utils/logger'
import { clearTerminal, getSpinner, isDefined } from '../utils/helpers'
import {
  getToolbox,
  ToolResource,
  ToolCallInput,
  ToolCallError,
  JsonSchema,
  Toolbox,
  ToolNameFilter
} from '@onegrep/sdk'
import { select, input, confirm } from '@inquirer/prompts'
import Table from 'cli-table3'
import { highlight } from 'cli-highlight'

/**
 * Generate and display an example of how to use the selected tool
 */
async function showToolUsageExample(tool: ToolResource) {
  logger.log('\n' + chalk.bold.blueBright('SDK Usage Example:'))

  // Create example parameters
  let exampleArgsCode =
    '    // Add appropriate parameters here based on tool schema'

  const schema = tool.metadata.inputSchema

  if (schema && typeof schema === 'object') {
    if ('properties' in schema && typeof schema.properties === 'object') {
      const properties = schema.properties as Record<string, any>

      // Create example object with parameter values
      const exampleArgs: Record<string, any> = {}
      for (const propName of Object.keys(properties)) {
        const propSchema = properties[propName]
        const propType = propSchema.type || 'string'

        // Set example value based on type
        if (propType === 'string') {
          exampleArgs[propName] = `"example_${propName}"`
        } else if (propType === 'number' || propType === 'integer') {
          exampleArgs[propName] = 42
        } else if (propType === 'boolean') {
          exampleArgs[propName] = true
        } else if (propType === 'object') {
          exampleArgs[propName] = '{ key: "value" }'
        } else if (propType === 'array') {
          exampleArgs[propName] = '["item1", "item2"]'
        }
      }

      if (Object.keys(exampleArgs).length > 0) {
        // Convert example args to formatted code string
        exampleArgsCode = JSON.stringify(exampleArgs, null, 4)
          .replace(/"([^"]+)":/g, '$1:') // Convert "key": to key:
          .replace(/"/g, "'") // Convert double quotes to single quotes
          .split('\n')
          .map((line) => '    ' + line) // Indent all lines
          .join('\n')
      }
    }
  }

  // Create the complete example using template string
  const usageExample = `
import { getToolbox } from "@onegrep/sdk";

// Initialize the toolbox and get all available tools
const toolbox = await getToolbox();
const tools = await toolbox.listAll();

// Find the specific tool we want to use
const tool = tools.find(
  t => t.metadata.name === "${tool.metadata.name}" && 
       t.metadata.integrationName === "${tool.metadata.integrationName}"
);

if (tool) {
  try {    
    // Call the tool with your parameters
    const result = await tool.call({
      args: ${exampleArgsCode},
      approval: undefined
    });
    
    if (result.isError) {
      console.error("Tool execution failed:", result.message);
    } else {
      console.log("Tool execution successful:");
      console.log(result.content);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}`

  // Syntax highlight the code example
  const highlightedCode = highlight(usageExample, {
    language: 'typescript',
    theme: {
      keyword: chalk.blueBright,
      built_in: chalk.cyan,
      string: chalk.greenBright,
      number: chalk.yellowBright,
      literal: chalk.magentaBright,
      comment: chalk.gray,
      function: chalk.yellow
    }
  })

  // Create a table for the code example
  const codeTable = new Table({
    style: {
      head: [],
      border: []
    },
    wordWrap: true,
    colWidths: [90]
  })

  codeTable.push([highlightedCode])
  logger.log(codeTable.toString())
}

async function coerceParameterValue(value: any, type: string) {
  logger.debug(`Coercing parameter value: ${value} to type: ${type}`)

  try {
    if (type === 'string') {
      return value.toString()
    }

    // ? why do we coerce integer into a float -> https://json-schema.org/understanding-json-schema/reference/numeric
    if (type === 'number' || type === 'integer') {
      return parseFloat(value)
    }

    if (type === 'boolean') {
      return value === 'true' || value === true
    }

    return value
  } catch (error) {
    logger.error(`Error coercing parameter value: ${error}`)
    return value
  }
}

async function collectParameters(
  tool: ToolResource
): Promise<Record<string, any>> {
  const params: Record<string, any> = { args: {}, approval: undefined }
  const schema: JsonSchema = tool.metadata.inputSchema

  if (!isDefined(schema) || typeof schema !== 'object') {
    return params
  }

  // Now collect the paramters from the user.
  const properties = schema.properties as Record<string, any>
  const required = Array.isArray(schema.required) ? schema.required : []

  // Iterating through it expecting a JSON Schema object
  // For each property in the schema, prompt the user
  for (const propName of Object.keys(properties)) {
    const propSchema = properties[propName]
    const propDescription = propSchema.description || ''
    const propDefault = propSchema.default
    const isRequired = required.includes(propName)
    const propType = propSchema.type || 'string'

    logger.debug(`Parameter schema: ${JSON.stringify(propSchema, null, 2)}`)

    // Handle required vs optional parameters differently
    if (isRequired) {
      // For required parameters, always prompt
      const promptMessage = `Enter value for ${propName}${chalk.yellow(' (Required)')}${propDescription ? ` (${propDescription})` : ''}:`

      const paramValue = await input({
        message: promptMessage,
        default: propDefault as string
      })

      const coercedValue = await coerceParameterValue(paramValue, propType)

      params.args[propName] = coercedValue
    } else {
      // For optional parameters, ask if they want to provide a value
      const userProvidingParam = await confirm({
        message: `Do you want to provide a value for optional parameter ${propName}${propDescription ? ` (${propDescription})` : ''}?`,
        default: false
      })

      if (userProvidingParam) {
        const promptMessage = `Enter value for ${propName}${propDescription ? ` (${propDescription})` : ''}:`

        const paramValue = await input({
          message: promptMessage,
          default: propDefault as string
        })

        const coercedValue = await coerceParameterValue(paramValue, propType)

        params.args[propName] = coercedValue
      }
    }
  }

  return params
}

/**
 * Run the selected tool interactively
 */
async function runSelectedTool(tool: ToolResource) {
  // Collect parameters
  const params = await collectParameters(tool)
  logger.debug(`Collected parameters: ${JSON.stringify(params, null, 2)}`)

  // Execute the tool
  const spinner = getSpinner('Running tool...', 'yellow')
  spinner.start()

  const tcInput: ToolCallInput = {
    args: params.args,
    approval: params.approval
  }

  const result = await tool.call(tcInput)

  if (result.isError) {
    spinner.fail('Tool execution failed')
    logger.error((result as ToolCallError).message)
  } else {
    spinner.succeed('Tool execution successful')
    logger.info(chalk.bold.green('\nTool Call Result\n'))
    logger.log(chalk.greenBright(JSON.stringify(result.content, null, 2)))
  }
}

async function displayToolProperties(selectedTool: ToolResource) {
  logger.info(`Selected tool: ${chalk.bold.green(selectedTool.metadata.name)}`)

  // Show tool information in a more organized way using a table
  logger.log('\n' + chalk.bold.blueBright('Tool Details:'))

  const detailsTable = new Table({
    style: {
      head: [],
      border: []
    },
    wordWrap: true,
    colWidths: [15, 75]
  })

  // Add name and description to the table
  detailsTable.push(
    [chalk.blueBright('Name:'), selectedTool.metadata.name],
    [chalk.blueBright('Integration:'), selectedTool.metadata.integrationName]
  )

  // Add description if available
  if (selectedTool.metadata.description) {
    detailsTable.push([
      chalk.blueBright('Description:'),
      selectedTool.metadata.description
    ])
  }

  // Add policy details if available
  if (selectedTool.policy) {
    detailsTable.push([
      chalk.blueBright('Policy:'),
      JSON.stringify(selectedTool.policy, null, 2)
    ])
  }

  // Add extraProperties if available
  if (selectedTool.metadata.extraProperties) {
    detailsTable.push([
      chalk.blueBright('Extra Props:'),
      JSON.stringify(selectedTool.metadata.extraProperties, null, 2)
    ])
  }

  logger.log(detailsTable.toString())

  // 4. Display parameter details
  const schema = selectedTool.metadata.inputSchema

  // Handle different schema structures based on the JsonSchema type
  if (schema && typeof schema === 'object') {
    // Check if we have a properties object (common in JSON Schema)
    if ('properties' in schema && typeof schema.properties === 'object') {
      const properties = schema.properties as Record<string, any>
      const required = Array.isArray(schema.required) ? schema.required : []

      if (Object.keys(properties).length === 0) {
        logger.info('No parameters required for this tool.')
      } else {
        // Create a nice table for parameters
        const table = new Table({
          head: [
            chalk.blueBright('Parameter'),
            chalk.blueBright('Type'),
            chalk.blueBright('Required'),
            chalk.blueBright('Description')
          ],
          style: {
            head: [], // Disable colors in header
            border: [] // Disable colors for borders
          },
          wordWrap: true,
          wrapOnWordBoundary: true,
          colWidths: [20, 15, 10, 45]
        })

        // Add rows for each parameter
        for (const propName of Object.keys(properties)) {
          const propSchema = properties[propName]
          const isRequired = required.includes(propName)
          const propType = propSchema.type || 'string'
          const propDescription = propSchema.description || '(No description)'

          table.push([
            chalk.bold(propName),
            chalk.gray(propType),
            isRequired ? chalk.yellow('Yes') : chalk.gray('No'),
            propDescription
          ])
        }

        // Display the table
        logger.log('\n' + chalk.bold.blueBright('Parameter Details:'))
        logger.log(table.toString())
      }
    } else {
      // For simple object schemas without properties
      // Create a table for this case too
      const table = new Table({
        head: [
          chalk.blueBright('Parameter'),
          chalk.blueBright('Type'),
          chalk.blueBright('Description')
        ],
        style: {
          head: [], // Disable colors in header
          border: [] // Disable colors for borders
        },
        wordWrap: true,
        wrapOnWordBoundary: true,
        colWidths: [20, 15, 55]
      })

      for (const param of Object.keys(schema)) {
        const paramSchema = schema[param as keyof typeof schema]

        if (!paramSchema || typeof paramSchema !== 'object') continue

        const paramObject = paramSchema as any
        const paramDescription = paramObject.description || '(No description)'
        const paramType = paramObject.type || 'string'

        table.push([chalk.bold(param), chalk.gray(paramType), paramDescription])
      }

      // Display the table
      logger.log('\n' + chalk.bold.blueBright('Parameter Details:'))
      logger.log(table.toString())
    }
  } else {
    logger.info('No parameters required for this tool.')
  }
}

async function setCustomProperties(toolbox: Toolbox, tool: ToolResource) {
  logger.info(
    `Setting custom properties for tool: ${chalk.bold.green(tool.metadata.name)}`
  )

  // Collect custom properties
  const newTags: Record<string, any> = {}
  let addingProps = true

  logger.log('\n' + chalk.bold.blueBright('Add custom properties:'))
  logger.log(
    chalk.dim('Enter properties as key-value pairs. Empty key to finish.')
  )

  while (addingProps) {
    // Get property key
    const propKey = await input({
      message: 'Enter property key (or empty to finish):'
    })

    // Break the loop if empty key
    if (!propKey.trim()) {
      addingProps = false
      continue
    }

    // Get property value
    const propValue = await input({
      message: `Enter value for ${chalk.cyan(propKey)}:`
    })

    // Add to custom properties
    newTags[propKey] = propValue

    logger.info(
      `Added property: ${chalk.cyan(propKey)} = ${chalk.yellow(propValue)}`
    )
  }

  // If no properties were added
  if (Object.keys(newTags).length === 0) {
    logger.info('No custom properties added.')
    return
  }

  // Show summary table of properties to be added
  logger.log('\n' + chalk.bold.blueBright('Custom properties to be added:'))

  const propsTable = new Table({
    head: [chalk.blueBright('Key'), chalk.blueBright('Value')],
    style: {
      head: [],
      border: []
    },
    wordWrap: true,
    colWidths: [30, 60]
  })

  for (const [key, value] of Object.entries(newTags)) {
    propsTable.push([
      chalk.cyan(key),
      chalk.yellow(
        typeof value === 'object' ? JSON.stringify(value) : value.toString()
      )
    ])
  }

  logger.log(propsTable.toString())

  // Confirm with user
  const confirmAdd = await confirm({
    message: 'Do you want to add these custom properties to the tool?',
    default: true
  })

  if (confirmAdd) {
    try {
      // Call the API with the correct structure
      await toolbox.apiClient.upsert_tool_custom_tags_api_v1_integrations__integration_name__tools__tool_name__custom_tags_post(
        {
          integration_name: tool.metadata.integrationName,
          tool_name: tool.metadata.name,
          tags: newTags
        },
        {
          params: {
            integration_name: tool.metadata.integrationName,
            tool_name: tool.metadata.name
          }
        }
      )

      logger.info(
        chalk.green('✓ Custom properties successfully added to the tool.')
      )

      const spinner = getSpinner('Refreshing integration...', 'yellow')
      spinner.start()
      await toolbox.refreshIntegration(tool.metadata.integrationName)
      spinner.succeed('Integration refreshed successfully')

      const refreshedTool = await toolbox.filter(
        ToolNameFilter(tool.metadata.name)
      )
      await displayToolProperties(refreshedTool[0])
    } catch (error) {
      logger.error(`Failed to update custom properties: ${error}`)
    }
  } else {
    logger.info('Custom properties update cancelled.')
  }
}

/**
 * Interactive experience for exploring and running tools
 */
async function runToolsExperience() {
  // Initialize spinner and toolbox - do this only once
  let spinner = getSpinner('Setting up toolbox...', 'yellow')
  spinner.start()
  const toolbox: Toolbox = await getToolbox()
  spinner.succeed('Toolbox setup complete')

  try {
    // Get all tools - do this only once
    spinner = getSpinner('Discovering available tools...', 'yellow')
    spinner.start()
    const toolResources: Array<ToolResource> = await toolbox.listAll()
    spinner.succeed(
      `Found ${toolResources.length} tools across various integrations`
    )

    // Organize tools by integration - do this only once
    const toolsByIntegration: Record<string, ToolResource[]> = {}
    const integrations: string[] = []
    const integrationDescriptions: Record<string, string> = {} // Store integration descriptions

    toolResources.forEach((tool) => {
      const integrationName = tool.metadata.integrationName
      // Access description safely - it might be stored in a custom property or we can extract it elsewhere
      const integrationDescription = ''

      if (!toolsByIntegration[integrationName]) {
        toolsByIntegration[integrationName] = []
        integrations.push(integrationName)
        integrationDescriptions[integrationName] = integrationDescription
      }

      toolsByIntegration[integrationName].push(tool)
    })

    // If no integrations found
    if (integrations.length === 0) {
      logger.error('No integrations or tools found in your toolbox.')
      return
    }

    // Main tool exploration loop
    let continueExploring = true
    while (continueExploring) {
      let selectedIntegration: string
      let selectedTool: ToolResource

      // 1. Select an integration (now with descriptions and tool counts)
      selectedIntegration = await select({
        message: 'Select an integration:',
        choices: integrations.map((integration) => {
          const toolCount = toolsByIntegration[integration].length
          const description = integrationDescriptions[integration]

          return {
            name: `${integration} ${chalk.gray(`(${toolCount} tools)`)}${
              description ? chalk.dim(` - ${description}`) : ''
            }`,
            value: integration
          }
        })
      })

      logger.info(
        `Selected integration: ${chalk.bold.green(selectedIntegration)} with ${
          toolsByIntegration[selectedIntegration].length
        } tools available`
      )

      // 2. Select a tool from the chosen integration
      const toolsForIntegration = toolsByIntegration[selectedIntegration]

      const selectedToolName = await select({
        message: 'Select a tool:',
        choices: toolsForIntegration.map((tool) => {
          // Format the tool name and description nicely
          const name = chalk.bold(tool.metadata.name)
          const description = tool.metadata.description
            ? chalk.dim(` - ${tool.metadata.description}`)
            : ''

          return {
            name: `${name}${description}`,
            value: tool.metadata.name
          }
        })
      })

      selectedTool = toolsForIntegration.find(
        (tool) => tool.metadata.name === selectedToolName
      )!
      await displayToolProperties(selectedTool)

      // 5. Let user choose what to do next
      const nextAction = await select({
        message: 'What would you like to do?',
        choices: [
          { name: 'See an example of tool usage', value: 'example' },
          { name: 'Run this tool now', value: 'run' },
          { name: 'Select another tool', value: 'another' },
          { name: 'Set custom properties', value: 'set-custom-properties' },
          { name: 'Exit', value: 'exit' }
        ]
      })

      if (nextAction === 'exit') {
        logger.info('Exiting tool search')
        continueExploring = false
        continue // Break out of the current iteration and check continueExploring
      }

      if (nextAction === 'another') {
        clearTerminal()
        // Just continue to the next iteration of the loop
        continue
      }

      if (nextAction === 'example') {
        await showToolUsageExample(selectedTool)

        // After showing example, ask if they want to run the tool
        const shouldRun = await confirm({
          message: 'Would you like to run this tool now?'
        })

        if (!shouldRun) {
          // Ask if they want to explore another tool
          const exploreAnother = await confirm({
            message: 'Would you like to explore another tool?'
          })

          continueExploring = exploreAnother
          continue
        }

        // Run the tool if they want to after seeing the example
        await runSelectedTool(selectedTool)
      } else if (nextAction === 'run') {
        // Run the tool directly
        await runSelectedTool(selectedTool)
      } else if (nextAction === 'set-custom-properties') {
        await setCustomProperties(toolbox, selectedTool)
      }

      // After running a tool, ask if they want to explore more tools
      const runAnother = await confirm({
        message: 'Would you like to explore another tool?'
      })

      continueExploring = runAnother
    }
  } catch (error) {
    logger.error(`Error in tool search: ${error}`)
  } finally {
    await toolbox.close()
  }
}

/** Interactive tool explorer */
export const toolsCommand = new Command()
  .name('tools')
  .aliases(['t'])
  .description('Interactive search and execution of tools from your toolbox')
  .action(async () => {
    await runToolsExperience()
  })
