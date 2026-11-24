import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

interface ActionButtonProps extends PropsWithChildren {
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function ActionButton({
  children,
  disabled = false,
  onPress,
  variant = 'primary',
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.ember,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
  },
  secondaryText: {
    color: colors.text,
  },
  text: {
    color: colors.background,
    fontFamily: typography.heading,
    fontSize: 14,
    fontWeight: '800',
  },
});
