# Architecture

## Overview
- Electron main process orchestrates IPC, sync scheduling, dialog interactions, and persistence.
- React renderer provides Setup Wizard, Dashboard, Settings, and Logs UI.
- SQLite via better-sqlite3 stores configuration and synced asset metadata.
- Axios-based Immich client talks to Immich API over IPv4.

## Key Modules
- Main process: [main.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/main.ts)
- Sync pipeline: [sync.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/sync.ts)
- Immich API client: [immich.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/immich.ts)
- Persistence: [db.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/db.ts)
- Logging: [logger.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/logger.ts)
- Renderer entry: [main.tsx](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/main.tsx)
- UI: [SetupWizard.tsx](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/components/SetupWizard.tsx), [Dashboard.tsx](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/components/Dashboard.tsx), [Settings.tsx](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/pages/Settings.tsx)

## IPC Channels
- get-config, save-config
- get-connections, save-connections, select-directory
- immich-validate, immich-get-albums
- start-sync, sync-complete
- get-logs, write-log

## Sync Flow
- Validate connection to Immich.
- List assets for the selected album.
- For each asset not yet synced:
  - Request original asset stream.
  - Write to local folder.
  - Record in synced_assets table.
- Update lastSyncTime and active connection metadata.

## Build & Packaging
- Vite bundles renderer and compiles Electron main/preload via vite-plugin-electron.
- electron-builder packages for Windows (unpacked dir targets).
- See project scripts and [vite.config.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/vite.config.ts), [package.json](file:///Users/ami/projects/SaveImmichAlbumToLocal/package.json).

