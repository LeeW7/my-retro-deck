import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { Platform } from '../shared/types'

const api = {
  getPlatforms: (): Promise<Platform[]> => ipcRenderer.invoke('get-platforms'),
  launchPlatform: (platform: Platform): void => {
    ipcRenderer.send('launch-platform', platform)
  },
  launchHome: (): void => {
    ipcRenderer.send('launch-home')
  },
  killAll: (): void => {
    ipcRenderer.send('kill-all')
  },
  shutdown: (): void => {
    ipcRenderer.send('shutdown')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
