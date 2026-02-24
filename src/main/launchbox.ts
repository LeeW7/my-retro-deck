import { XMLParser } from 'fast-xml-parser'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import type { GameInfo, GameImages } from '../shared/types'

export const LAUNCHBOX_DIR = 'C:\\Users\\acewa\\LaunchBox'

const xmlParser = new XMLParser({ ignoreAttributes: false })

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp)$/i

function toAssetUrl(filePath: string): string {
  return `retro-asset:///${filePath.replace(/\\/g, '/')}`
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase()
}

// --- Game Index ---

interface RawGame {
  ID?: string
  Title?: string
  Platform?: string
  ApplicationPath?: string
  Developer?: string
  Publisher?: string
  Genre?: string
  ReleaseDate?: string
  Rating?: string
  PlayMode?: string
  PlayCount?: number
  PlayTime?: number
}

function parseGameEntry(raw: RawGame, platform: string): GameInfo {
  const appPath = (raw.ApplicationPath as string) || ''
  return {
    id: (raw.ID as string) || '',
    title: (raw.Title as string) || '',
    platform: (raw.Platform as string) || platform,
    applicationPath: appPath,
    developer: (raw.Developer as string) || '',
    publisher: (raw.Publisher as string) || '',
    genre: (raw.Genre as string) || '',
    releaseDate: (raw.ReleaseDate as string) || '',
    rating: (raw.Rating as string) || '',
    playMode: (raw.PlayMode as string) || '',
    playCount: Number(raw.PlayCount) || 0,
    playTime: Number(raw.PlayTime) || 0,
    images: { boxFront: '', screenshot: '', clearLogo: '', fanartBackground: '' }
  }
}

export function buildGameIndex(): Map<string, GameInfo> {
  const index = new Map<string, GameInfo>()
  const platformsDir = join(LAUNCHBOX_DIR, 'Data', 'Platforms')

  if (!existsSync(platformsDir)) {
    console.error('[LaunchBox] Platforms directory not found at', platformsDir)
    return index
  }

  const xmlFiles = readdirSync(platformsDir).filter((f) => f.endsWith('.xml'))

  for (const file of xmlFiles) {
    const platformName = file.replace('.xml', '')
    try {
      const xml = readFileSync(join(platformsDir, file), 'utf-8')
      const parsed = xmlParser.parse(xml)

      if (!parsed?.LaunchBox?.Game) continue
      const rawGames = Array.isArray(parsed.LaunchBox.Game)
        ? parsed.LaunchBox.Game
        : [parsed.LaunchBox.Game]

      for (const raw of rawGames) {
        const game = parseGameEntry(raw as RawGame, platformName)
        if (!game.applicationPath) continue

        // Key by normalized absolute path
        const absolutePath = join(LAUNCHBOX_DIR, game.applicationPath)
        const key = normalizePath(absolutePath)
        index.set(key, game)

        // Also key by filename for fallback matching
        const filename = normalizePath(basename(game.applicationPath))
        if (!index.has(filename)) {
          index.set(filename, game)
        }
      }
    } catch (err) {
      console.error(`[LaunchBox] Failed to parse ${file}:`, err)
    }
  }

  console.log(`[LaunchBox] Indexed ${index.size} game entries`)
  return index
}

export function lookupGameByRomPath(
  romPath: string,
  index: Map<string, GameInfo>
): GameInfo | null {
  // Try exact normalized path match
  const normalizedFull = normalizePath(romPath)
  const exact = index.get(normalizedFull)
  if (exact) return exact

  // Try with LAUNCHBOX_DIR prepended (in case romPath is relative)
  const withBase = normalizePath(join(LAUNCHBOX_DIR, romPath))
  const relative = index.get(withBase)
  if (relative) return relative

  // Fallback: match by filename only
  const filename = normalizePath(basename(romPath))
  const byName = index.get(filename)
  if (byName) return byName

  return null
}

// --- Game Images ---

/**
 * Normalize a string for fuzzy filename matching.
 * Strips characters that are invalid in Windows filenames (: ? * < > | " / \)
 * and collapses punctuation/whitespace so that titles like
 * "The Legend of Zelda: The Wind Waker" match files named
 * "The Legend of Zelda - The Wind Waker-01.png".
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findImageInDir(dir: string, titlePrefix: string): string {
  if (!existsSync(dir)) return ''

  const normalizedTitle = normalizeForMatch(titlePrefix)
  const entries = readdirSync(dir, { withFileTypes: true })

  // Check files in this directory first
  for (const entry of entries) {
    if (entry.isFile() && IMAGE_EXTENSIONS.test(entry.name)) {
      const normalizedName = normalizeForMatch(entry.name)
      if (normalizedName.startsWith(normalizedTitle)) {
        return join(dir, entry.name)
      }
    }
  }

  // Check subdirectories (region folders like North America, World, etc.)
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = join(dir, entry.name)
      try {
        const subFiles = readdirSync(subDir).filter((f) => IMAGE_EXTENSIONS.test(f))
        for (const f of subFiles) {
          const normalizedName = normalizeForMatch(f)
          if (normalizedName.startsWith(normalizedTitle)) {
            return join(subDir, f)
          }
        }
      } catch {
        // Skip inaccessible subdirectories
      }
    }
  }

  return ''
}

export function resolveGameImages(title: string, platform: string): GameImages {
  const imagesBase = join(LAUNCHBOX_DIR, 'Images', platform)
  const titlePrefix = title.toLowerCase()

  const imageTypes: Array<{ key: keyof GameImages; folder: string }> = [
    { key: 'boxFront', folder: 'Box - Front' },
    { key: 'screenshot', folder: 'Screenshot - Gameplay' },
    { key: 'clearLogo', folder: 'Clear Logo' },
    { key: 'fanartBackground', folder: 'Fanart - Background' }
  ]

  const images: GameImages = {
    boxFront: '',
    screenshot: '',
    clearLogo: '',
    fanartBackground: ''
  }

  for (const { key, folder } of imageTypes) {
    const dir = join(imagesBase, folder)
    const found = findImageInDir(dir, titlePrefix)
    if (found) {
      images[key] = toAssetUrl(found)
      console.log(`[Images] ${key}: ${found}`)
    }
  }

  const foundCount = Object.values(images).filter(Boolean).length
  if (foundCount === 0) {
    console.log(`[Images] No images found for "${title}" in ${imagesBase}`)
  } else {
    console.log(`[Images] Found ${foundCount}/4 image types for "${title}"`)
  }

  return images
}
