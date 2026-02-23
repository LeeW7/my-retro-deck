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

export type CompanionState =
  | { status: 'idle' }
  | { status: 'game-active'; game: GameInfo; emulatorProcess: string }
  | { status: 'error'; message: string }
