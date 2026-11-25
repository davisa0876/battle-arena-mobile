import { Redirect } from 'expo-router'
import type { PropsWithChildren } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'

import { LoadingState } from '@/src/shared/components/LoadingState'
import { colors } from '@/src/theme/colors'

import { useAuth } from '../hooks/AuthContext'

function Splash() {
  return (
    <SafeAreaView style={styles.safe}>
      <LoadingState />
    </SafeAreaView>
  )
}

/** Renders children only for signed-in players; redirects guests to the login screen. */
export function RequireAuth({ children }: PropsWithChildren) {
  const { status } = useAuth()

  if (status === 'loading') {
    return <Splash />
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />
  }

  return <>{children}</>
}

/** Renders children only for guests; signed-in players go straight to their profile / onboarding. */
export function GuestOnly({ children }: PropsWithChildren) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <Splash />
  }

  if (status === 'authenticated') {
    return <Redirect href={user?.onboarding.starter_selected === false ? '/starter-selection' : '/'} />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
})
