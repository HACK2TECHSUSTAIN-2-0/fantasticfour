import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors } from '../theme';

interface BadgeProps extends ViewProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ label, tone = 'default', style, ...props }: BadgeProps) {
  const palette = {
    default: { bg: '#eef2ff', text: colors.primary },
    success: { bg: '#dcfce7', text: colors.success },
    warning: { bg: '#fef3c7', text: colors.warning },
    danger: { bg: '#fee2e2', text: colors.danger },
    info: { bg: '#e0f2fe', text: '#0284c7' },
  }[tone];

  return (
    <View {...props} style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
