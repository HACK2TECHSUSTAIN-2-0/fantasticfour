import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';

interface LoginScreenProps {
  onLogin: (
    type: 'user' | 'authority',
    email?: string,
    password?: string,
    name?: string,
    mode?: 'login' | 'register',
    phone?: string
  ) => void;
  loading?: boolean;
  apiBaseUrl: string;
}

export function LoginScreen({ onLogin, loading, apiBaseUrl }: LoginScreenProps) {
  const [selectedType, setSelectedType] = useState<'user' | 'authority' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userMode, setUserMode] = useState<'login' | 'register'>('login');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  const passwordsMatch = userMode === 'login' || password === confirmPassword;
  const canSubmit =
    !!selectedType &&
    !!email &&
    !!password &&
    (selectedType === 'user'
      ? passwordsMatch && (userMode === 'login' ? true : !!name && !!phone)
      : true);

  const handleSubmit = () => {
    if (!canSubmit || !selectedType) return;
    if (userMode === 'register' && password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    onLogin(
      selectedType,
      email.trim(),
      password,
      userMode === 'register' ? name.trim() : undefined,
      selectedType === 'user' ? userMode : 'login',
      selectedType === 'user' && userMode === 'register' ? phone.trim() : undefined
    );
  };

  return (
    <LinearGradient colors={gradients.purplePink} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrapper}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.logoBlock}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>CS</Text>
            </View>
            <Text style={styles.heading}>Campus Safety</Text>
            <Text style={styles.subHeading}>Emergency Response Platform</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Sign In</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.toggle,
                  selectedType === 'user' ? styles.toggleActiveUser : styles.toggleInactive,
                ]}
                onPress={() => setSelectedType('user')}
              >
                <Text style={[styles.toggleText, selectedType === 'user' ? styles.toggleTextActive : styles.toggleTextInactive]}>
                  User
                </Text>
                <Text style={styles.toggleCaption}>User Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.toggle,
                  selectedType === 'authority' ? styles.toggleActiveAuthority : styles.toggleInactive,
                ]}
                onPress={() => setSelectedType('authority')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedType === 'authority' ? styles.toggleTextAuthority : styles.toggleTextInactive,
                  ]}
                >
                  Authority
                </Text>
                <Text style={styles.toggleCaption}>Admin / Staff</Text>
              </TouchableOpacity>
            </View>

            {selectedType === 'authority' ? (
              <View style={styles.form}>
                <TextInput
                  placeholder="Work email"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            ) : null}

            {selectedType === 'user' ? (
              <View style={styles.form}>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeChip, userMode === 'login' ? styles.modeChipActive : null]}
                    onPress={() => setUserMode('login')}
                  >
                    <Text style={[styles.modeChipText, userMode === 'login' ? styles.modeChipTextActive : null]}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeChip, userMode === 'register' ? styles.modeChipActive : null]}
                    onPress={() => setUserMode('register')}
                  >
                    <Text style={[styles.modeChipText, userMode === 'register' ? styles.modeChipTextActive : null]}>Register</Text>
                  </TouchableOpacity>
                </View>
                {userMode === 'register' ? (
                  <TextInput
                    placeholder="Full name"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                  />
                ) : null}
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
                {userMode === 'register' ? (
                  <TextInput
                    placeholder="Mobile number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                  />
                ) : null}
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />
                {userMode === 'register' ? (
                  <TextInput
                    placeholder="Confirm password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.input}
                  />
                ) : null}
              </View>
            ) : null}

            <PrimaryButton label="Sign in" onPress={handleSubmit} disabled={!canSubmit} loading={loading} />

            <Text style={styles.apiText}>API: {apiBaseUrl}</Text>
          </View>

          <Text style={styles.footer}>Privacy-Preserving Emergency Response</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontWeight: '800',
    fontSize: 24,
    color: colors.secondary,
  },
  heading: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  subHeading: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.text,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  toggleInactive: {
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  toggleActiveUser: {
    borderColor: colors.secondary,
    backgroundColor: '#fff1f2',
  },
  toggleActiveAuthority: {
    borderColor: colors.primary,
    backgroundColor: '#eef2ff',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.secondary,
  },
  toggleTextAuthority: {
    color: colors.primary,
  },
  toggleTextInactive: {
    color: colors.muted,
  },
  toggleCaption: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
  },
  form: {
    gap: 10,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#eef2ff',
  },
  modeChipText: {
    fontWeight: '700',
    color: colors.text,
  },
  modeChipTextActive: {
    color: colors.primary,
  },
  input: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    color: '#1d4ed8',
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    color: '#2563eb',
    fontSize: 13,
  },
  apiText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 10,
    fontSize: 12,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 18,
  },
});
