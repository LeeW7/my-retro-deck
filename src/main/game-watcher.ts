import { exec } from 'child_process'
import os from 'os'
import type { GameInfo, CompanionState } from '../shared/types'
import { lookupGameByRomPath, resolveGameImages } from './launchbox'

const isWindows = os.platform() === 'win32'

// --- ROM Extension Detection ---

const ROM_EXTENSIONS = new Set([
  // Nintendo 64
  'z64',
  'n64',
  'v64',
  // SNES
  'sfc',
  'smc',
  'fig',
  // NES / Famicom
  'nes',
  'unf',
  'fds',
  // Game Boy / GBA
  'gba',
  'gbc',
  'gb',
  'sgb',
  // DS / 3DS
  'nds',
  '3ds',
  // Disc-based (PS1, PS2, Saturn, etc.)
  'iso',
  'bin',
  'cue',
  'img',
  'mdf',
  'chd',
  'pbp',
  'cso',
  'ecm',
  // GameCube / Wii
  'gcm',
  'gcz',
  'wbfs',
  'wad',
  'rvz',
  'dol',
  'elf',
  // Switch
  'nsp',
  'xci',
  // Sega Genesis / Mega Drive
  'gen',
  'md',
  'smd',
  '32x',
  // Sega other
  'gg',
  'sms',
  'sg',
  // PC Engine / TurboGrafx
  'pce',
  // Neo Geo
  'ngp',
  'ngc',
  // WonderSwan
  'ws',
  'wsc',
  // Atari
  'a26',
  'a78',
  'lnx',
  // Other
  'vec',
  'col',
  // Compressed ROMs
  'zip',
  '7z'
])

function isRomExtension(ext: string): boolean {
  return ROM_EXTENSIONS.has(ext.toLowerCase())
}

