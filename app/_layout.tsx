import { DarkTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { I18nextProvider } from 'react-i18next'
import 'react-native-reanimated'

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
      <ThemeProvider value={arenaTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="creatures/[slug]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </I18nextProvider>
  )
}
