import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

type AccountInformation = {
  user_id: string
  account: UserAccount
  organization: Organization
}
type UserAccount = {
  created_at?: ((string | null) | Array<string | null>) | undefined
  updated_at?: ((string | null) | Array<string | null>) | undefined
  id: string
  belongs_to_organization_id?:
    | ((string | null) | Array<string | null>)
    | undefined
  api_key: string
}
type Organization = {
  created_at?: ((string | null) | Array<string | null>) | undefined
  updated_at?: ((string | null) | Array<string | null>) | undefined
  id: string
  owner_id?: ((string | null) | Array<string | null>) | undefined
  created_by_user_id?: ((string | null) | Array<string | null>) | undefined
}
type ActionApprovalRequest = {
  id: (number | null) | Array<number | null>
  policy_id: number
  state?: ActionApprovalState | undefined
  created_at?: string | undefined
  last_updated_at?: string | undefined
  updated_by_user_id: string
  payload?: (({} | null) | Array<{} | null>) | undefined
}
type ActionApprovalState =
  /**
   * Enum for policy approval states
   *
   * @enum pending, approved, rejected
   */
  'pending' | 'approved' | 'rejected'
type ApprovalAndPolicy = {
  approval: ActionApprovalRequest
  policy: Policy
  canonical_resource_name: string
  integration_name: string
  tool_name: string
}
type Policy = {
  event_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  access_policy: AccessPolicyType
  id?: ((number | null) | Array<number | null>) | undefined
  canonical_resource_name: string
  organization_id: string
  created_at?: string | undefined
  updated_at?: ((string | null) | Array<string | null>) | undefined
}
type AccessPolicyType =
  /**
   * Enum for access policy types
   *
   * @enum ALWAYS, NEVER, REQUIRES_PERMISSION
   */
  'ALWAYS' | 'NEVER' | 'REQUIRES_PERMISSION'
type AuthenticationStatus = {
  credentials_provided: boolean
  method?:
    | ((AuthenticationMethod | null) | Array<AuthenticationMethod | null>)
    | undefined
  user_id?: ((string | null) | Array<string | null>) | undefined
  is_authenticated: boolean
}
type AuthenticationMethod =
  /**
   * @enum propelauth, api_key
   */
  'propelauth' | 'api_key'
type BasePolicy = {
  event_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  access_policy: AccessPolicyType
}
type HTTPValidationError = Partial<{
  detail: Array<ValidationError>
}>
type ValidationError = {
  loc: Array<(string | number) | Array<string | number>>
  msg: string
  type: string
}
type IntegrationConfigDetails = {
  name: string
  configuration_state: IntegrationConfigurationState
  template: IntegrationTemplate
}
type IntegrationConfigurationState =
  /**
 * The state of an integration from an account perspective (not runtime).
To determine the runtime state, we will have to check the server configuration for
the integration separately depending on our infrastucture selection.
 *
 * @enum agent_local, cloud_hosted_available, cloud_hosted_configured
 */
  'agent_local' | 'cloud_hosted_available' | 'cloud_hosted_configured'
type IntegrationTemplate = {
  /**
   * The version of the integration template.
   */
  version: string
  name: string
  repository: string
  sha: string
  auth_scheme?:
    | ((IntegrationAuthScheme | null) | Array<IntegrationAuthScheme | null>)
    | undefined
  oauth_authorizer?:
    | (
        | (IntegrationOAuthAuthorizer | null)
        | Array<IntegrationOAuthAuthorizer | null>
      )
    | undefined
  args: MCPIntegrationArgs
  secrets?:
    | (
        | (Array<IntegrationSecret> | null)
        | Array<Array<IntegrationSecret> | null>
      )
    | undefined
  default_policies: IntegrationDefaultPolicies
}
type IntegrationAuthScheme =
  /**
   * Authentication schemes supported by server templates.
   *
   * @enum token, oauth_1_0, oauth_2_0
   */
  'token' | 'oauth_1_0' | 'oauth_2_0'
type IntegrationOAuthAuthorizer =
  /**
   * @enum google, meta
   */
  'google' | 'meta'
