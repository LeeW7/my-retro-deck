import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { LAUNCHBOX_DIR } from './launchbox'
import type { ControllerPositionMap } from '../shared/types'

// Cache and config live next to the LaunchBox folder
const RETRODECK_DIR = join(dirname(LAUNCHBOX_DIR), 'RetroDeck')
const CACHE_PATH = join(RETRODECK_DIR, 'game-controls.json')
const OVERRIDES_PATH = join(RETRODECK_DIR, 'game-controls-overrides.json')
const CONFIG_PATH = join(RETRODECK_DIR, 'retrodeck-config.json')

type ControlsDb = Record<string, ControllerPositionMap>

interface RetroDeckConfig {
  anthropicApiKey?: string
}

function ensureDir(): void {
  if (!existsSync(RETRODECK_DIR)) {
    mkdirSync(RETRODECK_DIR, { recursive: true })
    console.log(`[Controls] Created RetroDeck dir: ${RETRODECK_DIR}`)
  }
}

function readJsonFile<T>(path: string): T | null {
  try {
    if (!existsSync(path)) return null
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as T
  } catch (err) {
    console.log(`[Controls] Failed to read ${path}:`, err)
    return null
  }
}

function writeJsonFile<T>(path: string, data: T): void {
  try {
    ensureDir()
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.log(`[Controls] Failed to write ${path}:`, err)
  }
}

/** Check manual overrides first, then AI-generated cache */
export function getGameControls(gameTitle: string): ControllerPositionMap | null {
  // Priority 1: manual overrides
  const overrides = readJsonFile<ControlsDb>(OVERRIDES_PATH)
  if (overrides?.[gameTitle]) {
    console.log(`[Controls] Using manual override for "${gameTitle}"`)
    return overrides[gameTitle]
  }

  // Priority 2: AI-generated cache
  const cache = readJsonFile<ControlsDb>(CACHE_PATH)
  if (cache?.[gameTitle]) {
    console.log(`[Controls] Cache hit for "${gameTitle}"`)
    return cache[gameTitle]
  }

  return null
}

/** Save AI-generated controls to cache */
export function saveGameControls(gameTitle: string, positions: ControllerPositionMap): void {
  const cache = readJsonFile<ControlsDb>(CACHE_PATH) ?? {}
  cache[gameTitle] = positions
  writeJsonFile(CACHE_PATH, cache)
  console.log(`[Controls] Cached controls for "${gameTitle}"`)
}

/** Get the Anthropic API key from config */
export function getApiKey(): string | null {
  const config = readJsonFile<RetroDeckConfig>(CONFIG_PATH)
  return config?.anthropicApiKey ?? null
}

/** Check if AI controls are configured */
export function isAiConfigured(): boolean {
  return !!getApiKey()
}

export { RETRODECK_DIR, CONFIG_PATH }