/** Extract all quoted strings and the last unquoted token from a command line */
function extractPathsFromCmdLine(cmdLine: string): string[] {
  const paths: string[] = []

  // Find all quoted strings
  const quoteRegex = /["']([^"']+)["']/g
  let match: RegExpExecArray | null
  while ((match = quoteRegex.exec(cmdLine)) !== null) {
    paths.push(match[1])
  }

  // Also grab the last whitespace-separated token (for unquoted paths without spaces)
  const lastToken = cmdLine.trim().split(/\s+/).pop()
  if (lastToken) {
    paths.push(lastToken.replace(/["']/g, ''))
  }

  return paths
}

/** Find the ROM path in a list of paths by checking file extensions */
function findRomPath(paths: string[]): string {
  for (const p of paths) {
    const extMatch = p.match(/\.(\w+)$/)
    if (extMatch && isRomExtension(extMatch[1])) {
      return p
    }
  }
  return ''
}

// --- Emulator Registry ---

interface EmulatorParser {
  processName: string
  wmicFilter: string
  parseRomPath: (cmdLine: string) => string
}

function parseRetroArchRom(cmdLine: string): string {
  // BigBox format: retroarch.exe -L "cores\core.dll" -f "path\to\rom.z64"
  // -f is fullscreen flag (no argument), ROM is a positional arg
  // Strategy: find the path with a ROM extension among all quoted/positional args
  const paths = extractPathsFromCmdLine(cmdLine)
  return findRomPath(paths)
}

function parseDolphinRom(cmdLine: string): string {
  // Format: Dolphin.exe --exec="path\to\game.iso" or Dolphin.exe "path\to\game.iso"
  const execMatch = cmdLine.match(/--exec=["']?(.+?)["']?(?:\s+-|$)/i)
  if (execMatch) return execMatch[1].trim().replace(/["']/g, '')

  // Fallback: find path with ROM extension
  const paths = extractPathsFromCmdLine(cmdLine)
  return findRomPath(paths)
}

function parsePcsx2Rom(cmdLine: string): string {
  // Format: pcsx2.exe "path\to\game.iso" or pcsx2.exe -- "path\to\game.iso"
  // Try after -- separator first
  const dashDash = cmdLine.match(/--\s+["']?(.+?)["']?\s*$/i)
  if (dashDash) return dashDash[1].trim().replace(/["']/g, '')

  // Fallback: find path with ROM extension
  const paths = extractPathsFromCmdLine(cmdLine)
  return findRomPath(paths)
}

const EMULATORS: EmulatorParser[] = [
  {
    processName: 'retroarch.exe',
    wmicFilter: "name='retroarch.exe'",
    parseRomPath: parseRetroArchRom
  },
  {
    processName: 'Dolphin.exe',
    wmicFilter: "name='Dolphin.exe'",
    parseRomPath: parseDolphinRom
  },
  {
    processName: 'pcsx2.exe',
    wmicFilter: "name like 'pcsx2%'",
    parseRomPath: parsePcsx2Rom
  }
]

// --- Watcher State ---

type StateChangeCallback = (state: CompanionState) => void

let pollInterval: ReturnType<typeof setInterval> | null = null
let currentState: CompanionState = { status: 'idle' }
let currentRomPath: string | null = null
let gameIndex: Map<string, GameInfo> = new Map()
let onStateChange: StateChangeCallback | null = null

function buildWmicQuery(): string {
  const filters = EMULATORS.map((e) => e.wmicFilter).join(' or ')
  return `wmic process where "${filters}" get Name,CommandLine /format:list`
}

interface DetectedProcess {
  name: string
  commandLine: string
}

function parseWmicOutput(stdout: string): DetectedProcess[] {
  const results: DetectedProcess[] = []
  const blocks = stdout.split(/\n\s*\n/).filter((b) => b.trim())

  for (const block of blocks) {
    const cmdMatch = block.match(/CommandLine=(.+)/i)
    const nameMatch = block.match(/Name=(.+)/i)

    if (cmdMatch && nameMatch) {
      results.push({
        name: nameMatch[1].trim(),
        commandLine: cmdMatch[1].trim()
      })
    }
  }

  return results
}

function findEmulatorParser(processName: string): EmulatorParser | undefined {
  const lower = processName.toLowerCase()
  return EMULATORS.find((e) => {
    if (e.processName.toLowerCase() === lower) return true
    // Handle wildcard match for pcsx2 variants (pcsx2-qt.exe, pcsx2-v1.7.exe, etc.)
    if (e.processName === 'pcsx2.exe' && lower.startsWith('pcsx2')) return true
    return false
  })
}

function pollForEmulators(): void {
  const query = buildWmicQuery()

  exec(query, { timeout: 5000 }, (error, stdout) => {
    if (error) {
      // No matching processes found — this is normal when no game is running
      if (currentState.status === 'game-active') {
        currentRomPath = null
        currentState = { status: 'idle' }
        onStateChange?.(currentState)
        console.log('[Watcher] Emulator closed, returning to idle')
      }
      return
    }

    const processes = parseWmicOutput(stdout)
    if (processes.length === 0) {
      if (currentState.status === 'game-active') {
        currentRomPath = null
        currentState = { status: 'idle' }
        onStateChange?.(currentState)
        console.log('[Watcher] No emulator processes, returning to idle')
      }
      return
    }

    // Log all detected processes for debugging
    for (const p of processes) {
      console.log(`[Watcher] Process: ${p.name} | CmdLine: ${p.commandLine}`)
    }

    // Use the first detected emulator process
    const detected = processes[0]
    const parser = findEmulatorParser(detected.name)
    if (!parser) return

    const romPath = parser.parseRomPath(detected.commandLine)
    console.log(`[Watcher] Parsed ROM path: "${romPath}"`)
    if (!romPath) return

    // Same game still running — no-op
    if (romPath === currentRomPath) return

    currentRomPath = romPath
    const game = lookupGameByRomPath(romPath, gameIndex)

    if (game) {
      // Resolve images for this game
      game.images = resolveGameImages(game.title, game.platform)
      currentState = {
        status: 'game-active',
        game,
        emulatorProcess: detected.name
      }
      console.log(`[Watcher] Detected: ${game.title} (${game.platform}) via ${detected.name}`)
    } else {
      // Game not in database — show what we can from the filename
      const filename = romPath.replace(/^.*[\\/]/, '').replace(/\.\w+$/, '')
      const unknownGame: GameInfo = {
        id: '',
        title: filename,
        platform: 'Unknown',
        applicationPath: romPath,
        developer: '',
        publisher: '',
        genre: '',
        releaseDate: '',
        rating: '',
        playMode: '',
        playCount: 0,
        playTime: 0,
        images: { boxFront: '', screenshot: '', clearLogo: '', fanartBackground: '' }
      }
      currentState = {
        status: 'game-active',
        game: unknownGame,
        emulatorProcess: detected.name
      }
      console.log(`[Watcher] Detected unknown game: ${filename} via ${detected.name}`)
    }

    onStateChange?.(currentState)
  })
}

// --- Public API ---

export function startWatching(index: Map<string, GameInfo>, callback: StateChangeCallback): void {
  gameIndex = index
  onStateChange = callback

  if (!isWindows) {
    console.log('[Watcher] Not on Windows, skipping process polling')
    return
  }

  console.log('[Watcher] Starting emulator polling (2.5s interval)')
  pollForEmulators()
  pollInterval = setInterval(pollForEmulators, 2500)
}

export function stopWatching(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  console.log('[Watcher] Stopped')
}

export function getCurrentState(): CompanionState {
  return currentState
}

export function setCurrentState(state: CompanionState): void {
  currentState = state
  currentRomPath = null
  onStateChange?.(state)
}

export function getActiveEmulatorProcess(): string | null {
  if (currentState.status === 'game-active') {
    return currentState.emulatorProcess
  }
  return null
}
