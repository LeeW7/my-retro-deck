import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getApiKey, getGameControls, saveGameControls } from './game-controls-cache'
import { getControllerLayout } from '../shared/controller-layouts'
import { LAUNCHBOX_DIR } from './launchbox'
import type { ControllerPositionMap } from '../shared/types'

const POSITION_KEYS: (keyof ControllerPositionMap)[] = [
  'faceBottom',
  'faceRight',
  'faceLeft',
  'faceTop',
  'shoulderL',
  'shoulderR',
  'triggerL',
  'triggerR',
  'dpad',
  'leftStick',
  'rightStick',
  'l3',
  'r3',
  'start',
  'select'
]

// --- Dolphin GCPad Profile Reader ---

/** Map Dolphin/SDL/XInput button names → 8BitDo position keys */
const XINPUT_TO_POSITION: Record<string, keyof ControllerPositionMap> = {
  'Button S': 'faceBottom', // South = B on Switch/8BitDo
  'Button W': 'faceLeft', // West = Y on Switch/8BitDo
  'Button N': 'faceTop', // North = X on Switch/8BitDo
  'Button E': 'faceRight', // East = A on Switch/8BitDo
  'Shoulder L': 'shoulderL',
  'Shoulder R': 'shoulderR',
  'Trigger L': 'triggerL',
  'Trigger R': 'triggerR',
  Start: 'start',
  Back: 'select',
  'Thumb L': 'l3',
  'Thumb R': 'r3'
}

/** GC button label for display in the AI prompt */
const GC_BUTTON_LABELS: Record<string, string> = {
  'Buttons/A': 'GC A',
  'Buttons/B': 'GC B',
  'Buttons/X': 'GC X',
  'Buttons/Y': 'GC Y',
  'Buttons/Z': 'GC Z',
  'Buttons/Start': 'GC Start'
}

/** Position key → friendly name for the AI prompt */
const POSITION_LABELS: Record<string, string> = {
  faceBottom: 'faceBottom (B on controller)',
  faceRight: 'faceRight (A on controller)',
  faceLeft: 'faceLeft (Y on controller)',
  faceTop: 'faceTop (X on controller)',
  shoulderL: 'shoulderL (L on controller)',
  shoulderR: 'shoulderR (R on controller)',
  triggerL: 'triggerL (ZL on controller)',
  triggerR: 'triggerR (ZR on controller)',
  start: 'start',
  select: 'select',
  l3: 'l3',
  r3: 'r3'
}

/**
 * Read a Dolphin GCPad profile INI and return the core mapping context string.
 * Parses lines like `Buttons/A = \`Button S\`` and maps through XInput → position keys.
 */
