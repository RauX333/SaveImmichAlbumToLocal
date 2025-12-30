import fs from 'fs-extra'
import path from 'path'
import { pipeline } from 'stream/promises'
import { ImmichClient } from './immich'
import { addSyncedAsset, isAssetSynced, setConfigValue } from './db'

let isSyncing = false
let shouldCancel = false

export function cancelSync() {
  if (isSyncing) {
    shouldCancel = true
    console.log('Cancellation requested')
  }
}

export async function syncAssets(config: { immichUrl: string, apiKey: string, targetAlbumId: string, localPath: string }) {
  if (isSyncing) {
    console.log('Sync already in progress')
    return { success: false, alreadyRunning: true }
  }
  isSyncing = true
  shouldCancel = false
  console.log('Starting sync...')

  try {
    const { immichUrl, apiKey, targetAlbumId, localPath } = config
    
    if (!immichUrl || !apiKey || !targetAlbumId || !localPath) {
      const missing = { immichUrl: !!immichUrl, apiKey: !!apiKey, targetAlbumId: !!targetAlbumId, localPath: !!localPath }
      console.log('Missing config, skipping sync', missing)
      return { success: false, reason: 'Missing config', missing }
    }

    console.log('Config loaded for sync, targetAlbumId:', targetAlbumId)

    const client = new ImmichClient(immichUrl, apiKey)
    
    // verify connection first
    const connected = await client.validateConnection()
    if (!connected) {
      console.error('Cannot connect to Immich')
      return { success: false, reason: 'Cannot connect to Immich' }
    }

    const assets = (await client.getAlbumAssets(targetAlbumId)) || []
    console.log(`Found ${assets.length} assets in album`)

    let downloadedCount = 0

    for (const asset of assets) {
      if (shouldCancel) {
        console.log('Sync cancelled by user')
        return { success: false, cancelled: true, downloaded: downloadedCount }
      }

      if (isAssetSynced(asset.id)) {
        console.log(`Skipping already-synced asset ${asset.originalFileName} (${asset.id})`)
        continue
      }

      console.log(`Downloading asset ${asset.originalFileName} (${asset.id})`)
      
      try {
        const stream = await client.downloadAssetStream(asset.id)
        const fileName = asset.originalFileName
        const filePath = path.join(localPath, fileName)

        // Ensure directory exists
        await fs.ensureDir(localPath)
        
        // Handle file write
        const writer = fs.createWriteStream(filePath)
        await pipeline(stream, writer)

        addSyncedAsset({
          id: asset.id,
          originalFileName: fileName,
          localPath: filePath,
          checksum: asset.checksum ?? null
        })
        
        downloadedCount++
        console.log(`Synced ${fileName}`)
      } catch (err) {
        console.error(`Failed to download ${asset.originalFileName}`, err)
      }
    }
    
    // Always update lastSyncTime to show it ran
    // (Moved to main.ts to avoid redundant DB writes)
    
    const result = {
      success: true,
      downloaded: downloadedCount,
      total: assets.length
    }

    if (downloadedCount > 0) {
      console.log(`Sync completed. Downloaded ${downloadedCount} new assets.`)
    } else {
      console.log('Sync completed. No new assets.')
    }
    
    return result

  } catch (e) {
    console.error('Sync failed', e)
    return { success: false, error: String(e) }
  } finally {
    isSyncing = false
  }
}
