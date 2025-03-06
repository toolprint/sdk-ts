import chalk from 'chalk'
import { Logger } from 'ts-log'

/**
 * Custom console logger with chalk
 */
export async function consoleLogger(): Promise<Logger> {
  class LoggerInstance implements Logger {
    trace(message?: any, ...optionalParams: any[]): void {
      console.log(chalk.gray(message), ...optionalParams)
    }

    debug(message?: any, ...optionalParams: any[]): void {
      console.debug(chalk.blue(message), ...optionalParams)
    }

    info(message?: any, ...optionalParams: any[]): void {
      console.info(chalk.green(message), ...optionalParams)
    }

    warn(message?: any, ...optionalParams: any[]): void {
      console.warn(chalk.yellow(message), ...optionalParams)
    }

    error(message?: any, ...optionalParams: any[]): void {
      console.error(chalk.red(message), ...optionalParams)
    }

    [x: string]: any // Allow for additional properties
  }

  return new LoggerInstance()
}
