import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { existsSync } from 'fs'

const iconMap: Record<string, string> = {
  Arcade: 'arcade.png',
  'Microsoft Xbox': 'xbox.png',
  'Microsoft Xbox 360': 'xbox-360.png',
  'Nintendo 64': 'n64.png',
  'Nintendo DS': 'nintendo-ds.png',
  'Nintendo Entertainment System': 'nes.png',
  'Nintendo Game Boy Advance': 'game-boy-advance.png',
  'Nintendo GameCube': 'gamecube.png',
  'Nintendo Switch': 'switch.png',
  'Sega Dreamcast': 'dreamcast.png',
  'Sega Genesis': 'sega-genesis.png',
  'Sega Saturn': 'sega-saturn.png',
  'Sony Playstation': 'playstation.png',
  'Super Nintendo Entertainment System': 'snes.png',
  'Sony Playstation 2': 'playstation-2.png',
  'Sony Playstation 3': 'playstation-3.png',
  'Sony PSP': 'sony-psp.png'
}

function getIconsDir(): string {
  if (is.dev) {
    return join(app.getAppPath(), 'resources', 'platform-icons')
  }
  return join(process.resourcesPath, 'platform-icons')
}

export function findBundledIcon(platformName: string): string {
  const filename = iconMap[platformName]
  if (!filename) return ''

  const fullPath = join(getIconsDir(), filename)
  if (!existsSync(fullPath)) return ''

  return fullPath
}
