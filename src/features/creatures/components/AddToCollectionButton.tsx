import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { acquireCreature, selectStarter } from '@/src/features/collection/api/collection'
import { useAuth } from '@/src/features/auth'
import { ApiError } from '@/src/shared/lib/api-client'
import type { Creature } from '@/src/features/creatures/types'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

interface AddToCollectionButtonProps {
  creature: Creature
  onSelected?: () => void
}

export function AddToCollectionButton({ creature, onSelected }: AddToCollectionButtonProps) {
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSelect = creature.can_select === true
  const reason = creature.selection_blocked_reason ?? null
  const disabled = !canSelect || busy

  const label = creature.is_owned
    ? t('creatures.selection.owned')
    : busy
      ? t('creatures.selection.adding')
      : t('creatures.selection.add')

  const hint =
    reason && !canSelect
      ? t(`creatures.selection.reasons.${reason}`, {
          defaultValue: t('creatures.selection.reasons.unavailable'),
        })
      : null

  const onPress = async () => {
    if (!canSelect || busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (creature.selection_action === 'starter') {
        await selectStarter(creature.slug)
      } else {
        const key = `mobile-acquire:${creature.slug}:${Date.now()}`
        await acquireCreature(creature.slug, key)
      }
      await refreshUser().catch(() => undefined)
      onSelected?.()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('creatures.selection.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={disabled}
        onPress={() => void onPress()}
        style={({ pressed }) => [
          styles.button,
          canSelect ? styles.enabled : styles.disabled,
          pressed && canSelect ? styles.pressed : null,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityHint={hint ?? undefined}
      >
        <Text style={[styles.label, canSelect ? styles.labelEnabled : styles.labelDisabled]}>{label}</Text>
      </Pressable>
      {hint && !canSelect ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  enabled: {
    backgroundColor: colors.ember,
    borderColor: colors.ember,
  },
  disabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
  labelEnabled: {
    color: colors.background,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
})
