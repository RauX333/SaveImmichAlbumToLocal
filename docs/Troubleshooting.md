# Troubleshooting

## Connection Fails
- Verify Immich URL and API Key.
- The app forces IPv4 for API calls to avoid ENETUNREACH/EHOSTUNREACH.
- Check server accessibility from your machine.

## Missing Config
- If any of immichUrl, apiKey, targetAlbumId, or localPath is missing, sync is skipped.
- Complete the setup wizard or update the active connection in Settings.

## Permissions
- Ensure write access to the selected local folder.
- On macOS, you may need to grant “Files and Folders” permissions.

## Sync Already Running
- The app prevents concurrent syncs and reports “alreadyRunning”.
- Wait for the current sync to finish or restart the app.

## Logs
- Open Settings → Logs to view app logs.
- IPC and DB operations write informational entries and errors.
- See [logger.ts](file:///Users/ami/projects/SaveImmichAlbumToLocal/electron/logger.ts).

