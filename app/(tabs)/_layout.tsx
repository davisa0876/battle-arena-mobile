import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/src/features/auth'
import { colors } from '@/src/theme/colors'

export default function TabLayout() {
  const { t } = useTranslation()
  const { status } = useAuth()
  // Hide both auth-specific groups until the stored session has been restored.
  const signedIn = status === 'authenticated'
  const guest = status === 'unauthenticated'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ember,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: signedIn ? undefined : null,
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="creatures"
        options={{
          href: signedIn ? undefined : null,
          title: t('navigation.creatures'),
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-collection"
        options={{
          href: signedIn ? undefined : null,
          title: t('navigation.collection'),
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="game-rules"
        options={{
          // Public: visible to guests and signed-in trainers alike.
          href: undefined,
          title: t('navigation.gameRules'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: signedIn ? undefined : null,
          title: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: guest ? undefined : null,
          title: t('navigation.login'),
          tabBarIcon: ({ color, size }) => <Ionicons name="log-in-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: guest ? undefined : null,
          title: t('navigation.register'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-add-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
