import type { GameInfo } from '../shared/types'

export const mockGames: GameInfo[] = [
  {
    id: 'mock-n64-001',
    title: 'Super Mario 64',
    platform: 'Nintendo 64',
    applicationPath: 'Games/Nintendo 64/Super Mario 64 (USA)/Super Mario 64 (USA).z64',
    developer: 'Nintendo EAD',
    publisher: 'Nintendo',
    genre: 'Platform',
    releaseDate: '1996-06-23',
    rating: 'E - Everyone',
    playMode: 'Single Player',
    playCount: 12,
    playTime: 4320,
    images: {
      boxFront: '',
      screenshot: '',
      clearLogo: '',
      fanartBackground: ''
    }
  },
  {
    id: 'mock-ps2-001',
    title: 'Shadow of the Colossus',
    platform: 'Sony Playstation 2',
    applicationPath: 'Games/Sony Playstation 2/Shadow of the Colossus.iso',
    developer: 'Team Ico',
    publisher: 'Sony Computer Entertainment',
    genre: 'Action; Adventure',
    releaseDate: '2005-10-18',
    rating: 'T - Teen',
    playMode: 'Single Player',
    playCount: 3,
    playTime: 7200,
    images: {
      boxFront: '',
      screenshot: '',
      clearLogo: '',
      fanartBackground: ''
    }
  },
  {
    id: 'mock-gc-001',
    title: 'Super Smash Bros. Melee',
    platform: 'Nintendo GameCube',
    applicationPath: 'Games/Nintendo GameCube/Super Smash Bros. Melee.iso',
    developer: 'HAL Laboratory',
    publisher: 'Nintendo',
    genre: 'Fighting',
    releaseDate: '2001-11-21',
    rating: 'T - Teen',
    playMode: 'Multiplayer',
    playCount: 45,
    playTime: 18000,
    images: {
      boxFront: '',
      screenshot: '',
      clearLogo: '',
      fanartBackground: ''
    }
  }
]
