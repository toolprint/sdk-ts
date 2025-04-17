import { showTools } from './commands/example.js'
import { Command } from 'commander'

function main() {
  const program = new Command()
    .name('cli')
    .description('A simple CLI template')
    .version('0.0.0')

  program.addCommand(showTools)

  program.parse()
}

main()
