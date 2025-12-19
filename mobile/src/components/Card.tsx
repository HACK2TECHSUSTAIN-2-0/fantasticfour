import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, shadows } from '../theme';

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
});
