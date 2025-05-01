export interface SecretManager {
  getSecretNames(): Promise<string[]>
  getSecret(secretName: string): Promise<string>
}
