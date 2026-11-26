import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { I18nextProvider } from 'react-i18next'
import 'react-native-reanimated'

import { AuthProvider } from '@/src/features/auth'
import i18n from '@/src/i18n'
import { colors } from '@/src/theme/colors'

export const unstable_settings = {
  anchor: '(tabs)',
}

const arenaTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.ember,
    text: colors.text,
  },
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ThemeProvider value={arenaTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="creatures/[slug]" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="starter-selection" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="players/[handle]" />
            <Stack.Screen name="pve" />
            <Stack.Screen name="pvp" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </I18nextProvider>
  )
}
