import { createAudioPlayer, type AudioPlayer } from 'expo-audio'

import { readBattleAudioSettings } from './battleAudioSettings'

const ATTACKS = [
  require('../../../../assets/pve/sfx/attack1.m4a'),
  require('../../../../assets/pve/sfx/attack2.m4a'),
  require('../../../../assets/pve/sfx/attack3.m4a'),
] as const

const WIN = require('../../../../assets/pve/sfx/crowd-cheering.m4a')
const LOSS = [
  require('../../../../assets/pve/sfx/disappointment-reaction.m4a'),
  require('../../../../assets/pve/sfx/loose-cartoon.m4a'),
] as const

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

async function playSource(source: number, timeoutMs = 12_000): Promise<void> {
  const settings = await readBattleAudioSettings()
  if (settings.muted) return

  let player: AudioPlayer | null = null
  try {
    player = createAudioPlayer(source)
    player.volume = settings.volume
    player.play()

    await new Promise<void>((resolve) => {
      const started = Date.now()
      const timer = setInterval(() => {
        if (!player) {
          clearInterval(timer)
          resolve()
          return
        }
        try {
          const status = player.currentStatus
          const ended =
            status.didJustFinish ||
            (!status.playing && status.currentTime > 0 && status.duration > 0) ||
            Date.now() - started > timeoutMs
          if (ended) {
            clearInterval(timer)
            resolve()
          }
        } catch {
          clearInterval(timer)
          resolve()
        }
      }, 120)
    })
  } catch {
    // ignore codec / playback failures
  } finally {
    try {
      player?.pause()
      player?.remove()
    } catch {
      // ignore
    }
  }
}

export function playAttackSfx(): Promise<void> {
  return playSource(pickRandom(ATTACKS), 5_000)
}

export function playWinSfx(): Promise<void> {
  return playSource(WIN, 18_000)
}

export async function playLossSfx(): Promise<void> {
  for (const clip of LOSS) {
    await playSource(clip, 10_000)
  }
}

export function playOutcomeSfx(outcome: 'win' | 'loss' | null | undefined): Promise<void> {
  if (outcome === 'win') return playWinSfx()
  if (outcome === 'loss') return playLossSfx()
  return Promise.resolve()
}
