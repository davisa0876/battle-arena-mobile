import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { CreatureImage } from '@/src/features/creatures/components/CreatureImage'
import { ActionButton } from '@/src/shared/components/ActionButton'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import type { OwnedCreature } from '../types'

interface OwnedCreatureCardProps {
  owned: OwnedCreature
  /** Show the "set active" action (own collection only). */
  onSetActive?: (id: number) => void
  activating?: boolean
}

export function OwnedCreatureCard({ owned, onSetActive, activating = false }: OwnedCreatureCardProps) {
  const { t } = useTranslation()
  const { creature } = owned
  const options = owned.evolution?.options ?? []

  return (
    <View style={[styles.card, owned.is_active && styles.cardActive]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/creatures/${creature.slug}`)}
        style={styles.top}>
        <CreatureImage
          imageRef={creature.image_ref}
          imageUrl={creature.image_url}
          name={creature.name}
          style={styles.image}
        />
        <View style={styles.info}>
          {owned.is_active ? <Text style={styles.active}>{t('collection.active')}</Text> : null}
          <Text style={styles.name}>{creature.name}</Text>
          <Text style={styles.types}>{creature.types.map((type) => type.name).join(' · ')}</Text>
          <Text style={styles.level}>{t('collection.level', { level: owned.level })}</Text>
          <Text style={styles.xp}>{t('collection.xp', { xp: owned.total_xp })}</Text>
        </View>
      </Pressable>

      {onSetActive && !owned.is_active ? (
        <ActionButton
          loading={activating}
          variant="secondary"
          onPress={() => onSetActive(owned.id)}>
          {t('collection.setActive')}
        </ActionButton>
      ) : null}

      {options.length > 0 ? (
        <View style={styles.evolutions}>
          <Text style={styles.evolutionsTitle}>{t('collection.evolution.title')}</Text>
          {options.map((option) => (
            <View key={option.creature.id} style={styles.evolutionRow}>
              <CreatureImage
                imageRef={option.creature.image_ref}
                imageUrl={option.creature.image_url}
                name={option.creature.name}
                style={styles.evolutionImage}
              />
              <View style={styles.evolutionInfo}>
                <Text style={styles.evolutionName}>{option.creature.name}</Text>
                <Text style={[styles.evolutionStatus, option.locked ? styles.locked : styles.unlocked]}>
                  {option.locked ? t('collection.evolution.locked') : t('collection.evolution.ready')}
                </Text>
                {option.reason ? <Text style={styles.evolutionReason}>{option.reason}</Text> : null}
              </View>
            </View>
          ))}
          {owned.evolution?.execution_enabled === false ? (
            <Text style={styles.evolutionReason}>{t('collection.evolution.notAvailable')}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardActive: {
    borderColor: colors.ember,
  },
  top: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  image: {
    height: 96,
    width: 96,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  active: {
    color: colors.ember,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  types: {
    color: colors.electric,
    fontSize: 12,
    fontWeight: '700',
  },
  level: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  xp: {
    color: colors.textMuted,
    fontSize: 12,
  },
  evolutions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  evolutionsTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  evolutionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  evolutionImage: {
    height: 56,
    opacity: 0.6,
    width: 56,
  },
  evolutionInfo: {
    flex: 1,
    gap: 2,
  },
  evolutionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  evolutionStatus: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  locked: {
    color: colors.gold,
  },
  unlocked: {
    color: colors.success,
  },
  evolutionReason: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
})
