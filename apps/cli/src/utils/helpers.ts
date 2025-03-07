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
