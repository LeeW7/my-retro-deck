export interface Platform {
  id: string
  name: string
  imageUrl: string
  gameCount: number
}

export interface GameImages {
  boxFront: string
  screenshot: string
  clearLogo: string
  fanartBackground: string
}

export interface GameInfo {
  id: string
  title: string
  platform: string
  applicationPath: string
  developer: string
  publisher: string
  genre: string
  releaseDate: string
  rating: string
  playMode: string
  playCount: number
  playTime: number
  images: GameImages
}

export interface ControllerPositionMap {
  faceBottom?: string // B position on 8BitDo
  faceRight?: string // A position
  faceLeft?: string // Y position
  faceTop?: string // X position
  shoulderL?: string // L
  shoulderR?: string // R
  triggerL?: string // ZL
  triggerR?: string // ZR
  dpad?: string // D-Pad (grouped)
  leftStick?: string // Left Stick
  rightStick?: string // Right Stick
  l3?: string // L3 click
  r3?: string // R3 click
  start?: string // + button
  select?: string // − button
}

export type CompanionState =
  | { status: 'idle' }
  | {
      status: 'game-active'
      game: GameInfo
      emulatorProcess: string
      controllerMap?: ControllerPositionMap
    }
  | { status: 'error'; message: string }

export interface PlatformControllerLayout {
  platformName: string
  positions: ControllerPositionMap
}
