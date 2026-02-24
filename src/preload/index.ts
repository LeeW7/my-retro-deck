import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { CompanionState, GameInfo } from '../shared/types'

const api = {
  getDevMode: (): Promise<boolean> => ipcRenderer.invoke('get-dev-mode'),

  getCompanionState: (): Promise<CompanionState> => ipcRenderer.invoke('get-companion-state'),

  onCompanionStateChanged: (callback: (state: CompanionState) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: CompanionState): void => {
      callback(state)
    }
    ipcRenderer.on('companion-state-changed', handler)
    return () => ipcRenderer.removeListener('companion-state-changed', handler)
  },

  closeGame: (): void => {
    ipcRenderer.send('close-game')
  },

  saveState: (): void => {
    ipcRenderer.send('save-state')
  },

  loadState: (): void => {
    ipcRenderer.send('load-state')
  },

  simulateGame: (game: GameInfo | null): void => {
    ipcRenderer.send('simulate-game', game)
  },

  getMockGames: (): Promise<GameInfo[]> => ipcRenderer.invoke('get-mock-games'),

  getAiConfigured: (): Promise<boolean> => ipcRenderer.invoke('get-ai-configured'),

  saveControlOverride: (gameTitle: string, positionKey: string, label: string): void => {
    ipcRenderer.send('save-control-override', gameTitle, positionKey, label)
  },

  killLauncher: (): void => {
    ipcRenderer.send('kill-launcher')
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
