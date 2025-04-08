import {
  AndFilter,
  createToolbox,
  ServerNameFilter,
  ToolNameFilter,
  createApiClientFromParams,
  ToolCallResponse
} from '@onegrep/sdk'
import {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
  NodeConnectionType,
  IDataObject
} from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow/dist/errors/node-operation.error.js'

export class Onegrep implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'OneGrep',
    name: 'onegrep',
    icon: 'file:onegrep.svg',
    group: ['tools'],
    version: 1,
    description: 'Use OneGrep tools',
    defaults: {
      name: 'OneGrep'
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'onegrepApi',
        required: true
      }
    ],
    properties: [
      {
        displayName: 'Server',
        name: 'server',
        type: 'options',
        options: [
          { name: 'Time', value: 'time' },
          { name: 'Git', value: 'git' }
        ],
        default: 'time',
        required: true
      },
      {
        displayName: 'Tool',
        name: 'tool',
        type: 'options',
        options: [
          { name: 'Get Current Time', value: 'get_current_time' },
          { name: 'Convert Time', value: 'convert_time' }
        ],
        default: 'get_current_time',
        required: true
      },
      {
        displayName: 'Arguments JSON',
        name: 'arguments_json',
        type: 'string',
        default: '',
        description: 'The arguments of the tool'
      },
      // Tool 1 Properties
      {
        displayName: 'Message Content',
        name: 'content',
        type: 'string',
        default: '',
        description: 'The content of the SMS message',
        displayOptions: {
          show: {
            tool: ['tool1']
          }
        }
      },
      // Tool 2 Properties
      {
        displayName: 'Message Type',
        name: 'messageType',
        type: 'options',
        displayOptions: {
          show: {
            tool: ['tool2']
          }
        },
        options: [
          { name: 'Tool 1', value: 'tool1' },
          { name: 'Tool 2', value: 'tool2' }
        ],
        default: 'tool1'
      }
    ]
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('onegrepApi')
    const apiKey = credentials.apiKey as string

    // TODO: this is a hack to get the API key into the environment for other packages
    // Set the API key in the environment
    process.env.ONEGREP_API_KEY = apiKey

    const apiClient = createApiClientFromParams({
      baseUrl: 'https://api.onegrep.dev',
      apiKey: apiKey
    })
    const toolbox = await createToolbox(apiClient)

    // const channel = this.getNodeParameter('channel', 0) as string
    // const recipients = this.getNodeParameter('recipients', 0) as string

    const server = this.getNodeParameter('server', 0) as string
    const tool = this.getNodeParameter('tool', 0) as string
    const argsJSON = this.getNodeParameter('arguments_json', 0) as string

    const args = JSON.parse(argsJSON)

    const resourceFilter = AndFilter(
      ServerNameFilter(server),
      ToolNameFilter(tool)
    )
    const toolResource = await toolbox.matchUnique(resourceFilter)

    const result: ToolCallResponse<any> = await toolResource.call({
      args: args || {},
      approval: undefined
    })

    if (result.isError) {
      throw new NodeOperationError(this.getNode(), result.message)
    }

    const output = result.toZod()

    const json_content_list: IDataObject[] = []
    // for (const content of result.content) {
    //   if (content.type === 'text') {
    //     const parsedContent = JSON.parse(content.text) as IDataObject
    //     json_content_list.push(parsedContent)
    //   } else {
    //     const error = new Error(`Unsupported content type: ${content.type}`)
    //     throw new NodeOperationError(this.getNode(), error)
    //   }
    // }
    json_content_list.push({ json: JSON.stringify(output.toZod()) })
    // TODO: handle parse as output schema?
    const data_content_list: INodeExecutionData[] = []
    for (const content of json_content_list) {
      data_content_list.push({ json: content })
    }

    return [data_content_list]
  }
}