type MCPIntegrationArgs = {
  type: string
  command: string
  args?: ((Array<string> | null) | Array<Array<string> | null>) | undefined
}
type IntegrationSecret = {
  name: string
  generation_link?: ((string | null) | Array<string | null>) | undefined
  value?: ((string | null) | Array<string | null>) | undefined
}
type IntegrationDefaultPolicies = {
  /**
   * Policies for tools in this integration.
   */
  tools: Array<BasePolicy>
}
type IntegrationConfigToolDetails = {
  name: string
  configuration_state: IntegrationConfigurationState
  tool_policies: {}
}
type IntegrationConfigUpsertResult = {
  integration_config: IntegrationConfiguration
  state: IntegrationConfigurationState
}
type IntegrationConfiguration = {
  created_at?: ((string | null) | Array<string | null>) | undefined
  updated_at?: ((string | null) | Array<string | null>) | undefined
  id?: ((number | null) | Array<number | null>) | undefined
  name: string
  org_id: string
  profile_id: string
  template: IntegrationTemplate
  configuration_state: IntegrationConfigurationState
}
type IntegrationUpsertAttempt = {
  success: boolean
  error?: ((string | null) | Array<string | null>) | undefined
  config: IntegrationConfigUpsertResult
  runtime?: ((unknown | null) | Array<unknown | null>) | undefined
}
type PaginatedResponse_AuditLog_ = {
  items: Array<AuditLog>
  pagination: PaginationMetadata
}
type AuditLog = {
  id?: ((number | null) | Array<number | null>) | undefined
  policy_id: number
  action: string
  details?: {} | undefined
  performed_by?: /**
   * @default "system"
   */
  string | undefined
  timestamp?: string | undefined
}
type PaginationMetadata = {
  page: number
  page_size: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
}
type Server = {
  kind?: /**
   * @default "Server"
   */
  string | undefined
  metadata: KindMetadata
  spec: ServerSpec
  status?: (({} | null) | Array<{} | null>) | undefined
  apiVersion: string
} & {
  [key: string]: any
}
type KindMetadata = {}
type ServerSpec = {
  orgID: string
  image: string
  pullPolicy?: /**
   * @default "IfNotPresent"
   */
  string | undefined
  port?: /**
   * @default 8000
   */
  number | undefined
  displayName?: ((string | null) | Array<string | null>) | undefined
  envFromSources?: ((Array<{}> | null) | Array<Array<{}> | null>) | undefined
  volumes?: ((Array<{}> | null) | Array<Array<{}> | null>) | undefined
  volumeMounts?: ((Array<{}> | null) | Array<Array<{}> | null>) | undefined
  launcherConfig?:
    | ((LauncherConfig | null) | Array<LauncherConfig | null>)
    | undefined
  ingressConfig?:
    | ((IngressConfig | null) | Array<IngressConfig | null>)
    | undefined
}
type LauncherConfig = {
  configMapName: string
  mountPath: string
}
type IngressConfig = {
  entryPoints?: Array<string> | undefined
  proxyDomain: string
  orgID: string
  orgRouteStrategy?:
    | /**
     * @default "PathPrefix"
     * @enum PathPrefix, Header
     */
    ('PathPrefix' | 'Header')
    | undefined
  serverID: string
  serverRouteStrategy?:
    | /**
     * @default "Header"
     * @enum PathPrefix, Header
     */
    ('PathPrefix' | 'Header')
    | undefined
  serverIsDefault?:
    | /**
     * @default false
     */
    ((boolean | null) | Array<boolean | null>)
    | undefined
  gatewayScheme?: /**
   * @default "http"
   */
  string | undefined
}
type TraefikIngressRoute = {
  kind?: /**
   * @default "IngressRoute"
   */
  string | undefined
  metadata: KindMetadata
  spec: IngressConfig
  status: {}
  apiVersion: string
} & {
  [key: string]: any
}

const policy_id = z.union([z.number(), z.null()]).optional()
const action = z.union([z.string(), z.null()]).optional()
const AuditLog: z.ZodType<AuditLog> = z
  .object({
    id: z.union([z.number(), z.null()]).optional(),
    policy_id: z.number().int(),
    action: z.string(),
    details: z.object({}).partial().strict().passthrough().optional(),
    performed_by: z.string().optional().default('system'),
    timestamp: z.string().datetime({ offset: true }).optional()
  })
  .strict()
  .passthrough()
const PaginationMetadata: z.ZodType<PaginationMetadata> = z
  .object({
    page: z.number().int(),
    page_size: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
    has_next: z.boolean(),
    has_prev: z.boolean()
  })
  .strict()
  .passthrough()
