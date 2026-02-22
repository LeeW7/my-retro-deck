import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Platform } from '../shared/types'

const LAUNCHBOX_DIR = 'C:\\LaunchBox'

const xmlParser = new XMLParser({ ignoreAttributes: false })

function findClearLogo(platformName: string): string {
  const logosDir = join(LAUNCHBOX_DIR, 'Images', platformName, 'Clear Logo')
  if (!existsSync(logosDir)) return ''

  const files = readdirSync(logosDir).filter((f) =>
    /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
  )
  if (files.length === 0) return ''

  return join(logosDir, files[0])
}

function countGames(platformName: string): number {
  const platformFile = join(LAUNCHBOX_DIR, 'Data', 'Platforms', `${platformName}.xml`)
  if (!existsSync(platformFile)) return 0

  try {
    const xml = readFileSync(platformFile, 'utf-8')
    const parsed = xmlParser.parse(xml)

    if (!parsed?.LaunchBox?.Game) return 0
    const games = parsed.LaunchBox.Game
    return Array.isArray(games) ? games.length : 1
  } catch {
    return 0
  }
}

export function scanPlatforms(): Platform[] {
  const platformsFile = join(LAUNCHBOX_DIR, 'Data', 'Platforms.xml')
  if (!existsSync(platformsFile)) {
    console.error('[LaunchBox] Platforms.xml not found at', platformsFile)
    return []
  }

  const xml = readFileSync(platformsFile, 'utf-8')
  const parsed = xmlParser.parse(xml)

  if (!parsed?.LaunchBox?.Platform) {
    console.error('[LaunchBox] No platforms found in Platforms.xml')
    return []
  }

  const rawPlatforms = parsed.LaunchBox.Platform
  const platformList = Array.isArray(rawPlatforms) ? rawPlatforms : [rawPlatforms]

  const platforms: Platform[] = []

  for (const p of platformList) {
    const name = p.Name as string
    if (!name) continue

    const gameCount = countGames(name)
    if (gameCount === 0) continue

    const logoPath = findClearLogo(name)
    const imageUrl = logoPath ? `retro-asset://${logoPath.replace(/\\/g, '/')}` : ''

    platforms.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      imageUrl,
      gameCount
    })
  }

  platforms.sort((a, b) => a.name.localeCompare(b.name))
  console.log(`[LaunchBox] Found ${platforms.length} platforms with games`)
  return platforms
}

export function setLastPlatform(platformName: string): void {
  const settingsPath = join(LAUNCHBOX_DIR, 'Data', 'BigBoxSettings.xml')
  if (!existsSync(settingsPath)) {
    console.error('[LaunchBox] BigBoxSettings.xml not found at', settingsPath)
    return
  }

  const xml = readFileSync(settingsPath, 'utf-8')
  const parser = new XMLParser({ ignoreAttributes: false, preserveOrder: true })
  const builder = new XMLBuilder({ ignoreAttributes: false, preserveOrder: true, format: true })

  const parsed = parser.parse(xml)

  function setField(obj: unknown, fieldName: string, value: string): boolean {
    if (!Array.isArray(obj)) return false
    for (const node of obj) {
      if (node[fieldName] !== undefined) {
        if (Array.isArray(node[fieldName]) && node[fieldName].length > 0) {
          node[fieldName][0]['#text'] = value
        } else {
          node[fieldName] = [{ '#text': value }]
        }
        return true
      }
      for (const key of Object.keys(node)) {
        if (key !== ':@' && Array.isArray(node[key])) {
          if (setField(node[key], fieldName, value)) return true
        }
      }
    }
    return false
  }

  setField(parsed, 'LastPlatform', platformName)

  const updatedXml = builder.build(parsed)
  writeFileSync(settingsPath, updatedXml, 'utf-8')
  console.log(`[LaunchBox] Set LastPlatform to "${platformName}"`)
}

export function resolveAssetPath(url: string): string {
  // url format: retro-asset://C:/LaunchBox/Images/...
  const filePath = url.replace('retro-asset://', '')
  return filePath
}
