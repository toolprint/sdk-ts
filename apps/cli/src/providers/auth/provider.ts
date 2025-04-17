import * as client from 'openid-client'
import * as open from 'open' // Static import at the top
import * as http from 'http'
import { URL } from 'url'
import { ConfigProvider } from '../config/provider.js'
import { OAuth2Config } from '../config/models.js'
import { isDefined } from '../../utils/helpers.js'
import { chalk, logger } from '../../utils/logger.js'
import {
  AccountInformation,
  createApiClientFromParams,
  OneGrepApiClient
} from '@onegrep/sdk'
import * as jose from 'jose'

// Define interface for JWT claims based on standard OpenID Connect claims
// that match our requested scopes: 'openid profile email'
/**
 * Interface for JWT claims that aligns with the OpenID Connect (OIDC) specification.
 *
 * These fields are defined in the OIDC Core specification:
 * https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
 *
 * We request the scopes 'openid profile email' which provides access to these claims.
 * The actual claims returned will depend on the identity provider and user permissions.
 */
interface UserJwtClaims {
  // Required by OpenID Connect
  sub: string

  // Email scope
  email?: string
  email_verified?: boolean

  // Profile scope
  name?: string
  given_name?: string
  family_name?: string
  middle_name?: string
  nickname?: string
  preferred_username?: string
  profile?: string
  picture?: string
  website?: string
  gender?: string
  birthdate?: string
  zoneinfo?: string
  locale?: string
  updated_at?: number

  // JWT standard fields
  iat?: number
  exp?: number
  iss?: string
}

export class AuthzProvider {
  private readonly redirectPort = 3080 // Port for the local callback server
  private readonly configProvider: ConfigProvider

  constructor(params: { configProvider: ConfigProvider }) {
    this.configProvider = params.configProvider
    logger.debug('AuthzProvider initialized')
  }

  /**
   * Get an API client for a specific operation or command
   * @returns The API client
   * @throws Error if API URL is not set or API key is missing
   */
  private getApiClient(): OneGrepApiClient {
    try {
      // Check if API URL is set
      const config = this.configProvider.getConfig()
      if (!config.identity?.apiUrl) {
        throw new Error(
          'API URL is not set. Please set an API URL using the account setup command.'
        )
      }

      const clientParams = {
        baseUrl: config.identity!.apiUrl!,
        apiKey: config.identity!.apiKey,
        accessToken: config.auth?.accessToken
      }
      logger.debug(`Client params: ${JSON.stringify(clientParams)}`)

      return createApiClientFromParams(clientParams)
    } catch (error) {
      logger.debug(`Failed to create API client: ${error}`)
      throw error
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // A requirement in order for us to even select where to route calls.
      if (!isDefined(this.configProvider.getConfig().identity?.apiUrl)) {
        logger.debug('No API URL set, cannot authenticate')
        return false
      }

      // If we already have an api key, no need to go through a user-based auth flow.
      if (isDefined(this.configProvider.getConfig().identity?.apiKey)) {
        logger.debug('API key discovered. Checking validity...')

        try {
          return await this.isApiKeyValid()
        } catch (error) {
          logger.debug(`API key validation failed: ${error}`)
          return false
        }
      }

      // We should have a valid token & our api key should be valid.
      logger.debug('Checking validity of access token...')
      const oauth2Config = this.configProvider.getConfig().auth
      if (isDefined(oauth2Config) && !oauth2Config!.isTokenExpired()) {
        try {
          await this.exchangeAccessTokenForApiKey()
          return await this.isApiKeyValid()
        } catch (error) {
          logger.debug(`Token exchange failed: ${error}`)
          return false
        }
      }

      logger.debug('No valid token was found...')
      return false
    } catch (error) {
      logger.debug(`Authentication check failed: ${error}`)
      return false
    }
  }

