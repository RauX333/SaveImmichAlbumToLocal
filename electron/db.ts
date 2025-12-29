import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs-extra'
import { writeLog } from './logger'

let db: Database.Database | null = null

interface AppConfig {
  immichUrl: string
  apiKey: string
  targetAlbumId: string
  targetAlbumName: string
  localPath: string
  lastSyncTime: string
  connections?: string
  activeConnectionId?: string
}

interface ElectronConnectionConfig {
  id: string
  name: string
  immichUrl: string
  apiKey: string
  targetAlbumId: string
  targetAlbumName: string
  localPath: string
  lastSyncTime: string
}

export function initDB() {
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'db')
  const dbPath = path.join(dbDir, 'immich-sync.db')
  const oldDbPath = path.join(userDataPath, 'immich-sync.db')
  
  // Ensure directory exists
  fs.ensureDirSync(dbDir)

  // Move old DB if exists and new one doesn't
  if (fs.existsSync(oldDbPath) && !fs.existsSync(dbPath)) {
    try {
      fs.moveSync(oldDbPath, dbPath)
      writeLog('INFO', 'Moved database from ' + oldDbPath + ' to ' + dbPath)
    } catch (err) {
      writeLog('ERROR', 'Failed to move database: ' + String(err))
    }
  }

  db = new Database(dbPath)
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS synced_assets (
      id TEXT PRIMARY KEY,
      originalFileName TEXT,
      localPath TEXT,
      syncedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      checksum TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
  writeLog('INFO', 'Database initialized at ' + dbPath)
  writeLog('INFO', `DB init at ${dbPath}`)
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function getConfig(): AppConfig {
  writeLog('INFO', 'DB: Reading config...')
  const stmt = getDB().prepare('SELECT key, value FROM config')
  const rows = stmt.all() as { key: string, value: string }[]
  
  const config: AppConfig = {
    immichUrl: '',
    apiKey: '',
    targetAlbumId: '',
    targetAlbumName: '',
    localPath: '',
    lastSyncTime: ''
  }
  
  for (const row of rows) {
    config[row.key] = row.value
  }
  const apiKeyMasked = config.apiKey ? '***' + String(config.apiKey).slice(-4) : ''
  writeLog('INFO', 'DB: Config read: ' + JSON.stringify({ targetAlbumId: config.targetAlbumId, lastSyncTime: config.lastSyncTime, apiKeyMasked }))
  return config
}

export function saveConfig(config: AppConfig) {
  const apiKeyMasked = config?.apiKey ? '***' + String(config.apiKey).slice(-4) : ''
  writeLog('INFO', 'DB: Saving config... ' + JSON.stringify({ targetAlbumId: config?.targetAlbumId, lastSyncTime: config?.lastSyncTime, apiKeyMasked }))
  const insert = getDB().prepare('INSERT OR REPLACE INTO config (key, value) VALUES (@key, @value)')
  const insertMany = getDB().transaction((cfg: Record<string, string>) => {
    let count = 0
    for (const [key, value] of Object.entries(cfg)) {
      if (typeof value === 'string') {
        insert.run({ key, value })
        count++
      }
    }
    return count
  })
  const written = insertMany(config)
  writeLog('INFO', `DB: Saved ${written} config entries`)

  // Verification read
  const saved = getConfig()
  const savedMasked = { targetAlbumId: saved.targetAlbumId, lastSyncTime: saved.lastSyncTime, apiKeyMasked: saved.apiKey ? '***' + String(saved.apiKey).slice(-4) : '' }
  writeLog('INFO', 'DB: Verification read: ' + JSON.stringify(savedMasked))
}

export function setConfigValue(key: string, value: string) {
  writeLog('INFO', 'DB: Setting config value ' + key)
  writeLog('INFO', `DB setConfigValue key=${key}`)
  const stmt = getDB().prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)')
  stmt.run(key, value)
}

export function getConnections() {
  const cfg = getConfig()
  let connections: ElectronConnectionConfig[] = []
  let activeConnectionId: string | null = null
  try {
    connections = cfg.connections ? JSON.parse(String(cfg.connections)) : []
  } catch {
    connections = []
  }
  if (typeof cfg.activeConnectionId === 'string' && cfg.activeConnectionId.length > 0) {
    activeConnectionId = cfg.activeConnectionId
  }
  writeLog('INFO', `DB getConnections count=${connections.length} active=${activeConnectionId || ''}`)
  return { connections, activeConnectionId }
}

export function saveConnections(payload: { connections: ElectronConnectionConfig[], activeConnectionId: string | null }) {
  const json = JSON.stringify(payload.connections ?? [])
  setConfigValue('connections', json)
  setConfigValue('activeConnectionId', String(payload.activeConnectionId ?? ''))
  writeLog('INFO', `DB saveConnections count=${(payload.connections ?? []).length} active=${payload.activeConnectionId || ''}`)
  // Mirror active connection to legacy single config keys for compatibility
  const active = (payload.connections ?? []).find((c) => c.id === payload.activeConnectionId)
  if (active) {
    saveConfig({
      immichUrl: String(active.immichUrl ?? ''),
      apiKey: String(active.apiKey ?? ''),
      targetAlbumId: String(active.targetAlbumId ?? ''),
      targetAlbumName: String(active.targetAlbumName ?? ''),
      localPath: String(active.localPath ?? ''),
      lastSyncTime: String(active.lastSyncTime ?? '')
    })
    writeLog('INFO', `DB mirrored active connection to legacy config name=${String(active.name ?? 'Immich')}`)
  }
}

export function updateActiveConnection(patch: Partial<ElectronConnectionConfig>) {
  const { connections, activeConnectionId } = getConnections()
  if (!activeConnectionId) return
  const updated = connections.map((c) => (c.id === activeConnectionId ? { ...c, ...patch } : c))
  saveConnections({ connections: updated, activeConnectionId })
  const keys = Object.keys(patch || {}).join(',')
  writeLog('INFO', `DB updateActiveConnection id=${activeConnectionId} keys=${keys}`)
}


export function addSyncedAsset(asset: { id: string, originalFileName: string, localPath: string, checksum?: string }) {
  const stmt = getDB().prepare(`
    INSERT OR REPLACE INTO synced_assets (id, originalFileName, localPath, checksum, syncedAt)
    VALUES (@id, @originalFileName, @localPath, @checksum, CURRENT_TIMESTAMP)
  `)
  stmt.run({ ...asset, checksum: asset.checksum ?? null })
}

export function isAssetSynced(id: string): boolean {
  const stmt = getDB().prepare('SELECT 1 FROM synced_assets WHERE id = ?')
  return !!stmt.get(id)
}

export function getSyncedAsset(id: string) {
  const stmt = getDB().prepare('SELECT * FROM synced_assets WHERE id = ?')
  return stmt.get(id)
}
