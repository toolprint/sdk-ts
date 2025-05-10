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
  doppler_service_token_id?:
    | ((string | null) | Array<string | null>)
    | undefined
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
  policy_id: string
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
  created_at?: ((string | null) | Array<string | null>) | undefined
  updated_at?: ((string | null) | Array<string | null>) | undefined
  event_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  access_policy: AccessPolicyType
  organization_id?: ((string | null) | Array<string | null>) | undefined
  canonical_resource_name: string
  id?: string | undefined
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
type Body_upsert_secret_api_v1_secrets__secret_name__put = {
  request: UpsertSecretRequest
}
type UpsertSecretRequest = {
  /**
   * @enum string, object
   */
  value_type: 'string' | 'object'
  value: (string | {}) | Array<string | {}>
}
type HTTPValidationError = Partial<{
  detail: Array<ValidationError>
}>
type ValidationError = {
  loc: Array<(string | number) | Array<string | number>>
  msg: string
  type: string
}
type InitializeResponse = {
  clients: Array<
    MCPToolServerClient | BlaxelToolServerClient | SmitheryToolServerClient
  >
  providers: Array<ToolServerProvider>
  servers: Array<ToolServer>
  tools: Array<Tool>
  doppler_service_token?: ((string | null) | Array<string | null>) | undefined
  doppler_env?: ((string | null) | Array<string | null>) | undefined
  doppler_project?: ((string | null) | Array<string | null>) | undefined
  doppler_config?: ((string | null) | Array<string | null>) | undefined
  user_id: string
  org_id: string
}
type MCPToolServerClient = {
  server_id: string
  client_type: string
  /**
   * @enum sse, websocket
   */
  transport_type: 'sse' | 'websocket'
  /**
   * @minLength 1
   */
  url: string
}
type BlaxelToolServerClient = {
  server_id: string
  client_type: string
  blaxel_workspace: string
  blaxel_function: string
}
type SmitheryToolServerClient = {
  server_id: string
  client_type: string
  connections: Array<SmitheryConnectionInfo>
  launch_config?:
    | ((ToolServerLaunchConfig | null) | Array<ToolServerLaunchConfig | null>)
    | undefined
}
type SmitheryConnectionInfo = {
  /**
   * @enum ws, http
   */
  type: 'ws' | 'http'
  deployment_url?: /**
   * @minLength 1
   */
  string | undefined
  config_schema?:
    | /**
     * @default true
     */
    (({} | boolean) | Array<{} | boolean>)
    | undefined
}
type ToolServerLaunchConfig = {
  source: string
  secret_name: string
}
type ToolServerProvider = {
  id: string
  name: string
}
type ToolServer = {
  provider_id: string
  name: string
  properties?: {} | undefined
  id: string
}
type Tool = {
  server_id: string
  /**
   * The name of the tool (should be unique within a server).
   */
  name: string
  description?:
    | /**
     * A description of the tool.
     */
    ((string | null) | Array<string | null>)
    | undefined
  icon_url?:
    | /**
     * A URL to an icon for the tool.
     */
    (| /**
         * @minLength 1
         */
        (string | null)
        | Array<
            /**
             * @minLength 1
             */
            string | null
          >
      )
    | undefined
  input_schema?:
    | /**
     * A JSON schema for the tool's input (defaults to 'always valid').
     *
     * @default true
     */
    (({} | boolean) | Array<{} | boolean>)
    | undefined
  id: string
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
  tools: Array<PolicyAccessRule>
}
type PolicyAccessRule = {
  event_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  access_policy: AccessPolicyType
}
type NewPolicyRequest = {
  integration_name: string
  event_name: string
  access_policy: AccessPolicyType
}
type NewUserRecipeRequest = {
  /**
   * The goal that this recipe is helping an agent achieve.
   */
  goal: string
  details: RecipeDetails_Input
}
type RecipeDetails_Input = Partial<{
  /**
   * An unsorted list of tools that would be used in this recipe.
   *
   * @default []
   */
  tools: Array<RecipeTool>
}>
type RecipeTool = {
  tool_resource: ToolResourceBase
  usage_instructions?:
    | /**
     * A more in-depth description of this tool and what it should be used for in the context of this recipe.
     */
    ((string | null) | Array<string | null>)
    | undefined
}
type ToolResourceBase = {
  integration_name: string
  tool_name: string
  description?: ((string | null) | Array<string | null>) | undefined
}
type PaginatedResponse_AuditLog_ = {
  items: Array<AuditLog>
  pagination: PaginationMetadata
}
type AuditLog = {
  id?: ((number | null) | Array<number | null>) | undefined
  policy_id: string
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
type PaginatedResponse_UserRecipe_ = {
  items: Array<UserRecipe>
  pagination: PaginationMetadata
}
type UserRecipe = {
  id: number
  /**
   * The goal that this recipe is helping an agent achieve.
   */
  goal: string
  details?: {} | undefined
  /**
   * The organization ID that owns this recipe
   */
  org_id: string
  /**
   * The profile ID within the organization that owns this recipe
   */
  profile_id: string
  created_at?: string | undefined
  details_data: RecipeDetails_Output
}
type RecipeDetails_Output = Partial<{
  /**
   * An unsorted list of tools that would be used in this recipe.
   *
   * @default []
   */
  tools: Array<RecipeTool>
}>
type PolicyBase = {
  event_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  access_policy: AccessPolicyType
  organization_id?: ((string | null) | Array<string | null>) | undefined
  canonical_resource_name: string
}
type Recipe = {
  created_at?: ((string | null) | Array<string | null>) | undefined
  updated_at?: ((string | null) | Array<string | null>) | undefined
  /**
   * The goal that this recipe is helping an agent achieve.
   */
  goal: string
  /**
   * The instructions for this recipe.
   */
  instructions: (string | null) | Array<string | null>
  id?: string | undefined
  tools: Array<Tool>
}
type ScoredItem_Recipe_ = {
  item: Recipe
  /**
   * The score of the item [0, 1].
   *
   * @minimum 0
   * @maximum 1
   */
  score: number
}
type ScoredItem_Tool_ = {
  item: Tool
  /**
   * The score of the item [0, 1].
   *
   * @minimum 0
   * @maximum 1
   */
  score: number
}
type SearchResponse_ScoredItem_Recipe__ = {
  pagination: PaginationMetadata
  results: Array<ScoredItem_Recipe_>
}
type SearchResponse_ScoredItem_Tool__ = {
  pagination: PaginationMetadata
  results: Array<ScoredItem_Tool_>
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
type Strategy = {
  /**
   * The ID of the recipe that was used to generate the strategy.
   */
  recipe_id: string
  /**
   * Instructions to follow the strategy.
   */
  instructions: string
  /**
   * List of one or more fully-hydrated tool resources that should be used in the strategy to achieve the goal.
   */
  tools: Array<ToolResource>
}
type ToolResource = {
  integration_name: string
  tool_name: string
  description?: ((string | null) | Array<string | null>) | undefined
  id: string
  tool: Tool
  org_id: string
  profile_id: string
  policy: PolicyBase
  properties: ToolProperties
  server: ToolServer
  provider: ToolServerProvider
  canonical_resource: CanonicalResource
}
type ToolProperties = {
  tags: {}
}
type CanonicalResource = {
  org_id: string
  profile_id: string
  server_name: string
  event_name: string
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
    api_key: z.string(),
    doppler_service_token_id: z.union([z.string(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const ServiceTokenResponse = z
  .object({
    doppler_service_token: z.union([z.string(), z.null()]),
    doppler_env: z.union([z.string(), z.null()]),
    doppler_project: z.union([z.string(), z.null()]),
    doppler_config: z.union([z.string(), z.null()])
  })
  .partial()
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
    account: UserAccount.describe(
      'Model for storing user information including their API key'
    ),
    organization: Organization
  })
  .strict()
  .passthrough()
const AccountCreateRequest = z
  .object({ invitation_code: z.string(), email: z.string() })
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
const X_ONEGREP_PROFILE_ID = z.union([z.string(), z.null()]).optional()
const UpsertSecretRequest: z.ZodType<UpsertSecretRequest> = z
  .object({
    value_type: z.enum(['string', 'object']),
    value: z.union([z.string(), z.object({}).partial().strict().passthrough()])
  })
  .strict()
  .passthrough()
const Body_upsert_secret_api_v1_secrets__secret_name__put: z.ZodType<Body_upsert_secret_api_v1_secrets__secret_name__put> =
  z.object({ request: UpsertSecretRequest }).strict().passthrough()
const UpsertSecretResponse = z
  .object({ success: z.boolean(), secret_name: z.string() })
  .strict()
  .passthrough()
const ToolServerProvider: z.ZodType<ToolServerProvider> = z
  .object({ id: z.string().uuid(), name: z.string() })
  .strict()
  .passthrough()
const ToolServer: z.ZodType<ToolServer> = z
  .object({
    provider_id: z.string().uuid(),
    name: z.string(),
    properties: z.object({}).partial().strict().passthrough().optional(),
    id: z.string().uuid()
  })
  .strict()
  .passthrough()
const IntegrationConfigurationState = z.enum([
  'agent_local',
  'cloud_hosted_available',
  'cloud_hosted_configured'
])
const IntegrationAuthScheme = z.enum(['token', 'oauth_1_0', 'oauth_2_0'])
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
const AccessPolicyType = z.enum(['ALWAYS', 'NEVER', 'REQUIRES_PERMISSION'])
const PolicyAccessRule: z.ZodType<PolicyAccessRule> = z
  .object({
    event_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    access_policy: AccessPolicyType.describe('Enum for access policy types')
  })
  .strict()
  .passthrough()
const IntegrationDefaultPolicies: z.ZodType<IntegrationDefaultPolicies> = z
  .object({
    tools: z
      .array(PolicyAccessRule)
      .describe('Policies for tools in this integration.')
  })
  .strict()
  .passthrough()
const IntegrationTemplate: z.ZodType<IntegrationTemplate> = z
  .object({
    version: z.string().describe('The version of the integration template.'),
    name: z.string(),
    repository: z.string(),
    sha: z.string(),
    auth_scheme: z.union([IntegrationAuthScheme, z.null()]).optional(),
    oauth_authorizer: z
      .union([IntegrationOAuthAuthorizer, z.null()])
      .optional(),
    args: MCPIntegrationArgs,
    secrets: z.union([z.array(IntegrationSecret), z.null()]).optional(),
    default_policies: IntegrationDefaultPolicies.describe(
      'Default policies for an integration.'
    )
  })
  .strict()
  .passthrough()
const IntegrationConfigDetails: z.ZodType<IntegrationConfigDetails> = z
  .object({
    name: z.string(),
    configuration_state:
      IntegrationConfigurationState.describe(`The state of an integration from an account perspective (not runtime).
To determine the runtime state, we will have to check the server configuration for
the integration separately depending on our infrastucture selection.`),
    template:
      IntegrationTemplate.describe(`Class representation of the server templates that we support. This matches the structure
of server templates under resources/integrations/templates/*`)
  })
  .strict()
  .passthrough()
const Tool: z.ZodType<Tool> = z
  .object({
    server_id: z.string().uuid(),
    name: z
      .string()
      .describe('The name of the tool (should be unique within a server).'),
    description: z
      .union([z.string(), z.null()])
      .describe('A description of the tool.')
      .optional(),
    icon_url: z
      .union([z.string(), z.null()])
      .describe('A URL to an icon for the tool.')
      .optional(),
    input_schema: z
      .union([z.object({}).partial().strict().passthrough(), z.boolean()])
      .describe(
        "A JSON schema for the tool's input (defaults to 'always valid')."
      )
      .optional()
      .default(true),
    id: z.string().uuid()
  })
  .strict()
  .passthrough()
const PolicyBase: z.ZodType<PolicyBase> = z
  .object({
    event_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    access_policy: AccessPolicyType.describe('Enum for access policy types'),
    organization_id: z.union([z.string(), z.null()]).optional(),
    canonical_resource_name: z.string()
  })
  .strict()
  .passthrough()
const ToolProperties: z.ZodType<ToolProperties> = z
  .object({ tags: z.object({}).partial().strict().passthrough() })
  .strict()
  .passthrough()
const CanonicalResource: z.ZodType<CanonicalResource> = z
  .object({
    org_id: z.string(),
    profile_id: z.string(),
    server_name: z.string(),
    event_name: z.string()
  })
  .strict()
  .passthrough()
const ToolResource: z.ZodType<ToolResource> = z
  .object({
    integration_name: z.string(),
    tool_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    id: z.string(),
    tool: Tool.describe('A tool.'),
    org_id: z.string(),
    profile_id: z.string(),
    policy: PolicyBase.describe('Base model with shared policy fields'),
    properties: ToolProperties.describe('Properties for a tool.'),
    server: ToolServer,
    provider: ToolServerProvider,
    canonical_resource: CanonicalResource.describe(
      'Represents a canonical resource name in object form.'
    )
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
const SearchRequest = z
  .object({
    query: z.string().describe('The query used against the search index.'),
    k: z
      .number()
      .int()
      .describe('The number of results to return from index.')
      .optional()
      .default(10),
    min_score: z
      .number()
      .describe('The minimum score to return from index.')
      .optional()
      .default(0),
    page_size: z
      .number()
      .int()
      .describe('The number of results per page.')
      .optional()
      .default(10),
    page: z
      .number()
      .int()
      .describe('The page number to return.')
      .optional()
      .default(0)
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
const ScoredItem_Tool_: z.ZodType<ScoredItem_Tool_> = z
  .object({
    item: Tool.describe('A tool.'),
    score: z.number().gte(0).lte(1).describe('The score of the item [0, 1].')
  })
  .strict()
  .passthrough()
const SearchResponse_ScoredItem_Tool__: z.ZodType<SearchResponse_ScoredItem_Tool__> =
  z
    .object({
      pagination: PaginationMetadata.describe('Metadata for paginated results'),
      results: z.array(ScoredItem_Tool_)
    })
    .strict()
    .passthrough()
const Recipe: z.ZodType<Recipe> = z
  .object({
    created_at: z.union([z.string(), z.null()]).optional(),
    updated_at: z.union([z.string(), z.null()]).optional(),
    goal: z
      .string()
      .describe('The goal that this recipe is helping an agent achieve.'),
    instructions: z
      .union([z.string(), z.null()])
      .describe('The instructions for this recipe.'),
    id: z.string().uuid().optional(),
    tools: z.array(Tool)
  })
  .strict()
  .passthrough()
const ScoredItem_Recipe_: z.ZodType<ScoredItem_Recipe_> = z
  .object({
    item: Recipe.describe('A recipe.'),
    score: z.number().gte(0).lte(1).describe('The score of the item [0, 1].')
  })
  .strict()
  .passthrough()
const SearchResponse_ScoredItem_Recipe__: z.ZodType<SearchResponse_ScoredItem_Recipe__> =
  z
    .object({
      pagination: PaginationMetadata.describe('Metadata for paginated results'),
      results: z.array(ScoredItem_Recipe_)
    })
    .strict()
    .passthrough()
const ToolResourceBase: z.ZodType<ToolResourceBase> = z
  .object({
    integration_name: z.string(),
    tool_name: z.string(),
    description: z.union([z.string(), z.null()]).optional()
  })
  .strict()
  .passthrough()
const RecipeTool: z.ZodType<RecipeTool> = z
  .object({
    tool_resource: ToolResourceBase.describe(
      'Identification details about a tool in an integration.'
    ),
    usage_instructions: z
      .union([z.string(), z.null()])
      .describe(
        'A more in-depth description of this tool and what it should be used for in the context of this recipe.'
      )
      .optional()
  })
  .strict()
  .passthrough()
const RecipeDetails_Output: z.ZodType<RecipeDetails_Output> = z
  .object({
    tools: z
      .array(RecipeTool)
      .describe('An unsorted list of tools that would be used in this recipe.')
      .default([])
  })
  .partial()
  .strict()
  .passthrough()
const UserRecipe: z.ZodType<UserRecipe> = z
  .object({
    id: z.number().int(),
    goal: z
      .string()
      .describe('The goal that this recipe is helping an agent achieve.'),
    details: z.object({}).partial().strict().passthrough().optional(),
    org_id: z.string().describe('The organization ID that owns this recipe'),
    profile_id: z
      .string()
      .describe('The profile ID within the organization that owns this recipe'),
    created_at: z.string().datetime({ offset: true }).optional(),
    details_data: RecipeDetails_Output.describe(
      'Details about a recipe. This is an unordered list of tools that are used in the recipe.'
    )
  })
  .strict()
  .passthrough()
const PaginatedResponse_UserRecipe_: z.ZodType<PaginatedResponse_UserRecipe_> =
  z
    .object({
      items: z.array(UserRecipe),
      pagination: PaginationMetadata.describe('Metadata for paginated results')
    })
    .strict()
    .passthrough()
const RecipeDetails_Input: z.ZodType<RecipeDetails_Input> = z
  .object({
    tools: z
      .array(RecipeTool)
      .describe('An unsorted list of tools that would be used in this recipe.')
      .default([])
  })
  .partial()
  .strict()
  .passthrough()
const NewUserRecipeRequest: z.ZodType<NewUserRecipeRequest> = z
  .object({
    goal: z
      .string()
      .describe('The goal that this recipe is helping an agent achieve.'),
    details: RecipeDetails_Input.describe(
      'Details about a recipe. This is an unordered list of tools that are used in the recipe.'
    )
  })
  .strict()
  .passthrough()
const Strategy: z.ZodType<Strategy> = z
  .object({
    recipe_id: z
      .string()
      .uuid()
      .describe('The ID of the recipe that was used to generate the strategy.'),
    instructions: z.string().describe('Instructions to follow the strategy.'),
    tools: z
      .array(ToolResource)
      .describe(
        'List of one or more fully-hydrated tool resources that should be used in the strategy to achieve the goal.'
      )
  })
  .strict()
  .passthrough()
const ToolServerProperties = z
  .object({ properties: z.object({}).partial().strict().passthrough() })
  .strict()
  .passthrough()
const MCPToolServerClient: z.ZodType<MCPToolServerClient> = z
  .object({
    server_id: z.string().uuid(),
    client_type: z.string(),
    transport_type: z.enum(['sse', 'websocket']),
    url: z.string().min(1).url()
  })
  .strict()
  .passthrough()
const BlaxelToolServerClient: z.ZodType<BlaxelToolServerClient> = z
  .object({
    server_id: z.string().uuid(),
    client_type: z.string(),
    blaxel_workspace: z.string(),
    blaxel_function: z.string()
  })
  .strict()
  .passthrough()
const SmitheryConnectionInfo: z.ZodType<SmitheryConnectionInfo> = z
  .object({
    type: z.enum(['ws', 'http']),
    deployment_url: z.string().min(1).url().optional(),
    config_schema: z
      .union([z.object({}).partial().strict().passthrough(), z.boolean()])
      .optional()
      .default(true)
  })
  .strict()
  .passthrough()
const ToolServerLaunchConfig: z.ZodType<ToolServerLaunchConfig> = z
  .object({ source: z.string(), secret_name: z.string() })
  .strict()
  .passthrough()
const SmitheryToolServerClient: z.ZodType<SmitheryToolServerClient> = z
  .object({
    server_id: z.string().uuid(),
    client_type: z.string(),
    connections: z.array(SmitheryConnectionInfo),
    launch_config: z.union([ToolServerLaunchConfig, z.null()]).optional()
  })
  .strict()
  .passthrough()
const Policy: z.ZodType<Policy> = z
  .object({
    created_at: z.union([z.string(), z.null()]).optional(),
    updated_at: z.union([z.string(), z.null()]).optional(),
    event_name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    access_policy: AccessPolicyType.describe('Enum for access policy types'),
    organization_id: z.union([z.string(), z.null()]).optional(),
    canonical_resource_name: z.string(),
    id: z.string().uuid().optional()
  })
  .strict()
  .passthrough()
const NewPolicyRequest: z.ZodType<NewPolicyRequest> = z
  .object({
    integration_name: z.string(),
    event_name: z.string(),
    access_policy: AccessPolicyType.describe('Enum for access policy types')
  })
  .strict()
  .passthrough()
const ActionApprovalState = z.enum(['pending', 'approved', 'rejected'])
const ActionApprovalRequest: z.ZodType<ActionApprovalRequest> = z
  .object({
    id: z.union([z.number(), z.null()]),
    policy_id: z.string().uuid(),
    state: ActionApprovalState.describe(
      'Enum for policy approval states'
    ).optional(),
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
    approval:
      ActionApprovalRequest.describe(`Model that holds the state of a request for an action to be taken with respect to a policy.
Ex. if the policy is set to require approval, then we will have a request for approval.`),
    policy: Policy.describe(
      'Policy model that works with both SQL and in-memory storage'
    ),
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
const policy_id = z
  .union([z.string(), z.null()])
  .describe('Filter by policy ID')
  .optional()
const action = z
  .union([z.string(), z.null()])
  .describe('Filter by action type')
  .optional()
const start_date = z
  .union([z.string(), z.null()])
  .describe('Filter logs after this date (ISO format)')
  .optional()
const end_date = z
  .union([z.string(), z.null()])
  .describe('Filter logs before this date (ISO format)')
  .optional()
const AuditLog: z.ZodType<AuditLog> = z
  .object({
    id: z.union([z.number(), z.null()]).optional(),
    policy_id: z.string().uuid(),
    action: z.string(),
    details: z.object({}).partial().strict().passthrough().optional(),
    performed_by: z.string().optional().default('system'),
    timestamp: z.string().datetime({ offset: true }).optional()
  })
  .strict()
  .passthrough()
const PaginatedResponse_AuditLog_: z.ZodType<PaginatedResponse_AuditLog_> = z
  .object({
    items: z.array(AuditLog),
    pagination: PaginationMetadata.describe('Metadata for paginated results')
  })
  .strict()
  .passthrough()
const InitializeResponse: z.ZodType<InitializeResponse> = z
  .object({
    clients: z.array(
      z.union([
        MCPToolServerClient,
        BlaxelToolServerClient,
        SmitheryToolServerClient
      ])
    ),
    providers: z.array(ToolServerProvider),
    servers: z.array(ToolServer),
    tools: z.array(Tool),
    doppler_service_token: z.union([z.string(), z.null()]).optional(),
    doppler_env: z.union([z.string(), z.null()]).optional(),
    doppler_project: z.union([z.string(), z.null()]).optional(),
    doppler_config: z.union([z.string(), z.null()]).optional(),
    user_id: z.string(),
    org_id: z.string()
  })
  .strict()
  .passthrough()
const CreateInvitationRequest = z
  .object({
    email: z.string().email(),
    org_id: z.union([z.string(), z.null()]).optional(),
    expires_in_days: z.number().int().optional().default(7)
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
const Invitation = z
  .object({
    code: z.string().optional(),
    org_id: z.string(),
    email: z.string().email(),
    created_at: z.string().datetime({ offset: true }).optional(),
    expires_at: z.string().datetime({ offset: true }).optional(),
    accepted: z.boolean().optional().default(false),
    accepted_at: z.union([z.string(), z.null()]).optional()
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
  AuthenticationMethod,
  AuthenticationStatus,
  UserAccount,
  ServiceTokenResponse,
  Organization,
  AccountInformation,
  AccountCreateRequest,
  ValidationError,
  HTTPValidationError,
  X_ONEGREP_PROFILE_ID,
  UpsertSecretRequest,
  Body_upsert_secret_api_v1_secrets__secret_name__put,
  UpsertSecretResponse,
  ToolServerProvider,
  ToolServer,
  IntegrationConfigurationState,
  IntegrationAuthScheme,
  IntegrationOAuthAuthorizer,
  MCPIntegrationArgs,
  IntegrationSecret,
  AccessPolicyType,
  PolicyAccessRule,
  IntegrationDefaultPolicies,
  IntegrationTemplate,
  IntegrationConfigDetails,
  Tool,
  PolicyBase,
  ToolProperties,
  CanonicalResource,
  ToolResource,
  ToolCustomTagsParamsRequest,
  ToolCustomTagSelectionParamsRequest,
  MultipleToolCustomTagsParamsRequest,
  SearchRequest,
  PaginationMetadata,
  ScoredItem_Tool_,
  SearchResponse_ScoredItem_Tool__,
  Recipe,
  ScoredItem_Recipe_,
  SearchResponse_ScoredItem_Recipe__,
  ToolResourceBase,
  RecipeTool,
  RecipeDetails_Output,
  UserRecipe,
  PaginatedResponse_UserRecipe_,
  RecipeDetails_Input,
  NewUserRecipeRequest,
  Strategy,
  ToolServerProperties,
  MCPToolServerClient,
  BlaxelToolServerClient,
  SmitheryConnectionInfo,
  ToolServerLaunchConfig,
  SmitheryToolServerClient,
  Policy,
  NewPolicyRequest,
  ActionApprovalState,
  ActionApprovalRequest,
  ApprovalAndPolicy,
  PolicyCheckResult,
  policy_id,
  action,
  start_date,
  end_date,
  AuditLog,
  PaginatedResponse_AuditLog_,
  InitializeResponse,
  CreateInvitationRequest,
  IngressConfig,
  Invitation,
  KindMetadata,
  LauncherConfig,
  MCPServerConfig,
  RemoteClientConfig,
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
    path: '/api/v1/account/service-token',
    alias: 'get_service_token_api_v1_account_service_token_get',
    description: `Returns the service token information for the authenticated user.`,
    requestFormat: 'json',
    response: ServiceTokenResponse
  },
  {
    method: 'post',
    path: '/api/v1/account/service-token',
    alias: 'rotate_service_token_api_v1_account_service_token_post',
    requestFormat: 'json',
    response: ServiceTokenResponse
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
        schema: z
          .number()
          .int()
          .gte(1)
          .describe('Page number (1-indexed)')
          .optional()
          .default(1)
      },
      {
        name: 'page_size',
        type: 'Query',
        schema: z
          .number()
          .int()
          .gte(1)
          .lte(500)
          .describe('Items per page')
          .optional()
          .default(100)
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
        schema: start_date
      },
      {
        name: 'end_date',
        type: 'Query',
        schema: end_date
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
    path: '/api/v1/integrations/',
    alias: 'list_integrations_api_v1_integrations__get',
    description: `Lists all available integrations for a user&#x27;s organization.
If active is true, only returns integrations that have an active tool server.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'active',
        type: 'Query',
        schema: z.boolean().optional().default(false)
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z.array(IntegrationConfigDetails),
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
        schema: z.string()
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
        schema: z.string()
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
        schema: z.string().uuid()
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
    path: '/api/v1/providers/',
    alias: 'list_providers_api_v1_providers__get',
    requestFormat: 'json',
    response: z.array(ToolServerProvider)
  },
  {
    method: 'get',
    path: '/api/v1/providers/:provider_id',
    alias: 'get_provider_api_v1_providers__provider_id__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'provider_id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ToolServerProvider,
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
    path: '/api/v1/providers/:provider_id/servers',
    alias: 'get_servers_api_v1_providers__provider_id__servers_get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'provider_id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.array(ToolServer),
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
    path: '/api/v1/providers/:provider_id/sync',
    alias: 'sync_provider_api_v1_providers__provider_id__sync_post',
    requestFormat: 'json',
    parameters: [
      {
        name: 'provider_id',
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
    path: '/api/v1/recipes/',
    alias: 'list_recipes_api_v1_recipes__get',
    description: `List all recipes for the current user with pagination.

- Page numbers start at 1 (not 0)
- Results are sorted by creation date (newest first)
- Filtered by the user&#x27;s organization and optionally by profile
- Profile can be specified via the X-ONEGREP-PROFILE-ID header`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'page',
        type: 'Query',
        schema: z
          .number()
          .int()
          .gte(1)
          .describe('Page number (1-indexed)')
          .optional()
          .default(1)
      },
      {
        name: 'page_size',
        type: 'Query',
        schema: z
          .number()
          .int()
          .gte(1)
          .lte(100)
          .describe('Items per page')
          .optional()
          .default(20)
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: PaginatedResponse_UserRecipe_,
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
    path: '/api/v1/recipes/',
    alias: 'create_recipe_api_v1_recipes__post',
    description: `Create a new recipe.

- Profile ID is specified via the X-ONEGREP-PROFILE-ID header
- If no profile ID is provided in the header, uses the organization&#x27;s default profile`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: NewUserRecipeRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: Recipe,
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
    path: '/api/v1/recipes/:recipe_id',
    alias: 'get_recipe_api_v1_recipes__recipe_id__get',
    description: `Get a specific recipe by ID.

The recipe must belong to the user&#x27;s organization.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'recipe_id',
        type: 'Path',
        schema: z.number().int()
      }
    ],
    response: Recipe,
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
    path: '/api/v1/sdk/initialize',
    alias: 'initialize_api_v1_sdk_initialize_get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: InitializeResponse,
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
    path: '/api/v1/sdk/service-token',
    alias: 'get_service_token_api_v1_sdk_service_token_get',
    description: `Returns the service token information for the authenticated user.`,
    requestFormat: 'json',
    response: ServiceTokenResponse
  },
  {
    method: 'post',
    path: '/api/v1/search/recipes',
    alias: 'search_recipes_api_v1_search_recipes_post',
    description: `Searches for the best set of recipes that semantically match the query and returns them
along with a similarity score for each recipe.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SearchRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: SearchResponse_ScoredItem_Recipe__,
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
    path: '/api/v1/search/reindex',
    alias: 'reindex_api_v1_search_reindex_post',
    description: `Reindexes all tools and recipes for an organization.`,
    requestFormat: 'json',
    response: z.unknown()
  },
  {
    method: 'post',
    path: '/api/v1/search/reindex/recipes',
    alias: 'reindex_recipes_api_v1_search_reindex_recipes_post',
    description: `Reindexes all recipes for an organization.`,
    requestFormat: 'json',
    response: z.unknown()
  },
  {
    method: 'post',
    path: '/api/v1/search/reindex/tools',
    alias: 'reindex_tools_api_v1_search_reindex_tools_post',
    description: `Reindexes all tools for an organization.`,
    requestFormat: 'json',
    response: z.unknown()
  },
  {
    method: 'post',
    path: '/api/v1/search/tools',
    alias: 'search_tools_api_v1_search_tools_post',
    description: `Searches for the best set of tools that semantically match the query and returns them
along with a similarity score for each tool.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SearchRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: SearchResponse_ScoredItem_Tool__,
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
    path: '/api/v1/secrets/',
    alias: 'get_secrets_api_v1_secrets__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
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
    path: '/api/v1/secrets/:secret_name',
    alias: 'get_secret_api_v1_secrets__secret_name__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'secret_name',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z.object({}).partial().strict().passthrough(),
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
    path: '/api/v1/secrets/:secret_name',
    alias: 'upsert_secret_api_v1_secrets__secret_name__put',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: Body_upsert_secret_api_v1_secrets__secret_name__put
      },
      {
        name: 'secret_name',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: UpsertSecretResponse,
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
    path: '/api/v1/servers/',
    alias: 'list_servers_api_v1_servers__get',
    requestFormat: 'json',
    response: z.array(ToolServer)
  },
  {
    method: 'get',
    path: '/api/v1/servers/:server_id',
    alias: 'get_server_api_v1_servers__server_id__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'server_id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: ToolServer,
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
    path: '/api/v1/servers/:server_id/client',
    alias: 'get_server_client_api_v1_servers__server_id__client_get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'server_id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z.union([
      MCPToolServerClient,
      BlaxelToolServerClient,
      SmitheryToolServerClient
    ]),
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
    path: '/api/v1/servers/:server_id/properties',
    alias: 'get_server_properties_api_v1_servers__server_id__properties_get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'server_id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z
      .object({ properties: z.object({}).partial().strict().passthrough() })
      .strict()
      .passthrough(),
    errors: [
      {
        status: 422,
        description: `Validation Error`,
        schema: HTTPValidationError
      }
    ]
  },
  {
    method: 'patch',
    path: '/api/v1/servers/:server_id/properties/:key',
    alias:
      'patch_server_properties_api_v1_servers__server_id__properties__key__patch',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({}).partial().strict().passthrough()
      },
      {
        name: 'server_id',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'key',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: z
      .object({ properties: z.object({}).partial().strict().passthrough() })
      .strict()
      .passthrough(),
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
    path: '/api/v1/strategy/',
    alias: 'get_strategy_api_v1_strategy__post',
    description: `Gets a strategy for a given goal.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SearchRequest
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z.array(Strategy),
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
    path: '/api/v1/strategy/fake',
    alias: 'create_fake_recipes_api_v1_strategy_fake_post',
    description: `Creates fake strategies for testing purposes.`,
    requestFormat: 'json',
    response: z.array(Recipe)
  },
  {
    method: 'get',
    path: '/api/v1/tools/',
    alias: 'list_tools_api_v1_tools__get',
    description: `List all tools for the current user.`,
    requestFormat: 'json',
    response: z.array(Tool)
  },
  {
    method: 'get',
    path: '/api/v1/tools/:tool_id',
    alias: 'get_tool_api_v1_tools__tool_id__get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'tool_id',
        type: 'Path',
        schema: z.string()
      }
    ],
    response: Tool,
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
    path: '/api/v1/tools/:tool_id/properties',
    alias: 'get_tool_properties_api_v1_tools__tool_id__properties_get',
    requestFormat: 'json',
    parameters: [
      {
        name: 'tool_id',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'X-ONEGREP-PROFILE-ID',
        type: 'Header',
        schema: X_ONEGREP_PROFILE_ID
      }
    ],
    response: z
      .object({ tags: z.object({}).partial().strict().passthrough() })
      .strict()
      .passthrough(),
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
    path: '/api/v1/tools/:tool_id/resource',
    alias: 'get_tool_resource_api_v1_tools__tool_id__resource_get',
    description: `Returns the hydrated details for a tool given the current user and profile.`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'tool_id',
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
