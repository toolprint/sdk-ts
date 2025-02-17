import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

type AccountInformation = {
  user_id: string
  account: UserAccount
  organization: Organization
}
type UserAccount = {
  user_id: string
  belongs_to_organization_id?:
    | ((string | null) | Array<string | null>)
    | undefined
  api_key: string
  created_at?: string | undefined
  last_active?: string | undefined
}
type Organization = {
  id: string
  owner_id?: ((string | null) | Array<string | null>) | undefined
  created_by_user_id: string
  created_at?: string | undefined
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
  resource_name: string
  integration_name: string
  tool_name: string
}
type Policy = {
  resource_name: string
  access_policy: AccessPolicyType
  id?: ((number | null) | Array<number | null>) | undefined
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
type HTTPValidationError = Partial<{
  detail: Array<ValidationError>
}>
type ValidationError = {
  loc: Array<(string | number) | Array<string | number>>
  msg: string
  type: string
}
type NewPolicyRequest = {
  resource_name: string
  access_policy: AccessPolicyType
}
type Server = {
  kind?: /**
   * @default "Server"
   */
  string | undefined
  metadata: KindMetadata
  spec: ServerSpec
  status: {}
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
}
type TraefikIngressRoute = {
  kind?: /**
   * @default "IngressRoute"
   */
  string | undefined
  metadata: KindMetadata
  spec: {}
  status: {}
  apiVersion: string
} & {
  [key: string]: any
}

const profile_id = z.union([z.string(), z.null()]).optional()
const RemoteClientConfig = z
  .object({
    org_id: z.string(),
    name: z.string(),
    display_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    ready: z.boolean(),
    endpoint: z.string().optional(),
    required_headers: z.union([z.record(z.string()), z.null()]).optional()
  })
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
const AccessPolicyType = z.enum(['ALWAYS', 'NEVER', 'REQUIRES_PERMISSION'])
const UserAccount: z.ZodType<UserAccount> = z
  .object({
    user_id: z.string(),
    belongs_to_organization_id: z.union([z.string(), z.null()]).optional(),
    api_key: z.string(),
    created_at: z.string().datetime({ offset: true }).optional(),
    last_active: z.string().datetime({ offset: true }).optional()
  })
  .strict()
  .passthrough()
const Organization: z.ZodType<Organization> = z
  .object({
    id: z.string(),
    owner_id: z.union([z.string(), z.null()]).optional(),
    created_by_user_id: z.string(),
    created_at: z.string().datetime({ offset: true }).optional()
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
    resource_name: z.string(),
    access_policy: AccessPolicyType,
    id: z.union([z.number(), z.null()]).optional(),
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
    resource_name: z.string(),
    integration_name: z.string(),
    tool_name: z.string()
  })
  .strict()
  .passthrough()
const AuditLog = z
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
const AuthenticationStatus = z
  .object({
    authenticated: z.boolean(),
    auth_method: z
      .union([z.enum(['propelauth', 'api_key']), z.null()])
      .optional(),
    user_id: z.union([z.string(), z.null()]).optional()
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
    serverIsDefault: z.union([z.boolean(), z.null()]).optional().default(false)
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
const NewPolicyRequest: z.ZodType<NewPolicyRequest> = z
  .object({ resource_name: z.string(), access_policy: AccessPolicyType })
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
    status: z.object({}).partial().strict().passthrough(),
    apiVersion: z.string()
  })
  .strict()
  .passthrough()
const TraefikIngressRoute: z.ZodType<TraefikIngressRoute> = z
  .object({
    kind: z.string().optional().default('IngressRoute'),
    metadata: KindMetadata,
    spec: z.object({}).partial().strict().passthrough(),
    status: z.object({}).partial().strict().passthrough(),
    apiVersion: z.string()
  })
  .strict()
  .passthrough()

export const schemas = {
  profile_id,
  RemoteClientConfig,
  ValidationError,
  HTTPValidationError,
  AccessPolicyType,
  UserAccount,
  Organization,
  AccountInformation,
  ActionApprovalState,
  ActionApprovalRequest,
  Policy,
  ApprovalAndPolicy,
  AuditLog,
  AuthenticationStatus,
  IngressConfig,
  KindMetadata,
  LauncherConfig,
  MCPServerConfig,
  NewPolicyRequest,
  PolicyCheckResult,
  ServerSpec,
  Server,
  TraefikIngressRoute
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/api/v1/clients/hosts',
    alias: 'get_hosts_clients_api_v1_clients_hosts_get',
    description: `Gets all the remote client configs for the host servers.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'profile_id',
        type: 'Query',
        schema: profile_id
      }
    ],
    response: z.array(RemoteClientConfig),
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
    path: '/api/v1/clients/meta',
    alias: 'get_meta_client_api_v1_clients_meta_get',
    description: `Gets the remote client config for the meta server.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'profile_id',
        type: 'Query',
        schema: profile_id
      }
    ],
    response: RemoteClientConfig,
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
