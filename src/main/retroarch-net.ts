import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import dgram from 'dgram'
import { LAUNCHBOX_DIR } from './launchbox'

const RETROARCH_CFG_PATH = join(LAUNCHBOX_DIR, 'Emulators', 'RetroArch', 'retroarch.cfg')
const RETROARCH_UDP_HOST = '127.0.0.1'
const RETROARCH_UDP_PORT = 55355

export function ensureNetworkCmdEnabled(): void {
  if (!existsSync(RETROARCH_CFG_PATH)) {
    console.log('[RetroArch] Config file not found, skipping network cmd setup')
    return
  }

  try {
    let cfg = readFileSync(RETROARCH_CFG_PATH, 'utf-8')
    const original = cfg

    cfg = cfg.replace(/^(network_cmd_enable\s*=\s*)"false"/m, '$1"true"')

    if (cfg !== original) {
      writeFileSync(RETROARCH_CFG_PATH, cfg, 'utf-8')
      console.log('[RetroArch] Enabled network_cmd_enable in retroarch.cfg')
    } else {
      console.log('[RetroArch] network_cmd_enable already set to true (or not found)')
    }
  } catch (err) {
    console.error('[RetroArch] Failed to update retroarch.cfg:', err)
  }
}

export function sendRetroArchCommand(command: 'SAVE_STATE' | 'LOAD_STATE'): void {
  const client = dgram.createSocket('udp4')
  const message = Buffer.from(command)

  client.send(message, 0, message.length, RETROARCH_UDP_PORT, RETROARCH_UDP_HOST, (err) => {
    if (err) {
      console.error(`[RetroArch] Failed to send ${command}:`, err)
    } else {
      console.log(`[RetroArch] Sent: ${command}`)
    }
    client.close()
  })
}
