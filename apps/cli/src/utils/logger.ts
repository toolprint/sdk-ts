import { Chalk } from 'chalk'

// ! Needed so that chalk can output ANSI codes correctly to various shells.
export const chalk = new Chalk({
  level: 1
})

/**
 * Custom logger
 */
export const logger = {
  log: (msg: string) => console.log(msg),
  info: (msg: string) => console.info(chalk.blue(msg)),
  debug: (msg: string) => console.debug(chalk.yellow(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  warn: (msg: string) => console.warn(chalk.magenta(msg)),
  error: (msg: string) => console.error(chalk.red(msg))
} as const
