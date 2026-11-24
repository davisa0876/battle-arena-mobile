import { Image } from 'expo-image'
import { Link } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Screen } from '@/src/shared/components/Screen'
import { apiClient } from '@/src/shared/lib/api-client'
import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

type ConnectionStatus = 'connecting' | 'connected' | 'offline'

export default function HomeScreen() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  const checkHealth = useCallback(async () => {
    setStatus('connecting')
    try {
      await apiClient.get('/api/health')
      setStatus('connected')
    } catch {
      setStatus('offline')
    }
  }, [])

  useEffect(() => {
    void checkHealth()
  }, [checkHealth])

  return (
    <Screen>
      <Image
        source={require('../../assets/brand/logo_horizontal.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel={t('navigation.brandAlt')}
      />

      <Text style={styles.eyebrow}>{t('home.phase')}</Text>
      <Text style={styles.title}>{t('home.heroTitle')}</Text>
      <Text style={styles.subtitle}>{t('home.heroSubtitle')}</Text>

      <Text style={styles.sectionEyebrow}>{t('home.modesEyebrow')}</Text>
      <Text style={styles.sectionTitle}>{t('home.modesTitle')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.modes.solo.title')}</Text>
        <Text style={styles.cardBody}>{t('home.modes.solo.description')}</Text>
        <Text style={styles.badge}>{t('common.comingSoon')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('home.modes.online.title')}</Text>
        <Text style={styles.cardBody}>{t('home.modes.online.description')}</Text>
        <Text style={styles.badge}>{t('common.comingSoon')}</Text>
      </View>

      <Link href="/(tabs)/creatures" asChild>
        <Pressable style={({ pressed }) => [styles.card, styles.cardActive, pressed && styles.pressed]}>
          <Text style={styles.cardTitle}>{t('home.modes.collection.title')}</Text>
          <Text style={styles.cardBody}>{t('home.modes.collection.description')}</Text>
          <Text style={[styles.badge, styles.badgeActive]}>{t('common.available')}</Text>
        </Pressable>
      </Link>

      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusLabel}>{t('home.status.label')}</Text>
          <Text
            style={[
              styles.statusValue,
              status === 'connected' && styles.statusOk,
              status === 'offline' && styles.statusBad,
              status === 'connecting' && styles.statusWarn,
            ]}
          >
            {t(`home.status.${status}`)}
          </Text>
        </View>
        {status === 'offline' ? (
          <Pressable onPress={() => void checkHealth()} style={styles.retry}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: {
    height: 48,
    marginBottom: spacing.xl,
    width: 220,
  },
  eyebrow: {
    color: colors.ember,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
  sectionEyebrow: {
    color: colors.electric,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardActive: {
    borderColor: colors.ember,
  },
  pressed: {
    opacity: 0.85,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  badge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  badgeActive: {
    color: colors.gold,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  statusOk: { color: colors.success },
  statusBad: { color: colors.danger },
  statusWarn: { color: colors.gold },
  retry: {
    borderColor: colors.ember,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.ember,
    fontWeight: '700',
  },
})
