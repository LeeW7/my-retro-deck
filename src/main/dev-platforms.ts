import type { Platform } from '../shared/types'
import { findBundledIcon } from './platform-icons'

function iconUrl(platformName: string): string {
  const path = findBundledIcon(platformName)
  return path ? `retro-asset://${path.replace(/\\/g, '/')}` : ''
}

export const devPlatforms: Platform[] = [
  { id: 'snes', name: 'Super Nintendo Entertainment System', imageUrl: iconUrl('Super Nintendo Entertainment System'), gameCount: 42 },
  { id: 'n64', name: 'Nintendo 64', imageUrl: iconUrl('Nintendo 64'), gameCount: 25 },
  { id: 'ps2', name: 'Sony Playstation 2', imageUrl: iconUrl('Sony Playstation 2'), gameCount: 63 },
  { id: 'gamecube', name: 'Nintendo GameCube', imageUrl: iconUrl('Nintendo GameCube'), gameCount: 18 },
  { id: 'xbox', name: 'Microsoft Xbox', imageUrl: iconUrl('Microsoft Xbox'), gameCount: 12 },
  { id: 'genesis', name: 'Sega Genesis', imageUrl: iconUrl('Sega Genesis'), gameCount: 37 },
  { id: 'nes', name: 'Nintendo Entertainment System', imageUrl: iconUrl('Nintendo Entertainment System'), gameCount: 55 },
  { id: 'gba', name: 'Nintendo Game Boy Advance', imageUrl: iconUrl('Nintendo Game Boy Advance'), gameCount: 30 },
  { id: 'ps1', name: 'Sony Playstation', imageUrl: iconUrl('Sony Playstation'), gameCount: 48 },
  { id: 'dreamcast', name: 'Sega Dreamcast', imageUrl: iconUrl('Sega Dreamcast'), gameCount: 15 }
]
