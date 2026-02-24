import { app, shell, BrowserWindow, ipcMain, protocol, net, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import os from 'os'
import type { CompanionState, GameInfo } from '../shared/types'
import { buildGameIndex } from './launchbox'
import {
  startWatching,
  stopWatching,
  getCurrentState,
  setCurrentState,
  getActiveEmulatorProcess
} from './game-watcher'
import { mockGames } from './dev-mock-game'
import { ensureNetworkCmdEnabled, sendRetroArchCommand } from './retroarch-net'
import { isAiConfigured, saveOverride } from './game-controls-cache'
import { resolveControllerMap } from './ai-controls'

const isWindows = os.platform() === 'win32'
const devMode = !!process.env.DEV_MODE

let mainWindow: BrowserWindow | null = null
let allowClose = false
let secondaryDisplay: Electron.Display | null = null

function findSmallestDisplay(): Electron.Display | null {
  const displays = screen.getAllDisplays()
  if (displays.length <= 1) return null
  return displays.reduce((smallest, d) =>
    d.size.width * d.size.height < smallest.size.width * smallest.size.height ? d : smallest
  )
}

function recoverFocus(): void {
  if (!mainWindow) return
  console.log('[Focus] Recovering focus to Retro Deck')
  mainWindow.show()
  mainWindow.focus()
  if (isWindows) app.focus()
}

function createWindow(): void {
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  }

  if (!devMode) {
    if (secondaryDisplay) {
      windowOptions.x = secondaryDisplay.bounds.x
      windowOptions.y = secondaryDisplay.bounds.y
      windowOptions.fullscreen = true
    } else if (isWindows) {
      windowOptions.fullscreen = true
    }
  }

  mainWindow = new BrowserWindow(windowOptions)

  if (isWindows && !devMode) {
    mainWindow.on('close', (e) => {
      if (!allowClose) e.preventDefault()
    })
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.retrodeck')

  secondaryDisplay = findSmallestDisplay()
  console.log(
    secondaryDisplay
      ? `[Display] Retro Deck target: ${secondaryDisplay.size.width}x${secondaryDisplay.size.height} at (${secondaryDisplay.bounds.x},${secondaryDisplay.bounds.y})`
      : '[Display] Single display detected, using default'
  )

  protocol.handle('retro-asset', (request) => {
    const filePath = decodeURIComponent(request.url.replace('retro-asset:///', ''))
    return net.fetch(`file:///${filePath}`)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  if (devMode) {
    console.log('[Dev Mode] Windowed mode enabled (DEV_MODE=1)')
  }

  // --- Build game index & enable RetroArch network commands ---
  const gameIndex = buildGameIndex()
  ensureNetworkCmdEnabled()

  // --- IPC Handlers ---
  ipcMain.handle('get-dev-mode', () => devMode)

  ipcMain.handle('get-companion-state', () => getCurrentState())

  ipcMain.handle('get-ai-configured', () => isAiConfigured())

  ipcMain.on('close-game', () => {
    const processName = getActiveEmulatorProcess()

    if (!isWindows) {
      console.log(`[Dev Mode] Would kill ${processName || 'emulator'}`)
      setCurrentState({ status: 'idle' })
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('companion-state-changed', getCurrentState())
      }
      return
    }

    if (!processName) {
      console.log('[Close Game] No emulator process to kill')
      return
    }

    exec(`taskkill /IM "${processName}" /F`, (error) => {
      if (error) {
        console.log(`[Close Game] ${processName} was not running`)
      } else {
        console.log(`[Close Game] ${processName} terminated`)
      }
      recoverFocus()
    })
  })

  ipcMain.on('save-state', () => {
    console.log('[IPC] Save state requested')
    sendRetroArchCommand('SAVE_STATE')
  })

  ipcMain.on('load-state', () => {
    console.log('[IPC] Load state requested')
    sendRetroArchCommand('LOAD_STATE')
  })

  ipcMain.on(
    'save-control-override',
    (_event, gameTitle: string, positionKey: string, label: string) => {
      saveOverride(gameTitle, positionKey, label)
    }
  )

  ipcMain.on('kill-launcher', () => {
    console.log('[IPC] Kill launcher requested')
    if (!isWindows) {
      console.log('[Dev Mode] Would kill BigBox/LaunchBox')
      return
    }
    const targets = ['BigBox.exe', 'LaunchBox.exe']
    for (const proc of targets) {
      exec(`taskkill /IM "${proc}" /F`, (error) => {
        if (error) {
          console.log(`[Kill Launcher] ${proc} was not running`)
        } else {
          console.log(`[Kill Launcher] ${proc} terminated`)
        }
      })
    }
  })

  // Dev mode: simulate game detection for UI testing
  ipcMain.on('simulate-game', (_event, game: GameInfo | null) => {
    if (!devMode && isWindows) return

    const state: CompanionState = game
      ? { status: 'game-active', game, emulatorProcess: 'retroarch.exe' }
      : { status: 'idle' }
    setCurrentState(state, true)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('companion-state-changed', state)
    }

    // Async: resolve controller map for simulated game
    if (game) {
      resolveControllerMap(game.title, game.platform).then((controllerMap) => {
        if (controllerMap && mainWindow && !mainWindow.isDestroyed()) {
          const updated: CompanionState = {
            status: 'game-active',
            game,
            emulatorProcess: 'retroarch.exe',
            controllerMap
          }
          setCurrentState(updated, true)
          mainWindow.webContents.send('companion-state-changed', updated)
        }
      })
    }
  })

  // Expose mock games for dev mode
  ipcMain.handle('get-mock-games', () => {
    if (!devMode && isWindows) return []
    return mockGames
  })

  // --- Start game watcher ---
  startWatching(gameIndex, (state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('companion-state-changed', state)
    }
  })

  createWindow()

  function repositionWindow(): void {
    if (!mainWindow) return
    const target = findSmallestDisplay()
    if (target) {
      mainWindow.setBounds(target.bounds)
      mainWindow.setFullScreen(true)
    }
    console.log(
      target
        ? `[Display] Repositioned to: ${target.size.width}x${target.size.height}`
        : '[Display] Single display, no repositioning needed'
    )
  }

  screen.on('display-added', repositionWindow)
  screen.on('display-removed', repositionWindow)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  allowClose = true
  stopWatching()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
