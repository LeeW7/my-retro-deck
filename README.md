# Retro Deck

Electron desktop app that scans a LaunchBox/BigBox game library and displays a retro-themed grid UI for launching gaming platforms. Designed to run on a secondary 7" touchscreen while BigBox runs on the primary TV.

## Hardware Setup

- **Primary display:** 4K TV — runs BigBox and games
- **Secondary display:** 7" touchscreen — runs Retro Deck
- The app auto-detects the smallest display for itself and targets the largest for BigBox

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [LaunchBox/BigBox](https://www.launchbox-app.com/) installed at `C:\LaunchBox`
- [nircmd](https://www.nirsoft.net/utils/nircmd.html) on PATH (used to move BigBox to the TV)

## Install and Run (Dev)

```bash
git clone https://github.com/LeeW7/my-retro-deck.git
cd my-retro-deck
npm install
npm run dev
```

On macOS it runs with mock platform data. On Windows with LaunchBox installed it scans the real library.

## Build Windows Installer

```bash
npm run build:win
```

The installer `.exe` will be in `dist/`. After install, the app auto-starts with Windows and runs fullscreen on the touchscreen.
