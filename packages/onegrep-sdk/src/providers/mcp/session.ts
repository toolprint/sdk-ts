import {
  Client,
  ClientOptions
} from '@modelcontextprotocol/sdk/client/index.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { Implementation } from '@modelcontextprotocol/sdk/types.js'

import { log } from '~/core/log.js'

class SettableTimer {
  private timer?: NodeJS.Timeout

  constructor(
    private readonly timeoutMs: number,
    private readonly callback: () => Promise<void>
  ) {
    this.timer = undefined
    this.timeoutMs = timeoutMs
    this.callback = callback
  }

  isRunning() {
    return this.timer !== undefined
  }

  start() {
    this.timer = setTimeout(() => {
      this.callback().catch((err: Error) => {
        // We had an error with the callback, log and move on
        log.error(err.stack)
      })
    }, this.timeoutMs)
    log.debug(`Started timer for ${this.timeoutMs}ms`)
  }

  reset() {
    this.stop()
    this.start()
  }

  stop() {
    if (this.isRunning()) {
      clearTimeout(this.timer)
      this.timer = undefined
      log.debug(`Stopped timer`)
    }
  }
}

type ClientWithCallbacksPingResult = Awaited<
  ReturnType<typeof Client.prototype.ping>
>
type ClientWithCallbacksListToolsResult = Awaited<
  ReturnType<typeof Client.prototype.listTools>
>
type ClientWithCallbacksCallToolResult = Awaited<
  ReturnType<typeof Client.prototype.callTool>
>

export class ClientWithCallbacks extends Client {
  private callbacks: Map<string, () => Promise<void>>
  private supportedMethods: Set<string> = new Set([
    'ping',
    'listTools',
    'callTool'
  ])

  constructor(_clientInfo: Implementation, options?: ClientOptions) {
    super(_clientInfo, options)
    this.callbacks = new Map()
  }

  registerCallback(method: string, callback: () => Promise<void>) {
    if (!this.supportedMethods.has(method)) {
      throw new Error(`Method ${method} is not supported`)
    }
    this.callbacks.set(method, callback)
  }

  async ping(options?: any): Promise<ClientWithCallbacksPingResult> {
    const result = await super.ping(options)
    const callback = this.callbacks.get('ping')
    if (callback) {
      await callback()
    }
    return result
  }

  async listTools(
    params?: any,
    options?: any
  ): Promise<ClientWithCallbacksListToolsResult> {
    const result = await super.listTools(params, options)
    const callback = this.callbacks.get('listTools')
    if (callback) {
      await callback()
    }
    return result
  }

  async callTool(
    params: any,
    options?: any
  ): Promise<ClientWithCallbacksCallToolResult> {
    const result = await super.callTool(params, options)
    const callback = this.callbacks.get('callTool')
    if (callback) {
      await callback()
    }
    return result
  }
}

export interface ClientSession {
  get client(): Client
  get sessionId(): string | undefined

  connect(): Promise<void>
  close(): Promise<void>
}

export interface AutoCloseableClientSession extends ClientSession {
  resetAutoCloseTimer(): void
}

export interface RefreshableClientSession extends ClientSession {
  refresh(): Promise<void>
}

// TODO: make this configurable?
function newCallbackClient(clientOptions?: ClientOptions) {
  const _clientInfo: Implementation = {
    name: 'MultiTransport MCP Client',
    version: '1.0.0'
  }
  const options = clientOptions ?? {
    capabilities: {
      tools: {}
    }
  }
  const callbacksClient = new ClientWithCallbacks(_clientInfo, options)

  return callbacksClient
}

export class SingleTransportClientSession
  implements AutoCloseableClientSession
{
  private mcpClient: Client
  private transport: Transport
  private autoCloseTimer: SettableTimer

  constructor(
    transport: Transport,
    clientOptions?: ClientOptions,
    autoCloseTimeoutMs: number = 5000
  ) {
    this.transport = transport

    const callbacksClient = newCallbackClient(clientOptions)
    callbacksClient.registerCallback('ping', async () => {
      log.debug('Ping callback')
    })
    callbacksClient.registerCallback('listTools', async () => {
      log.debug('List tools callback')
      this.resetAutoCloseTimer()
    })
    callbacksClient.registerCallback('callTool', async () => {
      log.debug('Call tool callback')
      this.resetAutoCloseTimer()
    })

    this.mcpClient = callbacksClient
    this.autoCloseTimer = new SettableTimer(
      autoCloseTimeoutMs,
      () => this.close() // Close the session if the timer expires
    )
  }

  get client() {
    return this.mcpClient
  }

  get sessionId() {
    return this.client.transport?.sessionId
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport)
    } catch (error) {
      log.error(
        `Failed to connect with transport ${typeof this.transport}:`,
        error
      )
      throw error
    }
  }

  resetAutoCloseTimer() {
    this.autoCloseTimer.reset()
  }

  async close(): Promise<void> {
    this.autoCloseTimer.stop()
    return this.client.close()
  }
}

