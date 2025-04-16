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
type NewPolicyRequest = {
  integration_name: string
  event_name: string
  access_policy: AccessPolicyType
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
type ToolResource = {
  integration_name: string
  tool_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  id: string
  policy: BasePolicy
  custom_properties?:
    | ((ToolCustomProperties | null) | Array<ToolCustomProperties | null>)
    | undefined
}
type ToolCustomProperties = {
  tool_name: string
  tags?: {} | undefined
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

const AccessPolicyType = z.enum(['ALWAYS', 'NEVER', 'REQUIRES_PERMISSION'])
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
const NewPolicyRequest: z.ZodType<NewPolicyRequest> = z
  .object({
    integration_name: z.string(),
    event_name: z.string(),
    access_policy: AccessPolicyType
  })
  .strict()
  .passthrough()
const X_ONEGREP_PROFILE_ID = z.union([z.string(), z.null()]).optional()
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
const PolicyCheckResult = z
  .object({ approved: z.boolean() })
  .strict()
  .passthrough()
const policy_id = z.union([z.number(), z.null()]).optional()
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
const AccountCreateRequest = z
  .object({ invitation_code: z.string(), email: z.string() })
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
const BasePolicy: z.ZodType<BasePolicy> = z
  .object({
    event_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    access_policy: AccessPolicyType
  })
  .strict()
  .passthrough()
const ToolCustomProperties: z.ZodType<ToolCustomProperties> = z
  .object({
    tool_name: z.string(),
    tags: z.object({}).partial().strict().passthrough().optional()
  })
  .strict()
  .passthrough()
const ToolResource: z.ZodType<ToolResource> = z
  .object({
    integration_name: z.string(),
    tool_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    id: z.string(),
    policy: BasePolicy,
    custom_properties: z.union([ToolCustomProperties, z.null()]).optional()
  })
  .strict()
  .passthrough()
const ToolCustomTagsParamsRequest = z
  .object({
    integration_name: z.string(),
    tool_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    tags: z.object({}).partial().strict().passthrough()
  })
  .strict()
  .passthrough()
const ToolCustomTagSelectionParamsRequest = z
  .object({
    integration_name: z.string(),
    tool_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    tags: z.array(z.string())
  })
  .strict()
  .passthrough()
const MultipleToolCustomTagsParamsRequest = z
  .object({
    tool_names: z.array(z.string()),
    tags: z.object({}).partial().strict().passthrough()
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
  AccessPolicyType,
  Policy,
  ValidationError,
  HTTPValidationError,
  NewPolicyRequest,
  X_ONEGREP_PROFILE_ID,
  ActionApprovalState,
  ActionApprovalRequest,
  ApprovalAndPolicy,
  PolicyCheckResult,
  policy_id,
  AuditLog,
  PaginationMetadata,
  PaginatedResponse_AuditLog_,
  AuthenticationMethod,
  AuthenticationStatus,
  UserAccount,
  Organization,
  AccountInformation,
  AccountCreateRequest,
  RemoteClientConfig,
  BasePolicy,
  ToolCustomProperties,
  ToolResource,
  ToolCustomTagsParamsRequest,
  ToolCustomTagSelectionParamsRequest,
  MultipleToolCustomTagsParamsRequest,
  IngressConfig,
  KindMetadata,
  LauncherConfig,
  MCPServerConfig,
  ServerSpec,
  Server,
  TraefikIngressRoute
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/api/v1/account/',
    alias: 'get_account_information_api_v1_account__get',
    requestFormat: 'json',
    response: AccountInformation
  },
  {
    method: 'post',
    path: '/api/v1/account/',
    alias: 'create_account_api_v1_account__post',
    description: `Creates a new account for the authenticated user with an API key and organization.`,
    requestFormat: 'json',
    response: AccountInformation
  },
  {
    method: 'delete',
    path: '/api/v1/account/',
    alias: 'delete_account_api_v1_account__delete',
    requestFormat: 'json',
    response: z.boolean()
  },
  {
    method: 'get',
    path: '/api/v1/account/api-key',
    alias: 'get_api_key_api_v1_account_api_key_get',
    description: `Returns the API key information for the authenticated user.`,
    requestFormat: 'json',
    response: UserAccount
  },
  {
    method: 'get',
    path: '/api/v1/account/auth/status',
    alias: 'get_auth_status_api_v1_account_auth_status_get',
    description: `Returns the authentications state of the caller. Will read their API Key or JWT and then determine
if a OneGrep account exists. If yes, then it will be considered authenticated.

# ! NOTE: The User may have a valid JWT but if they do not have a OneGrep account, they will not be considered authenticated.`,
    requestFormat: 'json',
    response: AuthenticationStatus
  },
  {
    method: 'post',
    path: '/api/v1/account/invitation-code',
    alias: 'create_account_by_invitation_api_v1_account_invitation_code_post',
    description: `Creates a new account given an authenticated user and a valid invitation code.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: AccountCreateRequest
      }
    ],
    response: AccountInformation,
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
        schema: X_ONEGREP_PROFILE_ID
      },
      {
        name: 'start_date',
        type: 'Query',
        schema: X_ONEGREP_PROFILE_ID
      },
      {
        name: 'end_date',
        type: 'Query',
        schema: X_ONEGREP_PROFILE_ID
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
    path: '/api/v1/integrations/:integration_name/tools',
    alias:
      'get_integration_tools_api_v1_integrations__integration_name__tools_get',
    description: `Returns details for a tool in an integration available to a user.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'integration_name',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z.array(ToolResource),
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
    path: '/api/v1/integrations/:integration_name/tools/:tool_name',
    alias:
      'get_tool_details_api_v1_integrations__integration_name__tools__tool_name__get',
    description: `Returns the details for a tool in an integration.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'integration_name',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'tool_name',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: ToolResource,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'post',
    path: '/api/v1/integrations/:integration_name/tools/:tool_name/custom/tags',
    alias:
      'upsert_tool_custom_tags_api_v1_integrations__integration_name__tools__tool_name__custom_tags_post',
    description: `Upserts custom tags for a tool in an integration. Will not delete any existing tags but will update any
overlapping tags that are already set.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ToolCustomTagsParamsRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: ToolResource,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'delete',
    path: '/api/v1/integrations/:integration_name/tools/:tool_name/custom/tags',
    alias:
      'delete_tool_custom_tags_api_v1_integrations__integration_name__tools__tool_name__custom_tags_delete',
    description: `Deletes custom tags for a tool in an integration.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ToolCustomTagSelectionParamsRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: ToolResource,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'post',
    path: '/api/v1/integrations/:integration_name/tools/custom/tags',
    alias:
      'upsert_multiple_tool_custom_tags_api_v1_integrations__integration_name__tools_custom_tags_post',
    description: `Upserts custom tags for multiple tools in an integration.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: MultipleToolCustomTagsParamsRequest
      },
      {
        name: 'integration_name',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z.array(ToolResource),
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
    path: '/api/v1/policies/',
    alias: 'get_all_policies_api_v1_policies__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'skip',
        type: 'Query',
        schema: z.number().int().optional().default(0)
      },
      {
        name: 'limit',
        type: 'Query',
        schema: z.number().int().optional().default(100)
      }
    ],
    response: z.array(Policy),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'post',
    path: '/api/v1/policies/',
    alias: 'create_policy_api_v1_policies__post',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: NewPolicyRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: Policy,
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
    path: '/api/v1/policies/:policy_id',
    alias: 'get_policy_api_v1_policies__policy_id__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'policy_id',
        type: 'Path',
        schema: z.number().int()
      }
    ],
    response: Policy,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'put',
    path: '/api/v1/policies/:policy_id',
    alias: 'update_policy_api_v1_policies__policy_id__put',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({}).partial().strict().passthrough()
      },
      {
        name: 'policy_id',
        type: 'Path',
        schema: z.number().int()
      }
    ],
    response: Policy,
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'post',
    path: '/api/v1/policies/:policy_id/:audit_id/status',
    alias:
      'check_policy_status_api_v1_policies__policy_id___audit_id__status_post',
    requestFormat: 'json',
    parameters: [
      {
        name: 'policy_id',
        type: 'Path',
        schema: z.number().int()
      },
      {
        name: 'audit_id',
        type: 'Path',
        schema: z.number().int()
      }
    ],
    response: z.unknown(),
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
    path: '/api/v1/policies/approvals',
    alias: 'get_approval_requests_api_v1_policies_approvals_get',
    description: `Get all approval requests visible to the user with their associated policies and resource details.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z.number().int().optional().default(0)
      },
      {
        name: 'page_size',
        type: 'Query',
        schema: z.number().int().optional().default(100)
      }
    ],
    response: z.array(ApprovalAndPolicy),
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
    path: '/api/v1/policies/resources/:resource_name/approval',
    alias:
      'check_resource_for_approval_api_v1_policies_resources__resource_name__approval_get',
    description: `Checks the policy that is associated with a resource if it requires approval, if yes, this will create an approval request. If the policy indicates that
it does require approval, this will wait for the user to approve or reject the request before returning back the final
response and HTTP CODE. 200 &#x3D; approved or didn&#x27;t require approval, 403 &#x3D; rejected by the user.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'resource_name',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.unknown(),
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
    path: '/api/v1/policies/resources/check',
    alias: 'check_resource_access_get_api_v1_policies_resources_check_get',
    requestFormat: 'json',
    response: z.object({ approved: z.boolean() }).strict().passthrough()
  },
  {
    method: 'post',
    path: '/api/v1/policies/resources/check',
    alias: 'check_resource_access_api_v1_policies_resources_check_post',
    description: `Generic endpoint to check resource access.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z.object({ approved: z.boolean() }).strict().passthrough(),
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
