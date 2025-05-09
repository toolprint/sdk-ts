export interface SecretManager {
  initialize(): Promise<void>
  getSecretNames(): Promise<string[]>
  hasSecret(secretName: string): Promise<boolean>
  getSecret(secretName: string): Promise<string>
  getSecrets(
    secretNames: string[],
    requireAll: boolean
  ): Promise<Map<string, string>>
  syncProcessEnvironment(): Promise<void>
}
