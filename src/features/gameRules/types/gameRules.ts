export interface GameRulesFeatures {
  auth: boolean
  profiles: boolean
  collection: boolean
  starter_selection: boolean
  creature_selection: boolean
  pve: boolean
  pvp: boolean
  evolution_execution: boolean
  multiplayer: boolean
  rankings: boolean
  achievements: boolean
  [flag: string]: boolean
}

export interface XpCurveEntry {
  level: number
  xp_to_advance: number
  total_xp_required: number
}

/** Selection quota rule for one evolution stage. Every value is server-defined (null = not defined). */
export interface StageSelectionRule {
  unlock_level: number | null
  allowance_cap?: number | null
  allowance_at_unlock?: number | null
  increment_per_level?: number | null
  defined_through_level?: number | null
}

export interface SelectionSample {
  trainer_level: number
  stage_1_allowance: number
  stage_2_allowance: number
}

export interface BattleReward {
  win: number
  loss: number
}

export interface GameRules {
  rules_version: string
  features: GameRulesFeatures
  progression: {
    starting_level?: number
    starting_xp?: number
    xp_increment_per_level: number
    /** Backward-compatible alias of `xp_increment_per_level`. */
    xp_base?: number
    /** Always null since arithmetic progression (3.1.0). */
    xp_growth?: number | null
    max_level: number
    formula: string
    curve: XpCurveEntry[]
  }
  /** Optional mirror of progression starter fields from newer API payloads. */
  trainer?: {
    starting_level?: number
    starting_xp?: number
  }
  selection: {
    stage_1: StageSelectionRule
    stage_2: StageSelectionRule
    stage_3: StageSelectionRule
    samples: SelectionSample[]
  }
  battle: {
    pve_min_trainer_level: number
    pvp_min_trainer_level: number
    rewards: {
      pve: BattleReward
      pvp: BattleReward
    }
    /** True only once battles can actually be played and rewards earned. */
    playable: boolean
  }
  starters: {
    creature_slugs: string[]
  }
  avatar: {
    max_upload_kb: number
    max_dimension: number
    output_dimension: number
    allowed_mime_types: string[]
  }
}

export interface GameRulesResponse {
  data: GameRules
}
