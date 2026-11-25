import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { rulesInterpolation, type RulesSection } from '../lib/sections'
import type { GameRules } from '../types'

interface RulesSectionCardProps {
  section: RulesSection
  rules: GameRules
}

export function RulesSectionCard({ section, rules }: RulesSectionCardProps) {
  const { t } = useTranslation()
  const base = `gameRules.sections.${section.id}`
  const values = rulesInterpolation(rules)
  const available = section.status === 'available'
  const rawPoints = t(`${base}.points`, { ...values, returnObjects: true }) as unknown
  const points = Array.isArray(rawPoints) ? rawPoints.filter((p): p is string => typeof p === 'string') : []

  return (
    <View style={[styles.card, available ? styles.cardAvailable : null]}>
      <View style={styles.header}>
        <Text style={styles.letter}>{section.id}</Text>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={styles.title}>
            {t(`${base}.title`)}
          </Text>
          <Text style={[styles.badge, available ? styles.badgeAvailable : styles.badgePlanned]}>
            {available ? t('common.available') : t('gameRules.planned')}
          </Text>
        </View>
      </View>

      <Text style={styles.summary}>{t(`${base}.summary`, values)}</Text>

      {points.map((point) => (
        <View key={point} style={styles.point}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.pointText}>{point}</Text>
        </View>
      ))}

      {section.id === 'A' ? <XpCurve rules={rules} /> : null}
      {section.id === 'B' ? (
        <>
          <SelectionRules rules={rules} />
          <Starters rules={rules} />
        </>
      ) : null}
      {section.id === 'C' ? <BattleEligibility rules={rules} /> : null}
      {section.id === 'D' ? <BattleRewards rules={rules} /> : null}
      {section.id === 'F' ? <FeatureFlags rules={rules} /> : null}
    </View>
  )
}

function XpCurve({ rules }: { rules: GameRules }) {
  const { t } = useTranslation()

  return (
    <View style={styles.table}>
      <Text style={styles.tableTitle}>{t('gameRules.curve.title')}</Text>
      <Text style={styles.formula}>{t('gameRules.curve.increment', { xp: rules.progression.xp_increment_per_level })}</Text>
      <Text style={styles.formula}>{rules.progression.formula}</Text>
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.curve.level')}</Text>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.curve.toAdvance')}</Text>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.curve.total')}</Text>
      </View>
      {rules.progression.curve.map((entry) => (
        <View key={entry.level} style={styles.tableRow}>
          <Text style={styles.cell}>{entry.level}</Text>
          <Text style={styles.cell}>{entry.xp_to_advance}</Text>
          <Text style={styles.cell}>{entry.total_xp_required}</Text>
        </View>
      ))}
    </View>
  )
}

/** Stage quotas described only with numbers the API publishes (null = rule not defined yet). */
function SelectionRules({ rules }: { rules: GameRules }) {
  const { t } = useTranslation()
  const { stage_1: stage1, stage_2: stage2, stage_3: stage3, samples } = rules.selection

  const undefinedLine = (stage: number) => t('gameRules.selection.stageUndefined', { stage })

  const lines = [
    stage1.unlock_level != null && stage1.allowance_cap != null
      ? t('gameRules.selection.stage1', { unlock: stage1.unlock_level, cap: stage1.allowance_cap })
      : undefinedLine(1),
    stage2.unlock_level != null && stage2.allowance_at_unlock != null && stage2.increment_per_level != null
      ? [
          t('gameRules.selection.stage2', {
            unlock: stage2.unlock_level,
            atUnlock: stage2.allowance_at_unlock,
            increment: stage2.increment_per_level,
          }),
          stage2.defined_through_level != null
            ? t('gameRules.selection.stage2Through', { through: stage2.defined_through_level })
            : '',
        ]
          .join(' ')
          .trim()
      : undefinedLine(2),
    stage3.unlock_level != null
      ? t('gameRules.selection.stageUnlock', { stage: 3, unlock: stage3.unlock_level })
      : undefinedLine(3),
  ]

  return (
    <View style={styles.table}>
      {lines.map((line, index) => (
        <View key={`${index}-${line}`} style={styles.point}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.pointText}>{line}</Text>
        </View>
      ))}
      <Text style={[styles.tableTitle, styles.tableGap]}>{t('gameRules.selection.samplesTitle')}</Text>
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.selection.trainerLevel')}</Text>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.selection.stage1Column')}</Text>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.selection.stage2Column')}</Text>
      </View>
      {samples.map((sample) => (
        <View key={sample.trainer_level} style={styles.tableRow}>
          <Text style={styles.cell}>{sample.trainer_level}</Text>
          <Text style={styles.cell}>{sample.stage_1_allowance}</Text>
          <Text style={styles.cell}>{sample.stage_2_allowance}</Text>
        </View>
      ))}
    </View>
  )
}

