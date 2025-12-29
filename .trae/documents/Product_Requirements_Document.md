# Product Requirements Document: Immich Album Downloader

## 1. Project Overview
A desktop application (Windows & macOS) that connects to an Immich instance, allows the user to select specific albums, and automatically syncs (downloads) photos from those albums to a specified local directory.

## 2. User Flow & Features

### 2.1 First-Time Setup (Wizard)
1.  **Welcome Screen:** Brief introduction.
2.  **Connection Setup:**
    -   User inputs Immich Server URL (e.g., `http://192.168.1.100:2283`).
    -   User inputs API Key.
    -   "Test Connection" button to verify credentials.
3.  **Configuration:**
    -   Upon successful connection, app fetches list of albums.
    -   User selects an Album to download.
    -   User selects a Local Destination Folder.
4.  **Completion:**
    -   App saves configuration and starts the first sync.

### 2.2 Main Dashboard
-   **Status Display:** Shows current status (Idle, Syncing, Error) and last sync time.
-   **Progress:** Simple progress bar or count (e.g., "Downloaded 5/100 photos").
-   **Settings:** Ability to update API key, change album, or change local folder.
-   **Logs/History:** List of recently downloaded files (optional but good for visibility).

### 2.3 Background Sync
-   The app should periodically check the Immich album for new assets.
-   New assets are downloaded to the local folder.
-   Existing assets (already downloaded) are skipped.

## 3. Technical Constraints & Requirements
-   **Platform:** Electron (supports Windows & macOS).
-   **Interface:** Simple, clean, minimalist.
-   **Database:** Local database to track downloaded assets (to avoid duplicates).
-   **Network:** Must handle network interruptions gracefully.

## 4. Future Scope (Out of MVP)
-   Two-way sync.
-   Multiple album support (MVP focuses on one configuration).
-   Tray icon support.