  /** Refreshes the underlying JWT provided by the provider and caches it for a short time
   * in order to get the API KEY to interact with the user's resources. Will return true if
   * the flow was successful, false if authentication failed.
   */
  async initOAuthFlow(params: {
    reauthenticate?: boolean
    invitationCode?: string
  }): Promise<boolean> {
    const reauthenticate = params.reauthenticate ?? false
    const invitationCode = params.invitationCode

    const config = this.configProvider.getConfig()
    const oauth2Config = config.auth || new OAuth2Config()

    // Check if API URL is configured
    if (!config.identity?.apiUrl) {
      logger.error(
        'No API URL found in the config. Please set an API URL using "account setup" or "account set-url" command first.'
      )
      return false
    }

    // Check if we already have a valid access token and an API key.
    if ((await this.isAuthenticated()) && !reauthenticate) {
      return true
    }

    // Set up a local server to receive the callback
    const { server, codePromise } = this.createLocalServer()

    try {
      // Discover OpenID configuration
      logger.debug('Discovering OAuth provider...')
      const oidcConfig = await client.discovery(
        new URL(oauth2Config.discoveryEndpoint),
        oauth2Config.clientId
      )

      // Generate PKCE parameters
      const code_verifier = client.randomPKCECodeVerifier()
      const code_challenge =
        await client.calculatePKCECodeChallenge(code_verifier)

      // Always generate a state parameter for CSRF protection
      const state = client.randomState()

      // Build the redirect URL with appropriate parameters
      const redirect_uri = `http://localhost:${this.redirectPort}/oauth/openid/callback`
      const parameters: Record<string, string> = {
        redirect_uri,
        scope: 'openid profile email',
        code_challenge,
        code_challenge_method: 'S256',
        state // Always include state parameter
      }

      // Build the authorization URL
      const redirectTo = client.buildAuthorizationUrl(oidcConfig, parameters)

      // Open the browser for the user to authenticate
      logger.info(
        "Please open this URL in your browser to authenticate (if it doesn't open automatically):\n"
      )
      logger.info(chalk.blue(redirectTo.href))
      logger.info('\n')

      try {
        await open.default(redirectTo.href)
        logger.debug('Browser opened automatically.')
      } catch (error) {
        logger.error(
          'Unable to open browser automatically. Please copy the URL manually.'
        )
      }

      const callbackUrl = await codePromise

      // Exchange the authorization code for tokens
      logger.debug('Exchanging code for tokens...')
      const tokens = await client.authorizationCodeGrant(
        oidcConfig,
        callbackUrl,
        {
          pkceCodeVerifier: code_verifier,
          expectedState: state // Always verify the state parameter
        }
      )

      if (!isDefined(tokens.access_token)) {
        logger.error('Authentication failed. No access token received.')
        return false
      }

      // TODO: Remove this from the log.
      logger.debug('Token generated successfully.')

      // Store the token first so we can use getUserDetailsFromJwt
      const claims = await this.getUserDetailsFromJwt(tokens.access_token)
      this.configProvider.updateAuthState({
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        expiry_timestamp: claims.exp
      })

      await this.exchangeAccessTokenForApiKey({
        invitationCode: invitationCode
      })

      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      logger.error(`Authentication failed: ${errorMessage}`)
      throw error
    } finally {
      // Clean up and update state.
      server.close()
      logger.debug('Saving updated config...')
      this.configProvider.saveConfig()
    }
  }

