import { healthcheck } from './commands/healthcheck'
import { Command } from 'commander'

import { version } from '../package.json'

function main() {
  const program = new Command()
    .name('cli')
    .description('A simple CLI template')
    .version(version || '0.0.0')

  program.addCommand(healthcheck)

  program.parse()
}

main()
