# Technical Architecture Document

## 1. Tech Stack
-   **Runtime:** Node.js (via Electron).
-   **Framework:** Electron (Main Process + Renderer Process).
-   **Frontend:** React + TypeScript + Vite.
-   **Styling:** Tailwind CSS.
-   **State Management (Frontend):** Zustand.
-   **Database (Local):** `better-sqlite3` (running in Main Process).
-   **Configuration Store:** `electron-store` (for simple user configs like URL/Token).
-   **HTTP Client:** `axios` (or native `fetch`).

## 2. Architecture Overview

### 2.1 Main Process (Backend)
The heavy lifting happens here to ensure performance and file system access stability.
-   **Sync Manager:** A module responsible for polling the Immich API and managing the download queue.
-   **Database Manager:** Wrapper around SQLite to store synced asset metadata.
-   **IPC Handlers:** Exposes methods to the Renderer (e.g., `testConnection`, `saveConfig`, `getSyncStatus`).
-   **File System:** Handles writing image files to disk.

### 2.2 Renderer Process (Frontend)
-   **UI Layer:** React components for the Setup Wizard and Dashboard.
-   **IPC Bridge:** Uses `contextBridge` to securely communicate with the Main Process.

## 3. Data Model

### 3.1 Configuration (`electron-store`)
```json
{
  "immichUrl": "string",
  "apiKey": "string",
  "targetAlbumId": "string",
  "localPath": "string",
  "lastSyncTime": "iso-string"
}
```

### 3.2 Database Schema (SQLite)
Table: `synced_assets`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT | Primary Key (Immich Asset ID) |
| `originalFileName` | TEXT | Original filename from Immich |
| `localPath` | TEXT | Full path where it was saved |
| `syncedAt` | DATETIME | Timestamp of download |
| `checksum` | TEXT | (Optional) File hash for verification |

## 4. Sync Logic (Pseudo-code)
1.  **Fetch Album Assets:** Call Immich API `/api/album/{id}` to get list of assets.
2.  **Filter New:** Compare list against `synced_assets` table in SQLite.
3.  **Download:** For each new asset:
    -   GET `/api/asset/file/{id}` (or download endpoint).
    -   Stream to `localPath/filename`.
    -   On success, INSERT into `synced_assets`.
4.  **Error Handling:** Retry logic for failed downloads.

## 5. Security
-   API Key is stored locally in `electron-store` (consider encryption if critical, but standard config store is fine for MVP personal tool).
-   IPC: Use `contextBridge` with `contextIsolation: true`.
