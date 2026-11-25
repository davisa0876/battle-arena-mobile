import type { GameRules, GameRulesFeatures } from '../types'

export type RulesSectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type RulesSectionStatus = 'available' | 'planned'

interface SectionDefinition {
  id: RulesSectionId
  /**
   * How the available/planned badge is decided:
   * - available: always live content about the current build
   * - planned: always upcoming
   * - flags: live only when every listed API feature flag is true
   */
  mode: 'available' | 'planned' | 'flags'
  flags?: (keyof GameRulesFeatures)[]
}

export interface RulesSection {
  id: RulesSectionId
  status: RulesSectionStatus
  flags: { name: string; enabled: boolean }[]
}

/**
 * Phase 3 (rules 3.1.0) Game Rules structure:
 * A–F section shells. Balancing numbers always come from GET /api/game/rules.
 * C reads as available once PvE is enabled; D once PvP is enabled.
 */
const DEFINITIONS: SectionDefinition[] = [
  { id: 'A', mode: 'available' },
  { id: 'B', mode: 'available' },
  { id: 'C', mode: 'flags', flags: ['pve'] },
  { id: 'D', mode: 'flags', flags: ['pvp'] },
  { id: 'E', mode: 'available' },
  { id: 'F', mode: 'available' },
]

export function buildRulesSections(features: GameRulesFeatures): RulesSection[] {
  return DEFINITIONS.map(({ id, mode, flags = [] }) => {
    const resolved = flags.map((name) => ({ name: String(name), enabled: features[name] === true }))

    let status: RulesSectionStatus = 'available'
    if (mode === 'planned') {
      status = 'planned'
    } else if (mode === 'flags') {
      status = resolved.every((flag) => flag.enabled) ? 'available' : 'planned'
    }

    return { id, status, flags: resolved }
  })
}

export function rulesInterpolation(rules: GameRules) {
  return {
    startingLevel: rules.progression.starting_level ?? rules.trainer?.starting_level ?? '—',
    startingXp: rules.progression.starting_xp ?? rules.trainer?.starting_xp ?? '—',
    increment: rules.progression.xp_increment_per_level,
    maxLevel: rules.progression.max_level,
    starterCount: rules.starters.creature_slugs.length,
    maxKb: rules.avatar.max_upload_kb,
    maxDimension: rules.avatar.max_dimension,
    outputDimension: rules.avatar.output_dimension,
  }
}
