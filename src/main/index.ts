import { app, shell, BrowserWindow, ipcMain, protocol, net } from 'electron'
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
      return
    }
    console.log(`[Launch] BigBox started for ${platform.name}`)
  })

  setTimeout(() => {
    const nircmd = 'nircmd win setsize foreground 0 0 3840 2160'
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
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
        return
      }
      console.log('[Launch] BigBox started (home/all games)')
    })

    setTimeout(() => {
      const nircmd = 'nircmd win setsize foreground 0 0 3840 2160'
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

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
