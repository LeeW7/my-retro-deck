import type { PlatformControllerLayout } from './types'

// Platform fallback labels: maps original platform buttons to positions
// on the 8BitDo Pro 3 (Switch layout) controller.
//
// These are used when no game-specific controls are available.
// Each position corresponds to a physical button on the 8BitDo Pro 3:
//   faceBottom=B, faceRight=A, faceLeft=Y, faceTop=X
//   shoulderL=L, shoulderR=R, triggerL=ZL, triggerR=ZR
//   l3=L3, r3=R3, start=+, select=−
//   dpad=D-Pad, leftStick=L Stick, rightStick=R Stick

const layouts: PlatformControllerLayout[] = [
  {
    platformName: 'Nintendo 64',
    positions: {
      faceBottom: 'A',
      faceLeft: 'B',
      triggerL: 'Z',
      shoulderL: 'L',
      shoulderR: 'R',
      dpad: 'D-Pad',
      leftStick: 'Stick',
      rightStick: 'C',
      start: 'Start'
    }
  },
  {
    platformName: 'Sony Playstation 2',
    positions: {
      faceBottom: '×',
      faceRight: '○',
      faceLeft: '□',
      faceTop: '△',
      shoulderL: 'L1',
      shoulderR: 'R1',
      triggerL: 'L2',
      triggerR: 'R2',
      l3: 'L3',
      r3: 'R3',
      dpad: 'D-Pad',
      leftStick: 'L Stick',
      rightStick: 'R Stick',
      start: 'Start',
      select: 'Select'
    }
  },
  {
    platformName: 'Nintendo GameCube',
    positions: {
      faceBottom: 'A',
      faceLeft: 'B',
      faceTop: 'X',
      faceRight: 'Y',
      shoulderR: 'Z',
      triggerL: 'L',
      triggerR: 'R',
      dpad: 'D-Pad',
      leftStick: 'Stick',
      rightStick: 'C-Stick',
      start: 'Start'
    }
  },
  {
    platformName: 'Super Nintendo Entertainment System',
    positions: {
      faceRight: 'A',
      faceBottom: 'B',
      faceTop: 'X',
      faceLeft: 'Y',
      shoulderL: 'L',
      shoulderR: 'R',
      dpad: 'D-Pad',
      start: 'Start',
      select: 'Select'
    }
  },
  {
    platformName: 'Nintendo Entertainment System',
    positions: {
      faceRight: 'A',
      faceBottom: 'B',
      dpad: 'D-Pad',
      start: 'Start',
      select: 'Select'
    }
  },
  {
    platformName: 'Sega Genesis',
    positions: {
      faceLeft: 'A',
      faceBottom: 'B',
      faceRight: 'C',
      shoulderL: 'X',
      faceTop: 'Y',
      shoulderR: 'Z',
      dpad: 'D-Pad',
      start: 'Start',
      select: 'Mode'
    }
  },
  {
    platformName: 'Sony Playstation',
    positions: {
      faceBottom: '×',
      faceRight: '○',
      faceLeft: '□',
      faceTop: '△',
      shoulderL: 'L1',
      shoulderR: 'R1',
      triggerL: 'L2',
      triggerR: 'R2',
      dpad: 'D-Pad',
      leftStick: 'L Stick',
      rightStick: 'R Stick',
      start: 'Start',
      select: 'Select'
    }
  },
  {
    platformName: 'Nintendo Game Boy Advance',
    positions: {
      faceRight: 'A',
      faceBottom: 'B',
      shoulderL: 'L',
      shoulderR: 'R',
      dpad: 'D-Pad',
      start: 'Start',
      select: 'Select'
    }
  }
]

const controllerLayoutMap: Map<string, PlatformControllerLayout> = new Map(
  layouts.map((l) => [l.platformName, l])
)

export function getControllerLayout(platformName: string): PlatformControllerLayout | null {
  return controllerLayoutMap.get(platformName) ?? null
}
