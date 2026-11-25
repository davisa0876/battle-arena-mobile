import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

import { LoadingState } from '@/src/shared/components/LoadingState'
import { MessageBox } from '@/src/shared/components/MessageBox'
import { Screen } from '@/src/shared/components/Screen'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

import { RulesSectionCard } from '../components/RulesSectionCard'
import { useGameRules } from '../hooks/useGameRules'
import { buildRulesSections } from '../lib/sections'

export function GameRulesScreen() {
  const { t } = useTranslation()
  const [retryToken, setRetryToken] = useState(0)
  const state = useGameRules(retryToken)

  // Public screen: rules are server-published reference data and need no session.
  return (
    <Screen>
      <Text style={styles.eyebrow}>{t('gameRules.eyebrow')}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {t('gameRules.title')}
      </Text>
      <Text style={styles.description}>{t('gameRules.description')}</Text>

      {state.status === 'loading' ? <LoadingState label={t('gameRules.loading')} /> : null}
      {state.status === 'error' ? (
        <MessageBox
          tone="error"
          title={t('gameRules.errorTitle')}
          message={state.message}
          onRetry={() => setRetryToken((value) => value + 1)}
        />
      ) : null}

      {state.status === 'ready' ? (
        <>
          <Text style={styles.version}>{t('gameRules.version', { version: state.rules.rules_version })}</Text>
          {buildRulesSections(state.rules.features).map((section) => (
            <RulesSectionCard key={section.id} section={section} rules={state.rules} />
          ))}
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.electric,
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
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  version: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
})
