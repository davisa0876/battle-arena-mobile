import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { RequireAuth, useAuth } from '@/src/features/auth'
import { CreatureImage } from '@/src/features/creatures/components/CreatureImage'
import { ActionButton } from '@/src/shared/components/ActionButton'
import { BackButton } from '@/src/shared/components/BackButton'
import { LoadingState } from '@/src/shared/components/LoadingState'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { useStarterSelection } from '../hooks/useStarterSelection'

function StarterContent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const flow = useStarterSelection()
  const alreadySelected = user?.onboarding.starter_selected === true

  return (
    <Screen>
      <BackButton fallbackHref="/profile" />
      <Text style={styles.eyebrow}>{t('collection.starter.eyebrow')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('collection.starter.title')}
      </Text>
      <Text style={styles.description}>{t('collection.starter.description')}</Text>

      {alreadySelected ? (
        <>
          <MessageBox tone="info" message={t('collection.starter.alreadySelected')} />
          <ActionButton onPress={() => router.replace('/my-collection')}>{t('collection.open')}</ActionButton>
        </>
      ) : (
        <>
          {flow.options.status === 'loading' ? <LoadingState label={t('collection.starter.loading')} /> : null}
          {flow.options.status === 'error' ? (
            <MessageBox
              tone="error"
              title={t('collection.starter.errorTitle')}
              message={flow.options.message}
              onRetry={flow.retry}
            />
          ) : null}
          {flow.error ? <MessageBox tone="error" message={flow.error} /> : null}

          {flow.options.status === 'ready' ? (
            <>
              <View style={styles.grid}>
                {flow.options.starters.map((creature) => {
                  const selected = flow.selectedSlug === creature.slug
                  return (
                    <Pressable
                      key={creature.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      disabled={flow.submitting}
                      onPress={() => flow.setSelectedSlug(creature.slug)}
                      style={[styles.card, selected && styles.cardSelected]}>
                      <CreatureImage
                        imageRef={creature.image_ref}
                        imageUrl={creature.image_url}
                        name={creature.name}
                        style={styles.image}
                      />
                      <Text style={styles.name}>{creature.name}</Text>
                      <Text style={styles.types}>{creature.types.map((type) => type.name).join(' · ')}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <Text style={styles.warning}>{t('collection.starter.permanent')}</Text>
              <ActionButton
                disabled={!flow.selectedSlug}
                loading={flow.submitting}
                onPress={() => void flow.confirm()}>
                {t('collection.starter.confirm')}
              </ActionButton>
            </>
          ) : null}
        </>
      )}
    </Screen>
  )
}

export function StarterSelectionScreen() {
  return (
    <RequireAuth>
      <StarterContent />
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 2,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: colors.ember,
  },
  image: {
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  types: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  warning: {
    color: colors.gold,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
})
