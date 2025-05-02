import { argv } from 'process'
import { launchCommand } from './command.js'
import { stdioServer, sseServer } from './server.js'
import { log } from './log.js'

async function main() {
  const program = launchCommand()

  program.parse(argv)

  const options = program.opts()

  if (options.transport === 'sse') {
    log.info('Starting SSE server')
    await sseServer()
  } else {
    log.info('Starting stdio server')
    await stdioServer()
  }
}

main().catch((error) => {
  log.error(error)
  process.exit(1)
})
