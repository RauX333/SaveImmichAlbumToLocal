import path from 'path'
import fs from 'fs-extra'
import { app } from 'electron'

let logFilePath: string | null = null

export function initLogger() {
  const userDataPath = app.getPath('userData')
  const logsDir = path.join(userDataPath, 'logs')
  fs.ensureDirSync(logsDir)
  logFilePath = path.join(logsDir, 'app.log')
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '')
  }
}

function timestamp() {
  return new Date().toISOString()
}

export function writeLog(level: 'INFO' | 'ERROR' | 'WARN', message: string) {
  const line = `${timestamp()} [${level}] ${message}\n`
  if (logFilePath) {
    try {
      fs.appendFileSync(logFilePath, line)
    } catch (err) {
      void err
    }
  }
  if (level === 'ERROR') {
    console.error(message)
  } else if (level === 'WARN') {
    console.warn(message)
  } else {
    console.log(message)
  }
}

export function getLogFilePath() {
  if (!logFilePath) initLogger()
  return logFilePath!
}

export function readLogs(): string {
  const file = getLogFilePath()
  try {
    const content = fs.readFileSync(file, 'utf-8')
    return content
  } catch {
    return ''
  }
}

export function clearLogs() {
  const file = getLogFilePath()
  try {
    fs.writeFileSync(file, '')
  } catch (err) {
    void err
  }
}
