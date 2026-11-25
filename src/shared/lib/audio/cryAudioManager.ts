import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

import { getBattleBgmManager } from './battleBgmManager'
import {
  readBattleAudioSettings,
  writeBattleAudioSettings,
  type BattleAudioSettings,
} from './battleAudioSettings'

export interface CryPlaybackOptions {
  url: string | null | undefined
}

/**
 * Expo cry player. Failures are swallowed so battles continue silently
 * when OGG is unsupported or a URL is missing.
 */
export class CryAudioManager {
  private current: AudioPlayer | null = null
  private settings: BattleAudioSettings = {
    muted: false,
    volume: 0.7,
    unlocked: false,
    musicEnabled: true,
  }
  private queue: Promise<void> = Promise.resolve()
  private disposed = false
  private ready: Promise<void>

  constructor() {
    this.ready = this.bootstrap()
  }

  private async bootstrap(): Promise<void> {
    this.settings = await readBattleAudioSettings()
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
      })
    } catch {
      // platform may reject mode changes; ignore
    }
  }

  getSettings(): BattleAudioSettings {
    return { ...this.settings }
  }

  async setMuted(muted: boolean): Promise<void> {
    await this.ready
    this.settings = await writeBattleAudioSettings({ muted })
    if (muted) this.stop()
    await getBattleBgmManager().syncFromSettings()
  }

  async setVolume(volume: number): Promise<void> {
    await this.ready
    this.settings = await writeBattleAudioSettings({ volume })
    if (this.current && !this.settings.muted) {
      this.current.volume = this.settings.volume
    }
    await getBattleBgmManager().syncFromSettings()
  }

  async markUnlocked(): Promise<void> {
    await this.ready
    this.settings = await writeBattleAudioSettings({ unlocked: true })
  }

  stop(): void {
    if (!this.current) return
    try {
      this.current.pause()
      this.current.remove()
    } catch {
      // ignore
    }
    this.current = null
  }

  dispose(): void {
    this.disposed = true
    this.stop()
  }

  playCry(options: CryPlaybackOptions): Promise<void> {
    const run = async () => {
      await this.ready
      if (this.disposed || this.settings.muted) return
      const url = options.url?.trim()
      if (!url) return

      this.stop()
      try {
        const player = createAudioPlayer({ uri: url })
        player.volume = this.settings.volume
        this.current = player
        player.play()

        await new Promise<void>((resolve) => {
          const started = Date.now()
          const timer = setInterval(() => {
            const status = player.currentStatus
            const ended =
              status.didJustFinish ||
              (!status.playing && status.currentTime > 0 && status.duration > 0) ||
              Date.now() - started > 8000
            if (ended) {
              clearInterval(timer)
              resolve()
            }
          }, 120)
        })
      } catch {
        // missing codec / network — continue silently
      } finally {
        this.stop()
      }
    }

    this.queue = this.queue.then(run, run)
    return this.queue
  }
}

let shared: CryAudioManager | null = null

export function getCryAudioManager(): CryAudioManager {
  if (!shared) shared = new CryAudioManager()
  return shared
}
