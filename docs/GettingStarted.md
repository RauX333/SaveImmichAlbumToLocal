# Getting Started

## Prerequisites
- Node.js 18+
- pnpm
- An Immich server URL (e.g., https://immich.example.com)
- An Immich API Key (create in Immich user settings)

## Install and Run
- Install dependencies:

```bash
pnpm install
```

- Start development:

```bash
pnpm dev
```

This runs Vite with Electron via vite-plugin-electron, launching the desktop app.

## Build and Preview
- Production build:

```bash
pnpm build
```

- Preview built renderer:

```bash
pnpm preview
```

## Package for Windows
- Create unpacked Windows build:

```bash
pnpm win:pack
```

- Force x64:

```bash
pnpm win:pack:x64
```

Artifacts appear under the release/ directory.

