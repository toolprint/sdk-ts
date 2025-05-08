import { Function, getFunction, initialize, settings } from '@blaxel/core'

import { SecretManager } from '~/secrets/types.js'

export const initializeBlaxelApiClient: (
  apikey?: string,
  workspace?: string,
  baseUrl?: string
) => void = (apikey, workspace, baseUrl) => {
  initialize({
    proxy: baseUrl ?? settings.baseUrl,
    apikey: apikey ?? settings.authorization,
    workspace: workspace ?? settings.workspace
  })
}

export const xBlaxelHeaders: (
  apiKey: string,
  workspace: string
) => Record<string, string> = (apiKey, workspace) => {
  return {
    'x-blaxel-authorization': `Bearer ${apiKey}`,
    'x-blaxel-workspace': workspace
  }
}

export const initializeBlaxelApiClientFromSecrets: (
  secretsManager: SecretManager
) => Promise<void> = async (secretsManager) => {
  const requiredSecretNames = ['BL_API_KEY', 'BL_WORKSPACE']
  const secrets = await secretsManager.getSecrets(requiredSecretNames, true)
  initializeBlaxelApiClient(
    secrets.get('BL_API_KEY')!,
    secrets.get('BL_WORKSPACE')!
  )
}

export const getBlaxelFunction: (
  functionName: string
) => Promise<Function> = async (functionName) => {
  const response = await getFunction({
    path: {
      functionName: functionName
    }
  })
  if (response.error) {
    throw new Error(`Error getting function ${functionName}: ${response.error}`)
  }
  return response.data!
}
