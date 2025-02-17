import { Command } from 'commander'

const TRANSPORT_TYPES = ['stdio', 'sse'] as const
export type TransportType = (typeof TRANSPORT_TYPES)[number]

export function launchCommand() {
  const program = new Command()

  program.option('-t,--transport <type>', 'The transport type to use', 'stdio')

  return program
}
