import { Composio, ComposioToolSet } from 'composio-core'

let _composio: Composio | undefined
let _composioToolSet: ComposioToolSet | undefined

export function getComposio(apiKey: string): Composio {
  if (!_composio) {
    _composio = new Composio({
      apiKey,
      baseUrl: 'https://backend.composio.dev',
      runtime: 'nodejs',
      allowTracing: true
    })
  }
  return _composio
}

export function getComposioToolSet(apiKey: string): ComposioToolSet {
  if (!_composioToolSet) {
    _composioToolSet = new ComposioToolSet({
      apiKey,
      baseUrl: 'https://backend.composio.dev',
      runtime: 'nodejs',
      allowTracing: true
    })
  }
  return _composioToolSet
}
