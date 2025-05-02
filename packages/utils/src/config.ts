import os from 'os'
import path from 'path'
import fs from 'fs'

import { getEnv, configSchema } from './env.js'

export const getConfigDir = () => {
  const env = getEnv(configSchema)
  if (env.ONEGREP_CONFIG_DIR) {
    return env.ONEGREP_CONFIG_DIR
  }
  return path.join(os.homedir(), '.onegrep') // Default is ~/.onegrep
}

export const initConfigDir = () => {
  const userCfgDir = getConfigDir()
  // Ensure directory exists before writing to it
  if (!fs.existsSync(userCfgDir)) {
    fs.mkdirSync(userCfgDir, { recursive: true })
  }
  return userCfgDir
}