const PaginatedResponse_AuditLog_: z.ZodType<PaginatedResponse_AuditLog_> = z
  .object({ items: z.array(AuditLog), pagination: PaginationMetadata })
  .strict()
  .passthrough()
const ValidationError: z.ZodType<ValidationError> = z
  .object({
    loc: z.array(z.union([z.string(), z.number()])),
    msg: z.string(),
    type: z.string()
  })
  .strict()
  .passthrough()
const HTTPValidationError: z.ZodType<HTTPValidationError> = z
  .object({ detail: z.array(ValidationError) })
  .partial()
  .strict()
  .passthrough()
const RemoteClientConfig = z
  .object({
    org_id: z.string(),
    name: z.string(),
    display_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    ready: z.boolean().optional().default(false),
    endpoint: z.string().optional(),
    required_headers: z.union([z.record(z.string()), z.null()]).optional()
  })
  .strict()
  .passthrough()
const AccessPolicyType = z.enum(['ALWAYS', 'NEVER', 'REQUIRES_PERMISSION'])
const UserAccount: z.ZodType<UserAccount> = z
  .object({
    created_at: z.union([z.string(), z.null()]).optional(),
    updated_at: z.union([z.string(), z.null()]).optional(),
    id: z.string(),
    belongs_to_organization_id: z.union([z.string(), z.null()]).optional(),
    api_key: z.string()
  })
  .strict()
  .passthrough()
