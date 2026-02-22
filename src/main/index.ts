import { app, shell, BrowserWindow, ipcMain, protocol, net, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import os from 'os'
import type { Platform } from '../shared/types'
import { scanPlatforms, setLastPlatform } from './launchbox'
import { devPlatforms } from './dev-platforms'

const isWindows = os.platform() === 'win32'

const BIGBOX_PATH = 'C:\\LaunchBox\\BigBox.exe'

const KILL_TARGETS = ['BigBox.exe', 'LaunchBox.exe', 'retroarch.exe', 'dolphin.exe', 'xemu.exe', 'pcsx2.exe']

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

function findLargestDisplay(): Electron.Display {
  const displays = screen.getAllDisplays()
  return displays.reduce((largest, d) =>
    d.size.width * d.size.height > largest.size.width * largest.size.height ? d : largest
  )
}

function killProcesses(): Promise<void> {
  return new Promise((resolve) => {
    if (!isWindows) {
      console.log('[Dev Mode] Would kill:', KILL_TARGETS.join(', '))
      resolve()
      return
    }

    let completed = 0
    for (const proc of KILL_TARGETS) {
      exec(`taskkill /IM ${proc} /F`, (error) => {
        if (error) {
          console.log(`[Kill] ${proc} was not running`)
        } else {
          console.log(`[Kill] ${proc} terminated`)
        }
        completed++
        if (completed === KILL_TARGETS.length) {
          resolve()
        }
      })
    }
  })
}

function recoverFocus(): void {
  if (!mainWindow) return
  console.log('[Focus] Recovering focus to Retro Deck')
  mainWindow.show()
  mainWindow.focus()
  if (isWindows) app.focus()
}

function launchPlatform(platform: Platform): void {
  if (!isWindows) {
    console.log(`[Dev Mode] Would set LastPlatform to: ${platform.name}`)
    console.log(`[Dev Mode] Would launch: ${BIGBOX_PATH}`)
    console.log(`[Dev Mode] Would move BigBox to Display 1 after 2s`)
    return
  }

  console.log(`[Launch] Setting LastPlatform to: ${platform.name}`)
  setLastPlatform(platform.name)

  const command = `"${BIGBOX_PATH}"`
  console.log(`[Launch] Executing: ${command}`)
  exec(command, (error) => {
    if (error) {
      console.error(`[Launch] Failed to start BigBox:`, error.message)
    } else {
      console.log(`[Launch] BigBox exited for ${platform.name}`)
    }
    recoverFocus()
  })

  setTimeout(() => {
    const { x, y, width, height } = findLargestDisplay().bounds
    const nircmd = `nircmd win setsize foreground ${x} ${y} ${width} ${height}`
    console.log(`[Window] Moving BigBox to Display 1: ${nircmd}`)
    exec(nircmd, (error) => {
      if (error) {
        console.error('[Window] Failed to move window:', error.message)
      } else {
        console.log('[Window] BigBox moved to Display 1')
      }
    })
  }, 2000)
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

  if (secondaryDisplay) {
    windowOptions.x = secondaryDisplay.bounds.x
    windowOptions.y = secondaryDisplay.bounds.y
    windowOptions.fullscreen = true
  } else if (isWindows) {
    windowOptions.fullscreen = true
  }

  mainWindow = new BrowserWindow(windowOptions)

  if (isWindows) {
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
  electronApp.setAppUserModelId('com.electron')

  secondaryDisplay = findSmallestDisplay()
  console.log(
    secondaryDisplay
      ? `[Display] Retro Deck target: ${secondaryDisplay.size.width}x${secondaryDisplay.size.height} at (${secondaryDisplay.bounds.x},${secondaryDisplay.bounds.y})`
      : '[Display] Single display detected, using default'
  )

  protocol.handle('retro-asset', (request) => {
    const filePath = request.url.replace('retro-asset://', '')
    return net.fetch(`file:///${filePath}`)
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-platforms', () => {
    if (!isWindows) {
      console.log('[Dev Mode] Returning mock platforms')
      return devPlatforms
    }
    return scanPlatforms()
  })

  ipcMain.on('launch-platform', async (_event, platform: Platform) => {
    console.log(`[Retro Deck] Launching platform: ${platform.name}`)
    await killProcesses()
    launchPlatform(platform)
  })

  ipcMain.on('launch-home', async () => {
    console.log('[Retro Deck] Launching BigBox home (all games)')
    await killProcesses()

    if (!isWindows) {
      console.log(`[Dev Mode] Would launch: ${BIGBOX_PATH} (no platform override)`)
      return
    }

    const command = `"${BIGBOX_PATH}"`
    console.log(`[Launch] Executing: ${command}`)
    exec(command, (error) => {
      if (error) {
        console.error('[Launch] Failed to start BigBox:', error.message)
      } else {
        console.log('[Launch] BigBox exited (home/all games)')
      }
      recoverFocus()
    })

    setTimeout(() => {
      const { x, y, width, height } = findLargestDisplay().bounds
      const nircmd = `nircmd win setsize foreground ${x} ${y} ${width} ${height}`
      console.log(`[Window] Moving BigBox to Display 1: ${nircmd}`)
      exec(nircmd, (error) => {
        if (error) {
          console.error('[Window] Failed to move window:', error.message)
        } else {
          console.log('[Window] BigBox moved to Display 1')
        }
      })
    }, 2000)
  })

  ipcMain.on('kill-all', async () => {
    console.log('[Retro Deck] Killing all processes (back to Retro Deck)')
    await killProcesses()
  })

  ipcMain.on('shutdown', async () => {
    console.log('[Retro Deck] Shutting down system')
    await killProcesses()
    allowClose = true

    if (!isWindows) {
      console.log('[Dev Mode] Would shutdown the system')
      return
    }

    exec('shutdown /s /t 5', (error) => {
      if (error) {
        console.error('[Shutdown] Failed to initiate shutdown:', error.message)
      } else {
        console.log('[Shutdown] System shutting down in 5 seconds')
      }
    })
  })

  if (isWindows) {
    app.setLoginItemSettings({ openAtLogin: true })
  }

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
