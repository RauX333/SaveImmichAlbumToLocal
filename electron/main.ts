import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB, getConfig, saveConfig, setConfigValue, getConnections, saveConnections, updateActiveConnection, resetDatabase } from './db'
import { syncAssets, cancelSync } from './sync'
import { ImmichClient } from './immich'
import { initLogger, writeLog, readLogs } from './logger'

// Necessary for __dirname in ESM if we were running raw ESM, 
// but vite-plugin-electron compiles this. 
// However, safer to use path.join with process.env.VITE_PUBLIC
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─ dist
// │ └── index.html
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  initDB()
  initLogger()
  
  // Register IPC handlers
  ipcMain.handle('get-config', () => {
    const cfg = getConfig()
    writeLog('INFO', 'IPC get-config called')
    return cfg
  })

  ipcMain.handle('save-config', (event, config) => {
    const apiKeyMasked = config?.apiKey ? '***' + String(config.apiKey).slice(-4) : ''
    writeLog('INFO', `IPC save-config received targetAlbumId=${config?.targetAlbumId} apiKey=${apiKeyMasked}`)
    try {
      saveConfig(config)
      writeLog('INFO', 'IPC save-config persisted')
      return true
    } catch (e) {
      writeLog('ERROR', `IPC save-config error ${String(e)}`)
      return false
    }
  })

  // Connections IPC
  ipcMain.handle('get-connections', () => {
    writeLog('INFO', 'IPC get-connections called')
    const data = getConnections()
    writeLog('INFO', `IPC get-connections returning count=${data.connections.length} active=${data.activeConnectionId || ''}`)
    return data
  })
  ipcMain.handle('save-connections', (event, payload) => {
    writeLog('INFO', `IPC save-connections called count=${(payload.connections ?? []).length} active=${payload.activeConnectionId || ''}`)
    saveConnections(payload)
    writeLog('INFO', 'IPC save-connections persisted')
    return true
  })

  ipcMain.handle('select-directory', async () => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Immich IPC
  ipcMain.handle('immich-validate', async (event, { url, apiKey }) => {
    const client = new ImmichClient(url, apiKey)
    return await client.validateConnection()
  })

  ipcMain.handle('immich-get-albums', async (event, { url, apiKey }) => {
    const client = new ImmichClient(url, apiKey)
    return await client.getAlbums()
  })

  ipcMain.handle('start-sync', async (event) => {
    writeLog('INFO', 'IPC start-sync received')
    const config = getConfig()
    writeLog('INFO', 'IPC start-sync config loaded')
    syncAssets(config).then((result) => {
      writeLog('INFO', `syncAssets finished success=${String(result?.success)}`)
      if (result.success) {
        const ts = new Date().toISOString()
        setConfigValue('lastSyncTime', ts)
        updateActiveConnection({ lastSyncTime: ts })
      }
      if (!event.sender.isDestroyed()) {
        event.sender.send('sync-complete', result)
      }
    }).catch(err => {
      writeLog('ERROR', `syncAssets error ${String(err)}`)
      if (!event.sender.isDestroyed()) {
        event.sender.send('sync-complete', { error: err.message })
      }
    })
    return true
  })

  ipcMain.handle('stop-sync', async () => {
    writeLog('INFO', 'IPC stop-sync received')
    cancelSync()
    return true
  })

  // Logs IPC
  ipcMain.handle('get-logs', () => {
    return readLogs()
  })
  ipcMain.handle('write-log', (event, payload) => {
    try {
      const level = String(payload?.level || 'INFO') as 'INFO' | 'ERROR' | 'WARN'
      const message = String(payload?.message || '')
      writeLog(level, message)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('reset-db', () => {
    writeLog('WARN', 'IPC reset-db received, resetting local database')
    try {
      resetDatabase()
      return true
    } catch (e) {
      writeLog('ERROR', 'IPC reset-db failed: ' + String(e))
      return false
    }
  })

  createWindow()

  // Initial sync attempt (after short delay)
  setTimeout(() => {
    const config = getConfig()
    syncAssets(config).then(result => {
      if (result.success) {
        const ts = new Date().toISOString()
        setConfigValue('lastSyncTime', ts)
        updateActiveConnection({ lastSyncTime: ts })
      }
    })
  }, 5000)

  // Periodic sync (every 10 minutes)
  setInterval(() => {
    const config = getConfig()
    syncAssets(config).then(result => {
      if (result.success) {
        const ts = new Date().toISOString()
        setConfigValue('lastSyncTime', ts)
        updateActiveConnection({ lastSyncTime: ts })
      }
    })
  }, 10 * 60 * 1000)
})
