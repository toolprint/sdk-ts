import { showTools } from '@/src/commands/example'
import { Command } from 'commander'

import { version } from '../package.json'

function main() {
  const program = new Command()
    .name('cli')
    .description('A simple CLI template')
    .version(version || '0.0.0')

  program.addCommand(showTools)

  program.parse()
}

main()
