import { Image } from 'expo-image'
import { useState } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTranslation } from 'react-i18next'

import { colors } from '@/src/theme/colors'
import { spacing } from '@/src/theme/spacing'

interface CreatureImageProps {
  name: string
  imageUrl?: string | null
  imageRef?: string | null
  style?: StyleProp<ViewStyle>
}

export function CreatureImage({ name, imageUrl, imageRef, style }: CreatureImageProps) {
  const { t } = useTranslation()
  const source = imageUrl || imageRef || null
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(source) && !failed
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View style={[styles.frame, style]} accessibilityLabel={t('creatures.image.fallback', { name })}>
      {showImage ? (
        <Image
          source={{ uri: source as string }}
          style={styles.image}
          contentFit="contain"
          transition={200}
          onError={() => setFailed(true)}
          accessibilityLabel={name}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.initials}>{initials || 'BA'}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  initials: {
    color: colors.ember,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
})
