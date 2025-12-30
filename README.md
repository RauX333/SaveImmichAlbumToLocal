# Immich Album Sync

An Electron desktop app that syncs a selected Immich album to a local folder. Built with React, TypeScript, Vite, and vite-plugin-electron. It periodically downloads new assets from your chosen album to the path you select.

## Features
- Connects to an Immich server via API Key
- Lists albums and lets you pick one to sync
- Saves files to a local folder with resume and skip for already-synced assets
- Runs a periodic background sync (every 10 minutes)
- Multiple connections management in Settings
- Built Windows package via electron-builder
- Simple logs viewer

## Quick Start
- Prerequisites: Node.js 18+, pnpm, Immich server URL, Immich API Key
- Install deps: `pnpm install`
- Start dev: `pnpm dev`
- Build production: `pnpm build`
- Preview build: `pnpm preview`
- Package Windows: `pnpm win:pack` or `pnpm win:pack:x64`

## Usage
1. Launch the app in dev (`pnpm dev`) or use a packed build.
2. In the setup wizard, enter Immich URL and API Key, connect, select an album, and choose a local folder.
3. Finish setup to save a connection; sync runs shortly after and then every 10 minutes.
4. Use Dashboard to trigger Sync Now and see last sync time. Use Settings to manage multiple connections and view logs.

## Configuration
- Config persists in a SQLite file under Electron userData. See [db.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/db.ts).
- IPC channels exist for config, connections, sync, Immich API calls, and logs. See [main.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/main.ts).
- Sync pipeline downloads asset streams and writes to your selected folder. See [sync.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/sync.ts) and [immich.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/immich.ts).

## Scripts
- dev: start Vite with Electron integration
- build: compile TypeScript and bundle renderer and Electron
- preview: serve built renderer for debugging
- win:pack / win:pack:x64: create unpacked Windows builds in `release/`

## Security Notes
- Store your API Key securely; it is kept in a local SQLite DB for the app only.
- The app forces IPv4 requests to avoid network issues and does not expose your API Key to logs.

## Documentation
Detailed guides live in the docs/ folder:
- docs/GettingStarted.md
- docs/Configuration.md
- docs/Troubleshooting.md
- docs/Architecture.md

## License
Copyright (c) 2025. See repository license once published.
