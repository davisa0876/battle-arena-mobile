import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { RequireAuth } from '@/src/features/auth'
import { OwnedCreatureCard } from '@/src/features/collection/components/OwnedCreatureCard'
import { Avatar } from '@/src/shared/components/Avatar'
import { BackButton } from '@/src/shared/components/BackButton'
import { LoadingState } from '@/src/shared/components/LoadingState'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { TrainerCard } from '../components/TrainerCard'
import { usePublicPlayer } from '../hooks/usePublicPlayer'

export function PublicPlayerScreen() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ handle?: string | string[] }>()
  const handle = Array.isArray(params.handle) ? (params.handle[0] ?? '') : (params.handle ?? '')
  const [retryToken, setRetryToken] = useState(0)
  const state = usePublicPlayer(handle, retryToken)

  return (
    <RequireAuth>
    <Screen>
      <BackButton fallbackHref="/" />

      {state.status === 'loading' ? <LoadingState label={t('profile.player.loading')} /> : null}
      {state.status === 'error' ? (
        <MessageBox
          tone="error"
          message={state.message}
          onRetry={state.notFound ? undefined : () => setRetryToken((value) => value + 1)}
        />
      ) : null}

      {state.status === 'ready' ? (
        <>
          <Text style={styles.eyebrow}>{t('profile.player.eyebrow')}</Text>
          <View style={styles.hero}>
            <Avatar name={state.player.display_name} url={state.player.avatar_url} size={88} />
            <View style={styles.heroText}>
              <Text accessibilityRole="header" style={styles.name}>
                {state.player.display_name}
              </Text>
              <Text style={styles.handle}>@{state.player.handle}</Text>
            </View>
          </View>

          {state.player.bio ? <Text style={styles.bio}>{state.player.bio}</Text> : null}
          {state.player.trainer ? <TrainerCard trainer={state.player.trainer} /> : null}

          <Text style={styles.section}>{t('profile.player.collection')}</Text>
          {state.player.collection_is_public && state.player.creatures ? (
            state.player.creatures.length > 0 ? (
              state.player.creatures.map((owned) => <OwnedCreatureCard key={owned.id} owned={owned} />)
            ) : (
              <Text style={styles.muted}>{t('profile.player.emptyCollection')}</Text>
            )
          ) : (
            <Text style={styles.muted}>{t('profile.player.privateCollection')}</Text>
          )}
        </>
      ) : null}
    </Screen>
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
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  handle: {
    color: colors.electric,
    fontSize: 14,
    fontWeight: '700',
  },
  bio: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  section: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
  },
})
