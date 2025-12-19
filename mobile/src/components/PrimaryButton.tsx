import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors } from '../theme';

interface PrimaryButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
}

export function PrimaryButton({ label, loading, disabled, variant = 'solid', style, ...props }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const palette = {
    solid: {
      backgroundColor: isDisabled ? '#c7d2fe' : colors.primary,
      color: '#fff',
      borderColor: colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text,
      borderColor: 'transparent',
    },
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.8 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={palette.color} />
      ) : (
        <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    fontSize: 15,
  },
});
