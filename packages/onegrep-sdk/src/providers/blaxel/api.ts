import {
  Client,
  Config,
  createClient,
  createConfig
} from '@hey-api/client-fetch'

import { settings, getFunction, Function } from '@blaxel/sdk'

import { SecretManager } from '~/secrets/types.js'

export const xBlaxelHeaders: (
  apiKey: string,
  workspace: string
) => Record<string, string> = (apiKey, workspace) => {
  return {
    'x-blaxel-authorization': `Bearer ${apiKey}`,
    'x-blaxel-workspace': workspace
  }
}

export const customBlaxelApiClient: (
  headerOverrides?: Record<string, string>,
  baseUrl?: string
) => Client = (headerOverrides, baseUrl) => {
  const config: Config = createConfig({
    baseUrl: baseUrl ?? settings.baseUrl,
    headers: headerOverrides ?? settings.headers
  })
  return createClient(config)
}

export const getBlaxeApiClientFromSecrets: (
  secretsManager: SecretManager
) => Promise<Client> = async (secretsManager) => {
  const requiredSecretNames = ['BL_API_KEY', 'BL_WORKSPACE']
  const secrets = await secretsManager.getSecrets(requiredSecretNames, true)
  return customBlaxelApiClient(
    xBlaxelHeaders(secrets.get('BL_API_KEY')!, secrets.get('BL_WORKSPACE')!)
  )
}

export const getBlaxelFunction: (
  functionName: string,
  client?: Client
) => Promise<Function> = async (functionName, client) => {
  const response = await getFunction({
    client: client,
    path: {
      functionName: functionName
    }
  })
  if (response.error) {
    throw new Error(`Error getting function ${functionName}: ${response.error}`)
  }
  return response.data!
}