function Starters({ rules }: { rules: GameRules }) {
  const { t } = useTranslation()

  return (
    <View style={styles.table}>
      <Text style={styles.tableTitle}>{t('gameRules.starters.title')}</Text>
      <View style={styles.chips}>
        {rules.starters.creature_slugs.map((slug) => (
          <Text key={slug} style={styles.chip}>
            {slug}
          </Text>
        ))}
      </View>
    </View>
  )
}

function BattleEligibility({ rules }: { rules: GameRules }) {
  const { t } = useTranslation()
  const { battle } = rules

  return (
    <View style={styles.table}>
      <View style={styles.point}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.pointText}>{t('gameRules.battle.pve', { level: battle.pve_min_trainer_level })}</Text>
      </View>
      <View style={styles.point}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.pointText}>{t('gameRules.battle.pvp', { level: battle.pvp_min_trainer_level })}</Text>
      </View>
      <Text style={[styles.notice, styles.tableGap]}>
        {battle.playable ? t('gameRules.battle.playable') : t('gameRules.battle.notPlayable')}
      </Text>
    </View>
  )
}

/** Rewards are shown as published, but flagged as not earnable until the server says battles are playable. */
function BattleRewards({ rules }: { rules: GameRules }) {
  const { t } = useTranslation()
  const { battle } = rules
  const rows = [
    { mode: 'pve' as const, reward: battle.rewards.pve },
    { mode: 'pvp' as const, reward: battle.rewards.pvp },
  ]

  return (
    <View style={styles.table}>
      <Text style={styles.tableTitle}>{t('gameRules.rewards.title')}</Text>
      {battle.playable ? null : (
        <Text style={styles.notice}>
          {t('gameRules.planned')} · {t('gameRules.rewards.notEarnable')}
        </Text>
      )}
      <View style={styles.tableRow}>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.rewards.mode')}</Text>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.rewards.win')}</Text>
        <Text style={[styles.cell, styles.cellHead]}>{t('gameRules.rewards.loss')}</Text>
      </View>
      {rows.map(({ mode, reward }) => (
        <View key={mode} style={styles.tableRow}>
          <Text style={styles.cell}>{t(`gameRules.rewards.${mode}`)}</Text>
          <Text style={styles.cell}>{t('gameRules.rewards.xp', { xp: reward.win })}</Text>
          <Text style={styles.cell}>{t('gameRules.rewards.xp', { xp: reward.loss })}</Text>
        </View>
      ))}
    </View>
  )
}

function FeatureFlags({ rules }: { rules: GameRules }) {
  const { t } = useTranslation()

  return (
    <View style={styles.table}>
      {Object.entries(rules.features)
        .filter(([name]) => name !== 'battles')
        .map(([name, enabled]) => (
        <View key={name} style={styles.tableRow}>
          <Text style={styles.cell}>{t(`gameRules.features.${name}`, { defaultValue: name })}</Text>
          <Text style={[styles.cell, enabled ? styles.flagOn : styles.flagOff]}>
            {enabled ? t('common.available') : t('gameRules.planned')}
          </Text>
        </View>
      ))}
    </View>
  )
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardAvailable: {
    borderColor: colors.success,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  letter: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    color: colors.electric,
    fontSize: 20,
    fontWeight: '800',
    height: 40,
    lineHeight: 40,
    overflow: 'hidden',
    textAlign: 'center',
    width: 40,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  badgeAvailable: {
    color: colors.success,
  },
  badgePlanned: {
    color: colors.gold,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  point: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bullet: {
    color: colors.ember,
    fontSize: 14,
  },
  pointText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  table: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  tableTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  tableGap: {
    marginTop: spacing.md,
  },
  notice: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  flagOn: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  flagOff: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  formula: {
    color: colors.gold,
    fontSize: 12,
    marginVertical: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  cell: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
  },
  cellHead: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.electric,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'capitalize',
  },
})
