import { StyleSheet, Text, View } from 'react-native'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

interface StatBarProps {
  label: string
  value: number
  max?: number
}

export function StatBar({ label, value, max = 160 }: StatBarProps) {
  const width = Math.max(4, Math.min(100, Math.round((value / max) * 100)))

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
        <View style={[styles.fill, { width: `${width}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.ember,
    height: '100%',
  },
})
