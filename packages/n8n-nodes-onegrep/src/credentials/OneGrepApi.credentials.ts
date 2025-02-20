import {
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties
} from 'n8n-workflow'

export class OneGrepApi implements ICredentialType {
  name = 'onegrepApi'
  displayName = 'OneGrep API Credentials API'
  documentationUrl = 'https://onegrep.dev/docs'
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'The API key for the OneGrep API'
    }
  ]
}