/**
 * A client session that attempts to connect to one of multiple transports in priority order.
 * Once connected, a timer is started to automatically close the session if no activity is detected.
 */
export class MultiTransportClientSession implements AutoCloseableClientSession {
  private mcpClient: Client
  private transports: Transport[]
  private autoCloseTimer: SettableTimer

  constructor(
    transports: Transport[],
    clientOptions?: ClientOptions,
    autoCloseTimeoutMs: number = 5000
  ) {
    if (transports.length === 0) {
      throw new Error('At least one transport is required')
    }

    const callbacksClient = newCallbackClient(clientOptions)
    callbacksClient.registerCallback('ping', async () => {
      log.debug('Ping callback')
    })
    callbacksClient.registerCallback('listTools', async () => {
      log.debug('List tools callback')
      this.resetAutoCloseTimer()
    })
    callbacksClient.registerCallback('callTool', async () => {
      log.debug('Call tool callback')
      this.resetAutoCloseTimer()
    })

    this.mcpClient = callbacksClient
    this.transports = transports
    this.autoCloseTimer = new SettableTimer(
      autoCloseTimeoutMs,
      () => this.close() // Close the session if the timer expires
    )
  }

  get client() {
    return this.mcpClient
  }

  get sessionId() {
    return this.client.transport?.sessionId
  }

  private async connectTransport(transport: Transport): Promise<boolean> {
    try {
      await this.client.connect(transport)
      return true
    } catch (error) {
      log.error(`Failed to connect with transport ${typeof transport}:`, error)
      return false
    }
  }

  async connect(): Promise<void> {
    if (this.client.transport) {
      log.warn('MCP session already connected')
      return
    }

    for (const transport of this.transports) {
      if (await this.connectTransport(transport)) {
        // TODO: callbacks?
        log.info(
          `MCP session ${transport.sessionId} connected via ${typeof transport}`
        )
        return
      }
    }
    // TODO: callbacks?
    throw new Error('Failed to connect to any transport')
  }

  resetAutoCloseTimer() {
    this.autoCloseTimer.reset()
  }

  async close(): Promise<void> {
    this.autoCloseTimer.stop()
    return this.client.close()
  }
}

/**
 * A client session that attempts to connect to one of multiple transports in priority order.
 * Once connected, a timer is started to automatically close the session if no activity is detected.
 *
 * Additionally, the session can be refreshed by calling the refresh() method.
 * This will close the current session and attempt to reconnect as if the session was just created.
 */
export class RefreshableMultiTransportClientSession extends MultiTransportClientSession {
  private refreshCallback: () => Promise<void>

  constructor(
    transports: Transport[],
    clientOptions?: ClientOptions,
    autoCloseTimeoutMs: number = 5000
  ) {
    super(transports, clientOptions, autoCloseTimeoutMs)

    this.refreshCallback = async () => {
      log.debug('Refreshing MCP session transport')
      this.close()
      await this.connect() // Refresh the session by reconnecting
    }
  }

  async refresh(): Promise<void> {
    await this.refreshCallback()
  }
}

export interface ClientSessionFactory<C, V extends ClientSession> {
  create(config: C): Promise<V>
}

const defaultKeyExtractor = (key: any) => {
  const json = JSON.stringify(key)
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(json))
    .then((hash) => {
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    })
}
export class ClientSessionManager<C, V extends ClientSession> {
  private sessions: Map<string, V>
  private keyExtractor: (config: C) => Promise<string>

  constructor(
    private factory: ClientSessionFactory<C, V>,
    keyExtractor?: (config: C) => Promise<string>
  ) {
    this.sessions = new Map()
    this.keyExtractor = keyExtractor ?? defaultKeyExtractor
  }

  /**
   * Create a new session and ensure it is connected.
   * @param config - The configuration for the factory to create the session.
   * @returns A promise that resolves to the new connected session.
   */
  private async new(config: C): Promise<V> {
    const key = await this.keyExtractor(config)
    log.debug(`Creating new session for key: ${key}`)

    const session = await this.factory.create(config)
    await session.connect()
    log.debug(`Session ${session.sessionId} connected`)

    this.sessions.set(key, session)
    return session
  }

  async getSession(config: C): Promise<V> {
    const key = await this.keyExtractor(config)
    if (this.sessions.has(key)) {
      log.debug(`Using existing session for key: ${key}`)
      return this.sessions.get(key) as V
    }
    return (await this.new(config)) as V
  }

  async close(): Promise<void> {
    log.debug('Closing all sessions')
    for (const session of this.sessions.values()) {
      await session.close()
    }
  }
}
