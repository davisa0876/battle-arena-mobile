import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { RequireAuth, useAuth } from '@/src/features/auth'
import { TrainerAllowances } from '@/src/features/profile/components/TrainerAllowances'
import { ActionButton } from '@/src/shared/components/ActionButton'
import { LoadingState } from '@/src/shared/components/LoadingState'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { OwnedCreatureCard } from '../components/OwnedCreatureCard'
import { useMyCollection } from '../hooks/useMyCollection'

function MyCollectionContent() {
  const { t } = useTranslation()
  const { state, reload, setActive, activatingId, actionError } = useMyCollection()
  const { user } = useAuth()

  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('collection.eyebrow')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('collection.title')}
      </Text>
      <Text style={styles.description}>{t('collection.description')}</Text>

      {user?.trainer ? <TrainerAllowances trainer={user.trainer} /> : null}

      {actionError ? <MessageBox tone="error" message={actionError} /> : null}

      {state.status === 'loading' ? <LoadingState label={t('collection.loading')} /> : null}
      {state.status === 'error' ? (
        <MessageBox tone="error" title={t('collection.errorTitle')} message={state.message} onRetry={reload} />
      ) : null}

      {state.status === 'ready' && state.creatures.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('collection.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('collection.emptyDescription')}</Text>
          <ActionButton onPress={() => router.push('/starter-selection')}>
            {t('collection.chooseStarter')}
          </ActionButton>
        </View>
      ) : null}

      {state.status === 'ready'
        ? state.creatures.map((owned) => (
            <OwnedCreatureCard
              key={owned.id}
              activating={activatingId === owned.id}
              onSetActive={(id) => void setActive(id)}
              owned={owned}
            />
          ))
        : null}
    </Screen>
  )
}

export function MyCollectionScreen() {
  return (
    <RequireAuth>
      <MyCollectionContent />
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
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
})
