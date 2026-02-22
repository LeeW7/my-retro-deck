import { ElectronAPI } from '@electron-toolkit/preload'
import type { Platform } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPlatforms: () => Promise<Platform[]>
      launchPlatform: (platform: Platform) => void
      launchHome: () => void
      killAll: () => void
      shutdown: () => void
    }
  }
}
