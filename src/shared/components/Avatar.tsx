import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'

import { resolveApiUrl } from '@/src/shared/lib/api-client'
import { colors } from '@/src/theme/colors'

interface AvatarProps {
  name: string
  url?: string | null
  size?: number
}

export function Avatar({ name, url, size = 96 }: AvatarProps) {
  const uri = resolveApiUrl(url)
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <View style={[styles.frame, { borderRadius: size / 2, height: size, width: size }]}>
      {uri ? (
        <Image
          accessibilityLabel={name}
          contentFit="cover"
          source={{ uri }}
          style={styles.image}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size / 3 }]}>{initials || 'BA'}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.ember,
    borderWidth: 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  initials: {
    color: colors.ember,
    fontWeight: '800',
  },
})

