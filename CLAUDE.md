# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Retro Deck is an Electron desktop app that scans a LaunchBox/BigBox game library and displays a retro-themed grid UI for launching gaming platforms. Built with Electron + React + TypeScript, bundled with electron-vite.

## Commands

```bash
npm run dev             # Run with hot reload
npm run build           # Typecheck + build (all platforms)
npm run lint            # ESLint with caching
npm run typecheck       # Typecheck both main/preload (tsconfig.node.json) and renderer (tsconfig.web.json)
npm run format          # Prettier (write mode)
```

Platform-specific builds: `npm run build:win`, `npm run build:mac`, `npm run build:linux`

No test framework is configured.

## Architecture

Three-process Electron model with electron-vite bundling each separately:

- **`src/main/`** — Main process. Window creation, IPC handlers, LaunchBox XML scanning (`launchbox.ts`), mock data for non-Windows dev (`dev-platforms.ts`).
- **`src/preload/`** — Context bridge exposing `window.api` with two methods: `getPlatforms()` (invoke) and `launchPlatform(platform)` (send).
- **`src/renderer/`** — React 19 frontend with Tailwind CSS. `App.tsx` renders a responsive grid of platform cards.
- **`src/shared/`** — Shared `Platform` interface (`id`, `name`, `imageUrl`, `gameCount`).

### IPC Flow

1. Renderer calls `window.api.getPlatforms()` → main process scans LaunchBox XML files → returns `Platform[]`
2. Renderer calls `window.api.launchPlatform(platform)` → main process kills existing emulators, updates BigBoxSettings.xml, launches BigBox.exe

### Custom Protocol

`retro-asset://` protocol serves local image files (platform logos) to the renderer.

## Code Style

- Prettier: single quotes, no semicolons, 100 char width, no trailing commas
- Strict TypeScript throughout — avoid `any`
- 2-space indentation, LF line endings