const Organization: z.ZodType<Organization> = z
  .object({
    created_at: z.union([z.string(), z.null()]).optional(),
    updated_at: z.union([z.string(), z.null()]).optional(),
    id: z.string(),
    owner_id: z.union([z.string(), z.null()]).optional(),
    created_by_user_id: z.union([z.string(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const AccountInformation: z.ZodType<AccountInformation> = z
  .object({
    user_id: z.string(),
    account: UserAccount,
    organization: Organization
  })
  .strict()
  .passthrough()
const ActionApprovalState = z.enum(['pending', 'approved', 'rejected'])
const ActionApprovalRequest: z.ZodType<ActionApprovalRequest> = z
  .object({
    id: z.union([z.number(), z.null()]),
    policy_id: z.number().int(),
    state: ActionApprovalState.optional(),
    created_at: z.string().datetime({ offset: true }).optional(),
    last_updated_at: z.string().datetime({ offset: true }).optional(),
    updated_by_user_id: z.string(),
    payload: z
      .union([z.object({}).partial().strict().passthrough(), z.null()])
      .optional()
  })
  .strict()
  .passthrough()
const Policy: z.ZodType<Policy> = z
  .object({
    event_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    access_policy: AccessPolicyType,
    id: z.union([z.number(), z.null()]).optional(),
    canonical_resource_name: z.string(),
    organization_id: z.string(),
    created_at: z.string().datetime({ offset: true }).optional(),
    updated_at: z.union([z.string(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const ApprovalAndPolicy: z.ZodType<ApprovalAndPolicy> = z
  .object({
    approval: ActionApprovalRequest,
    policy: Policy,
    canonical_resource_name: z.string(),
    integration_name: z.string(),
    tool_name: z.string()
  })
  .strict()
  .passthrough()
const Attempt = z
  .object({
    success: z.boolean(),
    error: z.union([z.string(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const AuthenticationMethod = z.enum(['propelauth', 'api_key'])
const AuthenticationStatus: z.ZodType<AuthenticationStatus> = z
  .object({
    credentials_provided: z.boolean(),
    method: z.union([AuthenticationMethod, z.null()]).optional(),
    user_id: z.union([z.string(), z.null()]).optional(),
    is_authenticated: z.boolean()
  })
  .strict()
  .passthrough()
const BasePolicy: z.ZodType<BasePolicy> = z
  .object({
    event_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    access_policy: AccessPolicyType
  })
  .strict()
  .passthrough()
const IngressConfig: z.ZodType<IngressConfig> = z
  .object({
    entryPoints: z.array(z.string()).optional(),
    proxyDomain: z.string(),
    orgID: z.string(),
    orgRouteStrategy: z
      .enum(['PathPrefix', 'Header'])
      .optional()
      .default('PathPrefix'),
    serverID: z.string(),
    serverRouteStrategy: z
      .enum(['PathPrefix', 'Header'])
      .optional()
      .default('Header'),
    serverIsDefault: z.union([z.boolean(), z.null()]).optional().default(false),
    gatewayScheme: z.string().optional().default('http')
  })
  .strict()
  .passthrough()
const IntegrationAuthScheme = z.enum(['token', 'oauth_1_0', 'oauth_2_0'])
const IntegrationConfigurationState = z.enum([
  'agent_local',
  'cloud_hosted_available',
  'cloud_hosted_configured'
])
const IntegrationOAuthAuthorizer = z.enum(['google', 'meta'])
const MCPIntegrationArgs: z.ZodType<MCPIntegrationArgs> = z
  .object({
    type: z.string(),
    command: z.string(),
    args: z.union([z.array(z.string()), z.null()]).optional()
  })
  .strict()
  .passthrough()
const IntegrationSecret: z.ZodType<IntegrationSecret> = z
  .object({
    name: z.string(),
    generation_link: z.union([z.string(), z.null()]).optional(),
    value: z.union([z.string(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const IntegrationDefaultPolicies: z.ZodType<IntegrationDefaultPolicies> = z
  .object({ tools: z.array(BasePolicy) })
  .strict()
  .passthrough()
const IntegrationTemplate: z.ZodType<IntegrationTemplate> = z
  .object({
    version: z.string(),
    name: z.string(),
    repository: z.string(),
    sha: z.string(),
    auth_scheme: z.union([IntegrationAuthScheme, z.null()]).optional(),
    oauth_authorizer: z
      .union([IntegrationOAuthAuthorizer, z.null()])
      .optional(),
    args: MCPIntegrationArgs,
    secrets: z.union([z.array(IntegrationSecret), z.null()]).optional(),
    default_policies: IntegrationDefaultPolicies
  })
  .strict()
  .passthrough()
const IntegrationConfigDetails: z.ZodType<IntegrationConfigDetails> = z
  .object({
    name: z.string(),
    configuration_state: IntegrationConfigurationState,
    template: IntegrationTemplate
  })
  .strict()
  .passthrough()
const IntegrationConfigToolDetails: z.ZodType<IntegrationConfigToolDetails> = z
  .object({
    name: z.string(),
    configuration_state: IntegrationConfigurationState,
    tool_policies: z.record(BasePolicy)
  })
  .strict()
  .passthrough()
const IntegrationConfiguration: z.ZodType<IntegrationConfiguration> = z
  .object({
    created_at: z.union([z.string(), z.null()]).optional(),
    updated_at: z.union([z.string(), z.null()]).optional(),
    id: z.union([z.number(), z.null()]).optional(),
    name: z.string(),
    org_id: z.string(),
    profile_id: z.string(),
    template: IntegrationTemplate,
    configuration_state: IntegrationConfigurationState
  })
  .strict()
  .passthrough()
const IntegrationConfigUpsertResult: z.ZodType<IntegrationConfigUpsertResult> =
  z
    .object({
      integration_config: IntegrationConfiguration,
      state: IntegrationConfigurationState
    })
    .strict()
    .passthrough()
const IntegrationUpsertAttempt: z.ZodType<IntegrationUpsertAttempt> = z
  .object({
    success: z.boolean(),
    error: z.union([z.string(), z.null()]).optional(),
    config: IntegrationConfigUpsertResult,
    runtime: z.union([z.unknown(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const KindMetadata: z.ZodType<KindMetadata> = z
  .object({})
  .partial()
  .strict()
  .passthrough()
const LauncherConfig: z.ZodType<LauncherConfig> = z
  .object({ configMapName: z.string(), mountPath: z.string() })
  .strict()
  .passthrough()
const MCPServerConfig = z
  .object({
    name: z.string(),
    image: z
      .string()
      .optional()
      .default('registry.onegrep.dev/onegrep/mcp-host:latest'),
    git_repo_url: z.union([z.string(), z.null()]).optional(),
    git_branch: z.union([z.string(), z.null()]).optional().default('main'),
    command: z.string(),
    args: z.array(z.string()),
    env_vars: z.record(z.string())
  })
  .strict()
  .passthrough()
const PolicyCheckResult = z
  .object({ approved: z.boolean() })
  .strict()
  .passthrough()
const ServerSpec: z.ZodType<ServerSpec> = z
  .object({
    orgID: z.string(),
    image: z.string(),
    pullPolicy: z.string().optional().default('IfNotPresent'),
    port: z.number().int().optional().default(8000),
    displayName: z.union([z.string(), z.null()]).optional(),
    envFromSources: z
      .union([z.array(z.object({}).partial().strict().passthrough()), z.null()])
      .optional(),
    volumes: z
      .union([z.array(z.object({}).partial().strict().passthrough()), z.null()])
      .optional(),
    volumeMounts: z
      .union([z.array(z.object({}).partial().strict().passthrough()), z.null()])
      .optional(),
    launcherConfig: z.union([LauncherConfig, z.null()]).optional(),
    ingressConfig: z.union([IngressConfig, z.null()]).optional()
  })
  .strict()
  .passthrough()
const Server: z.ZodType<Server> = z
  .object({
    kind: z.string().optional().default('Server'),
    metadata: KindMetadata,
    spec: ServerSpec,
    status: z
      .union([z.object({}).partial().strict().passthrough(), z.null()])
      .optional(),
    apiVersion: z.string()
  })
  .strict()
  .passthrough()
const TraefikIngressRoute: z.ZodType<TraefikIngressRoute> = z
  .object({
    kind: z.string().optional().default('IngressRoute'),
    metadata: KindMetadata,
    spec: IngressConfig,
    status: z.object({}).partial().strict().passthrough(),
    apiVersion: z.string()
  })
  .strict()
  .passthrough()

export const schemas = {
  policy_id,
  action,
  AuditLog,
  PaginationMetadata,
  PaginatedResponse_AuditLog_,
  ValidationError,
  HTTPValidationError,
  RemoteClientConfig,
  AccessPolicyType,
  UserAccount,
  Organization,
  AccountInformation,
  ActionApprovalState,
  ActionApprovalRequest,
  Policy,
  ApprovalAndPolicy,
  Attempt,
  AuthenticationMethod,
  AuthenticationStatus,
  BasePolicy,
  IngressConfig,
  IntegrationAuthScheme,
  IntegrationConfigurationState,
  IntegrationOAuthAuthorizer,
  MCPIntegrationArgs,
  IntegrationSecret,
  IntegrationDefaultPolicies,
  IntegrationTemplate,
  IntegrationConfigDetails,
  IntegrationConfigToolDetails,
  IntegrationConfiguration,
  IntegrationConfigUpsertResult,
  IntegrationUpsertAttempt,
  KindMetadata,
  LauncherConfig,
  MCPServerConfig,
  PolicyCheckResult,
  ServerSpec,
  Server,
  TraefikIngressRoute
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/api/v1/audit/',
    alias: 'get_audit_logs_api_v1_audit__get',
    description: `Gets audit logs visible to the user with pagination and filtering.

- Page numbers start at 1 (not 0)
- Results are sorted by timestamp (newest first)
- Optional filters can be applied for policy_id, action, and date range`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().gte(1).optional().default(1)
      },
      {
        name: 'page_size',
        type: 'Query',
        schema: z.number().int().gte(1).lte(500).optional().default(100)
      },
      {
        name: 'policy_id',
        type: 'Query',
        schema: policy_id
      },
      {
        name: 'action',
        type: 'Query',
        schema: action
      },
      {
        name: 'start_date',
        type: 'Query',
        schema: action
      },
      {
        name: 'end_date',
        type: 'Query',
        schema: action
      }
    ],
    response: PaginatedResponse_AuditLog_,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'get',
    path: '/api/v1/clients/hosts',
    alias: 'get_hosts_clients_api_v1_clients_hosts_get',
    description: `Gets all the remote client configs for the host servers.`,
    requestFormat: 'json',
    response: z.array(RemoteClientConfig)
  },
  {
    method: 'get',
    path: '/api/v1/clients/meta',
    alias: 'get_meta_client_api_v1_clients_meta_get',
    description: `Gets the remote client config for the meta server.`,
    requestFormat: 'json',
    response: RemoteClientConfig
  },
  {
    method: 'get',
    path: '/health',
    alias: 'health_health_get',
    description: `Generic healthcheck endpoint to ensure the service is running.`,
    requestFormat: 'json',
    response: z.unknown()
  }
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
