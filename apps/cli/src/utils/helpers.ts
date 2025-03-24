import ora, { type Color } from 'ora'

export function getSpinner(text: string, color: Color = 'yellow') {
  return ora({
    text: text,
    color: color
  })
}

export function isDefined(value: any) {
  return value !== undefined && value !== null
}

export function clearTerminal() {
  /** Uses ANSI escape codes to clear the terminal so that it is not platform dependent. */
  process.stdout.write('\x1b[2J') // Clear the entire screen
  process.stdout.write('\x1b[H') // Move cursor to the home position (top-left corner)
}
