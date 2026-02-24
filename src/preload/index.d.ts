import { ElectronAPI } from '@electron-toolkit/preload'
import type { CompanionState, GameInfo } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getDevMode: () => Promise<boolean>
      getCompanionState: () => Promise<CompanionState>
      onCompanionStateChanged: (callback: (state: CompanionState) => void) => () => void
      closeGame: () => void
      saveState: () => void
      loadState: () => void
      simulateGame: (game: GameInfo | null) => void
      getMockGames: () => Promise<GameInfo[]>
      getAiConfigured: () => Promise<boolean>
      saveControlOverride: (gameTitle: string, positionKey: string, label: string) => void
      killLauncher: () => void
    }
  }
}
