import chalk from 'chalk'

/**
 * Custom logger
 */
export const logger = {
  log: (msg: string) => console.log(msg),
  info: (msg: string) => console.log(chalk.blue(msg)),
  success: (msg: string) => console.log(chalk.green(msg)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  error: (msg: string) => console.log(chalk.red(msg))
} as const
