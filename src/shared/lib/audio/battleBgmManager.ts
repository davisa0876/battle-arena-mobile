import { createAudioPlayer, type AudioPlayer } from 'expo-audio'

import { readBattleAudioSettings, writeBattleAudioSettings } from './battleAudioSettings'

const ARENA_BGM = require('../../../../assets/pve/arena-bgm.m4a')

/** Looping PvE arena music. Separate from cry SFX. */
export class BattleBgmManager {
  private player: AudioPlayer | null = null
  private wanted = false

  private async ensurePlayer(): Promise<AudioPlayer> {
    if (!this.player) {
      const player = createAudioPlayer(ARENA_BGM)
      player.loop = true
      this.player = player
    }
    return this.player
  }

  private async effectiveVolume(): Promise<number> {
    const settings = await readBattleAudioSettings()
    if (settings.muted || !settings.musicEnabled) return 0
    return Math.max(0, Math.min(1, settings.volume * 0.55))
  }

  async play(): Promise<void> {
    this.wanted = true
    const settings = await readBattleAudioSettings()
    if (settings.muted || !settings.musicEnabled) {
      this.pause()
      return
    }

    try {
      const player = await this.ensurePlayer()
      player.volume = await this.effectiveVolume()
      player.play()
    } catch {
      // ignore codec / autoplay failures
    }
  }

  pause(): void {
    if (!this.player) return
    try {
      this.player.pause()
    } catch {
      // ignore
    }
  }

  stop(): void {
    this.wanted = false
    if (!this.player) return
    try {
      this.player.pause()
      this.player.remove()
    } catch {
      // ignore
    }
    this.player = null
  }

  async syncFromSettings(): Promise<void> {
    if (!this.wanted) return
    const settings = await readBattleAudioSettings()
    if (settings.muted || !settings.musicEnabled) {
      this.pause()
      return
    }
    if (this.player) {
      this.player.volume = await this.effectiveVolume()
    }
    await this.play()
  }

  async setMusicEnabled(enabled: boolean): Promise<void> {
    await writeBattleAudioSettings({ musicEnabled: enabled })
    await this.syncFromSettings()
  }
}

let shared: BattleBgmManager | null = null

export function getBattleBgmManager(): BattleBgmManager {
  if (!shared) shared = new BattleBgmManager()
  return shared
}
