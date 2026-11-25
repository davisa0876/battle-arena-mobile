import { resolveCryUrl } from '@/src/shared/lib/audio/battleAudioSettings'
import type { CryAudioManager } from '@/src/shared/lib/audio/cryAudioManager'

import type { BattleCombatantView } from '../types/battle'

export type BattleIntroPhase =
  | 'idle'
  | 'arena'
  | 'opponent_enter'
  | 'opponent_cry'
  | 'player_enter'
  | 'player_cry'
  | 'ready'
  | 'skipped'

export interface BattleIntroState {
  phase: BattleIntroPhase
  showOpponent: boolean
  showPlayer: boolean
  message: string | null
  controlsEnabled: boolean
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function initialIntroState(skip = false): BattleIntroState {
  if (skip) {
    return {
      phase: 'skipped',
      showOpponent: true,
      showPlayer: true,
      message: null,
      controlsEnabled: true,
    }
  }
  return {
    phase: 'idle',
    showOpponent: false,
    showPlayer: false,
    message: null,
    controlsEnabled: false,
  }
}

export async function runBattleIntro(options: {
  audio: CryAudioManager
  opponent: BattleCombatantView
  player: BattleCombatantView
  cancelled: () => boolean
  onUpdate: (state: BattleIntroState) => void
  startedMessage: string
}): Promise<void> {
  const { audio, opponent, player, cancelled, onUpdate, startedMessage } = options

  const emit = (partial: Partial<BattleIntroState> & { phase: BattleIntroPhase }) => {
    onUpdate({
      showOpponent: partial.showOpponent ?? false,
      showPlayer: partial.showPlayer ?? false,
      message: partial.message ?? null,
      controlsEnabled: partial.controlsEnabled ?? false,
      phase: partial.phase,
    })
  }

  emit({ phase: 'arena' })
  await delay(250)
  if (cancelled()) return

  emit({ phase: 'opponent_enter', showOpponent: true })
  await delay(350)
  if (cancelled()) return

  emit({ phase: 'opponent_cry', showOpponent: true })
  await audio.playCry({
    url: resolveCryUrl(opponent.cry_latest_url, opponent.cry_legacy_url, opponent.cry_url),
  })
  if (cancelled()) return

  emit({ phase: 'player_enter', showOpponent: true, showPlayer: true })
  await delay(350)
  if (cancelled()) return

  emit({ phase: 'player_cry', showOpponent: true, showPlayer: true })
  await audio.playCry({
    url: resolveCryUrl(player.cry_latest_url, player.cry_legacy_url, player.cry_url),
  })
  if (cancelled()) return

  emit({
    phase: 'ready',
    showOpponent: true,
    showPlayer: true,
    message: startedMessage,
    controlsEnabled: true,
  })
}
