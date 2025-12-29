# Configuration

## Where Config Lives
- Config is stored in a local SQLite DB in Electron userData.
- See [db.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/db.ts).

## Setup Wizard
- Enter Immich URL and API Key, then Connect to validate.
- Choose an album and a local folder path.
- Finish to persist the connection and trigger an initial sync.
- See [SetupWizard.tsx](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/components/SetupWizard.tsx).

## Managing Multiple Connections
- Go to Settings to add, edit, delete, and mark an active connection.
- Test a connection and load albums before selecting.
- Save Changes to persist all edits.
- See [Settings.tsx](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/pages/Settings.tsx) and [useConnectionsStore.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/src/store/useConnectionsStore.ts).

## Sync Behavior
- Initial sync runs shortly after app start.
- Periodic sync runs every 10 minutes.
- Already-synced assets are skipped.
- See [main.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/main.ts) and [sync.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/sync.ts).

