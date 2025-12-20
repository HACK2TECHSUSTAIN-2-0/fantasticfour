import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, gradients } from '../theme';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  gradient?: keyof typeof gradients;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
}

export function HeaderBar({ title, subtitle, gradient = 'purplePink', rightContent, style }: HeaderBarProps) {
  return (
    <LinearGradient
      colors={gradients[gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightContent}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
});