  /**
   * Creates a local HTTP server to handle the OAuth callback
   */
  private createLocalServer() {
    // Create a server to handle the callback
    const server = http.createServer()

    // Create a promise that will resolve with the callback URL
    const codePromise = new Promise<URL>((resolve, reject) => {
      // Set a timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Authentication timed out'))
        server.close()
      }, 120000) // 2 minute timeout

      server.on('request', (req, res) => {
        try {
          if (!req.url) {
            throw new Error('Request URL is undefined')
          }

          // Parse the callback URL
          const callbackUrl = new URL(req.url, `http://${req.headers.host}`)

          // Parse the URL params and check for errors.
          if (callbackUrl.searchParams.has('error')) {
            const error = callbackUrl.searchParams.get('error')
            const errorDescription =
              callbackUrl.searchParams.get('error_description') ||
              'Unknown error'

            // Send an error response
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(`
                            <html>
                                <body>
                                    <h1>Authentication Failed</h1>
                                    <p>Error: ${error}</p>
                                    <p>${errorDescription}</p>
                                    <p>Please close this window and try again.</p>
                                </body>
                            </html>
                        `)

            reject(
              new Error(`Authentication error: ${error} - ${errorDescription}`)
            )
          } else if (callbackUrl.searchParams.has('code')) {
            // Auth was successful, resolve the promise - ?code=...
            clearTimeout(timeoutId)
            resolve(callbackUrl)

            // Send a success response
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(`
                            <html>
                                <body>
                                    <h1>Authentication Successful</h1>
                                    <p>You can close this window and return to the CLI.</p>
                                    <script>setTimeout(function() { window.close(); }, 2000);</script>
                                </body>
                            </html>
                        `)
          } else {
            // No code parameter found
            res.writeHead(400, { 'Content-Type': 'text/html' })
            res.end(`
                            <html>
                                <body>
                                    <h1>Authentication Failed</h1>
                                    <p>No authorization code was received.</p>
                                    <p>Please close this window and try again.</p>
                                </body>
                            </html>
                        `)

            reject(new Error('No authorization code received'))
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)

          // Send an error response
          res.writeHead(500, { 'Content-Type': 'text/html' })
          res.end(`
                        <html>
                            <body>
                                <h1>Authentication Failed</h1>
                                <p>Error: ${errorMessage}</p>
                                <p>Please close this window and try again.</p>
                            </body>
                        </html>
                    `)

          reject(new Error(`Error processing callback: ${errorMessage}`))
        }
      })

      // Start the server
      server.listen(this.redirectPort, () => {
        logger.debug(
          `Local authentication server listening on port ${this.redirectPort}`
        )
      })
    })

    return { server, codePromise }
  }

  /** Decodes claims from a provided JWT or uses the access token from the config
   * if no token is provided.
   */
  private async getUserDetailsFromJwt(token?: string): Promise<UserJwtClaims> {
    if (!isDefined(token)) {
      const authConfig = this.configProvider.getConfig().auth
      if (!isDefined(authConfig) || !isDefined(authConfig!.accessToken)) {
        throw new Error('No access token found. Cannot fetch user details.')
      }

      token = authConfig!.accessToken
    }

    try {
      // Decode the JWT without verifying the signature
      const decoded = jose.decodeJwt(token!)
      return decoded as UserJwtClaims
    } catch (error) {
      logger.error(`Failed to decode JWT: ${error}`)
      throw new Error('Failed to extract user details from token')
    }
  }

  /**
   * Exchanges an access token for an API key by calling the backend service then updates the
   * local config with the API Key for usage across boundaries.
   */
  private async exchangeAccessTokenForApiKey(params?: {
    invitationCode?: string
  }): Promise<void> {
    const authConfig = this.configProvider.getConfig().auth
    if (!isDefined(authConfig) || !isDefined(authConfig!.accessToken)) {
      throw new Error('Invalid authentication state. Please re-authenticate.')
    }

    logger.debug('Exchanging access token for API key...')
    const authStatus =
      await this.getApiClient().get_auth_status_api_v1_account_auth_status_get()

    let accountInfo: AccountInformation | undefined

    if (authStatus.credentials_provided && !authStatus.is_authenticated) {
      logger.debug('No OneGrep account found for this token.')

      if (!isDefined(params?.invitationCode)) {
        throw new Error(
          'No account was found. If you have an invitation code, please use it to create an account.'
        )
      }

      // Get user details including email from the JWT
      let userEmail: string | undefined
      try {
        const claims = await this.getUserDetailsFromJwt()
        // Try email first, then preferred_username, then fall back to sub
        userEmail = claims.email!
        logger.debug(`Extracted email from token: ${userEmail}`)
      } catch (error) {
        logger.error(`Failed to extract email from token: ${error}`)
        throw new Error('Could not extract email from authentication tokens')
      }

      if (!userEmail) {
        throw new Error('Could not extract email from authentication tokens')
      }

      // Create an account for this user in the domain that they're pointed at.
      logger.debug(
        `Creating account with email: ${userEmail} and invitation code: ${params?.invitationCode}`
      )
      accountInfo =
        await this.getApiClient().create_account_by_invitation_api_v1_account_invitation_code_post(
          {
            invitation_code: params?.invitationCode as string,
            email: userEmail
          }
        )
    } else {
      // Fetch the account information for the user.
      accountInfo =
        await this.getApiClient().get_account_information_api_v1_account__get()
    }

    if (!isDefined(accountInfo)) {
      throw new Error(
        'No account information found. Please re-authenticate or get an invitation code.'
      )
    }

    // TODO: Implement the actual API call for the key exchange.
    this.configProvider.updateIdentity({
      apiKey: accountInfo.account.api_key,
      userId: accountInfo.user_id
    })
  }

  private async isApiKeyValid(): Promise<boolean> {
    if (!isDefined(this.configProvider.getConfig().identity?.apiKey)) {
      throw new Error('No API key was found in the config.')
    }

    const authStatus =
      await this.getApiClient().get_auth_status_api_v1_account_auth_status_get()
    const apiKeyValid =
      authStatus.credentials_provided && authStatus.is_authenticated
    logger.debug(`API key is valid: ${apiKeyValid}`)

    return apiKeyValid
  }
}

export default AuthzProvider