function parseDolphinGcPadProfile(): string | null {
  try {
    const profileDir = join(
      LAUNCHBOX_DIR,
      'Emulators',
      'Dolphin',
      'User',
      'Config',
      'Profiles',
      'GCPad'
    )

    // Find the first .ini profile in the directory
    const files = readdirSync(profileDir).filter((f) => f.endsWith('.ini'))
    if (files.length === 0) return null

    const profilePath = join(profileDir, files[0])
    const content = readFileSync(profilePath, 'utf-8')
    console.log(`[AI Controls] Reading Dolphin GCPad profile: ${files[0]}`)

    const lines: string[] = []

    // Parse button mappings from the INI
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      const gcLabel = GC_BUTTON_LABELS[trimmed.split('=')[0]?.trim() ?? '']
      if (!gcLabel) continue

      // Extract the XInput button name from backtick-wrapped value: `Button S`
      const valueMatch = trimmed.match(/=\s*`?([^`]+)`?\s*$/)
      if (!valueMatch) continue

      const xinputButton = valueMatch[1].trim()
      const positionKey = XINPUT_TO_POSITION[xinputButton]
      if (!positionKey) {
        // Handle "Start" without backticks
        if (xinputButton === 'Start') {
          lines.push(`- ${gcLabel} → start`)
        }
        continue
      }

      const label = POSITION_LABELS[positionKey] ?? positionKey
      lines.push(`- ${gcLabel} → ${label}`)
    }

    // Add stick/trigger/dpad mappings (these are standard in Dolphin XInput)
    lines.push('- GC Control Stick → leftStick')
    lines.push('- GC C-Stick → rightStick')
    lines.push('- GC D-Pad → dpad')

    // Check for trigger mappings in the INI
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('Triggers/L =')) {
        const match = trimmed.match(/=\s*`?([^`]+)`?\s*$/)
        if (match) {
          const pos = XINPUT_TO_POSITION[match[1].trim()]
          if (pos) lines.push(`- GC L → ${POSITION_LABELS[pos] ?? pos}`)
        }
      }
      if (trimmed.startsWith('Triggers/R =')) {
        const match = trimmed.match(/=\s*`?([^`]+)`?\s*$/)
        if (match) {
          const pos = XINPUT_TO_POSITION[match[1].trim()]
          if (pos) lines.push(`- GC R → ${POSITION_LABELS[pos] ?? pos}`)
        }
      }
    }

    if (lines.length < 3) return null

    return `Dolphin controller mapping (read from ${files[0]}):\n${lines.join('\n')}`
  } catch (err) {
    console.log('[AI Controls] Could not read Dolphin GCPad profile:', err)
    return null
  }
}

// Cache the Dolphin profile so we only read it once
let dolphinProfileCache: string | null | undefined

function getDolphinMapping(): string | null {
  if (dolphinProfileCache !== undefined) return dolphinProfileCache
  dolphinProfileCache = parseDolphinGcPadProfile()
  return dolphinProfileCache
}

// --- Core Mapping Context ---

/**
 * RetroArch core default button mappings.
 * Maps: original console button → RetroPad position key.
 * This is critical — the AI must know how RetroArch remaps the original
 * console buttons to RetroPad positions, otherwise it guesses by name
 * (e.g. N64 A → faceRight "A") when the core actually maps N64 A → faceBottom "B".
 *
 * For Dolphin/GameCube, we read the actual controller profile INI if available.
 */
function getCoreMappingContext(platform: string): string {
  // For GameCube, try to read the actual Dolphin controller profile first
  if (platform === 'Nintendo GameCube') {
    const dolphinMapping = getDolphinMapping()
    if (dolphinMapping) return dolphinMapping
  }

  const mappings: Record<string, string> = {
    'Nintendo 64': `RetroArch Mupen64Plus-Next core default mapping for N64:
- N64 A button → faceBottom (B on controller)
- N64 B button → faceLeft (Y on controller)
- N64 Z Trigger → triggerL (ZL on controller)
- N64 L shoulder → shoulderL (L on controller)
- N64 R shoulder → shoulderR (R on controller)
- N64 C-buttons → rightStick (right analog stick on controller)
- N64 Start → start
- N64 Control Stick → leftStick
- N64 D-Pad → dpad`,

    'Super Nintendo Entertainment System': `RetroArch SNES core maps 1:1 with RetroPad (SNES layout = RetroPad layout):
- SNES B → faceBottom (B on controller)
- SNES A → faceRight (A on controller)
- SNES Y → faceLeft (Y on controller)
- SNES X → faceTop (X on controller)
- SNES L → shoulderL (L on controller)
- SNES R → shoulderR (R on controller)
- SNES Start → start
- SNES Select → select
- SNES D-Pad → dpad`,

    'Nintendo Entertainment System': `RetroArch NES core mapping:
- NES A → faceRight (A on controller)
- NES B → faceBottom (B on controller)
- NES Start → start
- NES Select → select
- NES D-Pad → dpad`,

    'Sony Playstation': `RetroArch PS1 core mapping:
- PS1 Cross (X) → faceBottom (B on controller)
- PS1 Circle (O) → faceRight (A on controller)
- PS1 Square → faceLeft (Y on controller)
- PS1 Triangle → faceTop (X on controller)
- PS1 L1 → shoulderL
- PS1 R1 → shoulderR
- PS1 L2 → triggerL (ZL)
- PS1 R2 → triggerR (ZR)
- PS1 Start → start
- PS1 Select → select
- PS1 Left Stick → leftStick
- PS1 Right Stick → rightStick
- PS1 D-Pad → dpad`,

    'Sony Playstation 2': `RetroArch PS2 core mapping:
- PS2 Cross (X) → faceBottom (B on controller)
- PS2 Circle (O) → faceRight (A on controller)
- PS2 Square → faceLeft (Y on controller)
- PS2 Triangle → faceTop (X on controller)
- PS2 L1 → shoulderL
- PS2 R1 → shoulderR
- PS2 L2 → triggerL (ZL)
- PS2 R2 → triggerR (ZR)
- PS2 L3 → l3
- PS2 R3 → r3
- PS2 Start → start
- PS2 Select → select
- PS2 Left Stick → leftStick
- PS2 Right Stick → rightStick
- PS2 D-Pad → dpad`,

    'Nintendo GameCube': `Dolphin core default mapping (no profile found):
- GC A → faceBottom (B on controller)
- GC B → faceLeft (Y on controller)
- GC X → faceTop (X on controller)
- GC Y → faceRight (A on controller)
- GC Z → shoulderR (R on controller)
- GC L → triggerL (ZL on controller)
- GC R → triggerR (ZR on controller)
- GC Start/Pause → start
- GC Control Stick → leftStick
- GC C-Stick → rightStick
- GC D-Pad → dpad`,

    'Sega Genesis': `RetroArch Genesis Plus GX core mapping (6-button):
- Genesis A → faceLeft (Y on controller)
- Genesis B → faceBottom (B on controller)
- Genesis C → faceRight (A on controller)
- Genesis X → shoulderL (L on controller)
- Genesis Y → faceTop (X on controller)
- Genesis Z → shoulderR (R on controller)
- Genesis Start → start
- Genesis Mode → select
- Genesis D-Pad → dpad`,

    'Nintendo Game Boy Advance': `RetroArch GBA core mapping:
- GBA A → faceRight (A on controller)
- GBA B → faceBottom (B on controller)
- GBA L → shoulderL (L on controller)
- GBA R → shoulderR (R on controller)
- GBA Start → start
- GBA Select → select
- GBA D-Pad → dpad`
  }

  return mappings[platform] ?? ''
}

function buildPrompt(gameTitle: string, platform: string): string {
  const coreMapping = getCoreMappingContext(platform)

  const coreMappingSection = coreMapping
    ? `\n\nIMPORTANT — Use this RetroArch core mapping to determine which position key each original game button maps to. Do NOT map by button name (e.g. N64 "A" is NOT faceRight "A" — check the mapping below):\n${coreMapping}`
    : ''

  return `You are a retro gaming expert. For the game "${gameTitle}" on ${platform}, provide the in-game action for each controller button position.

The output position keys correspond to a modern controller (8BitDo Pro 3 / Switch layout):
- faceBottom = B button (bottom face button, red)
- faceRight = A button (right face button, green)
- faceLeft = Y button (left face button, yellow)
- faceTop = X button (top face button, blue)
- shoulderL = L bumper
- shoulderR = R bumper
- triggerL = ZL trigger
- triggerR = ZR trigger
- dpad = directional pad
- leftStick = left analog stick
- rightStick = right analog stick
- l3 = left stick click
- r3 = right stick click
- start = + button
- select = − button${coreMappingSection}

CRITICAL: Each label must be the actual in-game ACTION for "${gameTitle}" (what happens when you press the button), NOT the original console button name. Think carefully about the DEFAULT control scheme for this specific game.

Multiple position keys CAN have the same action label if the game maps multiple buttons to the same function. Do not force unique labels.

If you are unsure about a button's function in this specific game, OMIT it rather than guessing. Accuracy matters more than completeness.

Respond with ONLY a JSON object mapping position keys to short action labels (1-2 words max, like "Jump", "Attack", "Move", "Menu"). Only include positions that the game actually uses. Keep labels very short and kid-friendly.

Example for Super Mario 64 (N64):
{"faceBottom":"Jump","faceLeft":"Punch","triggerL":"Crouch","shoulderR":"Camera","leftStick":"Move","rightStick":"C-Buttons","start":"Pause"}

Example for Super Smash Bros. Melee (GameCube):
{"faceBottom":"Attack","faceRight":"Jump","faceLeft":"Special","faceTop":"Jump","shoulderR":"Grab","triggerL":"Shield","triggerR":"Shield","leftStick":"Move","rightStick":"Smash","dpad":"Taunt","start":"Pause"}`
}

function parseResponse(text: string): ControllerPositionMap | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>
    const result: ControllerPositionMap = {}

    for (const key of POSITION_KEYS) {
      if (parsed[key] && typeof parsed[key] === 'string') {
        result[key] = parsed[key]
      }
    }

    // Sanity check — must have at least a couple of mappings
    if (Object.keys(result).length < 2) return null
    return result
  } catch {
    return null
  }
}

/** Generate game-specific controls via Claude API. Returns null if unavailable. */
export async function generateGameControls(
  gameTitle: string,
  platform: string
): Promise<ControllerPositionMap | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.log('[AI Controls] No API key configured, skipping')
    return null
  }

  try {
    console.log(`[AI Controls] Generating controls for "${gameTitle}" (${platform})`)

    const client = new Anthropic({ apiKey, maxRetries: 3 })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: buildPrompt(gameTitle, platform) }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const positions = parseResponse(responseText)

    if (positions) {
      console.log(
        `[AI Controls] Generated ${Object.keys(positions).length} mappings for "${gameTitle}"`
      )
      return positions
    }

    console.log(`[AI Controls] Failed to parse response for "${gameTitle}"`)
    return null
  } catch (err) {
    console.log(`[AI Controls] API error for "${gameTitle}":`, err)
    return null
  }
}

/**
 * Resolve controller map for a game. Priority:
 * 1. Manual overrides (from game-controls-overrides.json)
 * 2. AI-generated cache (from game-controls.json)
 * 3. AI generation (on cache miss, then cached)
 * 4. Platform fallback (from controller-layouts.ts)
 */
export async function resolveControllerMap(
  gameTitle: string,
  platform: string
): Promise<ControllerPositionMap | undefined> {
  // Check cache (includes manual overrides)
  const cached = getGameControls(gameTitle)
  if (cached) return cached

  // Try AI generation
  const generated = await generateGameControls(gameTitle, platform)
  if (generated) {
    saveGameControls(gameTitle, generated)
    return generated
  }

  // Platform fallback — return undefined so renderer uses platform layouts
  const layout = getControllerLayout(platform)
  return layout?.positions
}
