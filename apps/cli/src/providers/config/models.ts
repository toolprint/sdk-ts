import { SerializableModel } from '../models.js'
import { isDefined } from '../../utils/helpers.js'
import { z } from 'zod'

const _AUTHZ_DEFAULTS = {
  openIdDiscoveryEndpoint:
    'https://auth.onegrep.dev/.well-known/openid-configuration',
  clientId: '9de8c8c4fd9cf1c63a9c95d079979a09'
}

export const IdentitySchema = z.object({
  apiUrl: z
    .string()
    .optional()
    .transform((v) => {
      if (isDefined(process.env.ONEGREP_API_URL)) {
        return process.env.ONEGREP_API_URL
      }

      if (isDefined(v)) return v

      return undefined
    }),
  apiKey: z
    .string()
    .optional()
    .transform((v) => {
      if (isDefined(process.env.ONEGREP_API_KEY)) {
        return process.env.ONEGREP_API_KEY
      }

      if (isDefined(v)) return v

      return undefined
    }),
  userId: z.string().optional(),
  email: z.string().optional()
  // profileId, etc.
})

/**
 * This represents the Identity with respect to the OneGrep API.
 * It is comprised of the attributes that direct how the API responds in terms of
 * the identity of the caller.
 */
export class Identity extends SerializableModel<
  z.infer<typeof IdentitySchema>
> {
  constructor(
    public apiUrl?: string,
    public apiKey?: string,
    public userId?: string,
    public email?: string
  ) {
    super()
  }

  /**
   * Updates the identity with new values. Allows us to be flexible with partial updates.
   */
  update(params: {
    apiUrl?: string
    apiKey?: string
    userId?: string
    email?: string
  }) {
    if (isDefined(params.apiUrl)) {
      this.apiUrl = params.apiUrl
    }

    if (isDefined(params.userId)) {
      this.userId = params.userId
    }

    if (isDefined(params.email)) {
      this.email = params.email
    }

    if (isDefined(params.apiKey)) {
      this.apiKey = params.apiKey
    }
  }

  modelDump(): z.infer<typeof IdentitySchema> {
    return IdentitySchema.parse(this)
  }

  static modelValidate(data: unknown): Identity {
    const validated = IdentitySchema.safeParse(data)

    if (!validated.success) {
      throw new Error(`Failed to validate identity: ${validated.error}`)
    }

    return new Identity(
      validated.data.apiUrl,
      validated.data.apiKey,
      validated.data.userId,
      validated.data.email
    )
  }
}

// Define the OAuth2 configuration schema
export const OAuth2Schema = z.object({
  discoveryEndpoint: z
    .string()
    .url()
    .optional()
    .transform((v) => {
      if (isDefined(process.env.AUTHZ_DISCOVERY_ENDPOINT)) {
        return process.env.AUTHZ_DISCOVERY_ENDPOINT
      }

      if (isDefined(v)) return v

      return _AUTHZ_DEFAULTS.openIdDiscoveryEndpoint
    }),
  clientId: z
    .string()
    .optional()
    .transform((v) => {
      if (isDefined(v)) return v

      return _AUTHZ_DEFAULTS.clientId
    }),
  accessToken: z.string().optional(),
  expiryTimestamp: z.number().optional(),
  idToken: z.string().optional()
})

/**
 * Configuration for OAuth2 authentication.
 *
 * Design Decision: We intentionally do not store refresh tokens.
 * This is a security-focused decision to minimize attack vectors from long-lived tokens.
 * When access tokens expire, users will need to re-authenticate.
 *
 * This may change in the future when we implement secure refresh token storage
 * using the system keychain.
 */
export class OAuth2Config extends SerializableModel<
  z.infer<typeof OAuth2Schema>
> {
  constructor(
    public discoveryEndpoint: string = _AUTHZ_DEFAULTS.openIdDiscoveryEndpoint,
    public clientId: string = _AUTHZ_DEFAULTS.clientId,
    public accessToken?: string,
    public expiryTimestamp?: number,
    public idToken?: string
  ) {
    super()
  }

  modelDump(): z.infer<typeof OAuth2Schema> {
    return OAuth2Schema.parse(this)
  }

  static modelValidate(data: unknown): OAuth2Config {
    const validated = OAuth2Schema.safeParse(data)

    if (!validated.success) {
      throw new Error(`Failed to validate OAuth2 config: ${validated.error}`)
    }

    return new OAuth2Config(
      validated.data.discoveryEndpoint,
      validated.data.clientId,
      validated.data.accessToken,
      validated.data.expiryTimestamp,
      validated.data.idToken
    )
  }

  /**
   * Checks if the current access token is expired or about to expire
   * @param bufferSeconds Number of seconds before expiry to consider the token as expired
   * @returns boolean indicating if the token is expired or about to expire
   */
  isTokenExpired(bufferSeconds: number = 60): boolean {
    if (!isDefined(this.accessToken)) {
      return true
    }

    if (!isDefined(this.expiryTimestamp)) {
      return true
    }

    const now = Math.floor(Date.now() / 1000) // Current time in seconds

    // Simply compare current time with the stored expiry timestamp
    return now >= this.expiryTimestamp! - bufferSeconds
  }

  /**
   * Updates the token information with new values.
   *
   * @param params Token response from the authorization server with expiry timestamp
   */
  updateState(params: {
    access_token: string
    expiry_timestamp?: number
    id_token?: string
  }): void {
    this.accessToken = params.access_token

    if (params.expiry_timestamp) {
      this.expiryTimestamp = params.expiry_timestamp
    }

    if (params.id_token) {
      this.idToken = params.id_token
    }
  }
}

// Define the schema for Config
export const ConfigSchema = z.object({
  auth: OAuth2Schema.optional(),
  identity: IdentitySchema.optional()
})

export class Config extends SerializableModel<z.infer<typeof ConfigSchema>> {
  constructor(
    public auth?: OAuth2Config,
    public identity?: Identity
  ) {
    super()
  }

  modelDump(): z.infer<typeof ConfigSchema> {
    return ConfigSchema.parse(this)
  }

  static modelValidate(data: unknown): Config {
    const validated = ConfigSchema.safeParse(data)

    if (!validated.success) {
      throw new Error(`Failed to validate config: ${validated.error}`)
    }

    return new Config(
      validated.data.auth
        ? OAuth2Config.modelValidate(validated.data.auth)
        : undefined,
      validated.data.identity
        ? Identity.modelValidate(validated.data.identity)
        : undefined
    )
  }
}
