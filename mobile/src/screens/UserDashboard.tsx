import React, { useRef, useState, useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, gradients } from '../theme';
import { uploadSpeechToEnglish } from '../api';

interface UserDashboardProps {
  userId: string;
  userName: string;
  onSendIncident: (type: string, message: string, isVoice: boolean, latitude?: number, longitude?: number) => void;
  onLogout?: () => void;
}

export function UserDashboard({ userId, userName, onSendIncident, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'sos' | 'profile'>('sos');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const backgroundListenCancelRef = useRef(false);
  const hotwordInProgressRef = useRef(false);

  const triggerSend = (type: string, msg?: string) => {
    const payload = msg ?? incidentMessage.trim();
    if (!payload && type === 'general') return;
    onSendIncident(type, payload || `SOS: ${type.toUpperCase()} ALERT`, false, coords.latitude, coords.longitude);
    if (!msg) setIncidentMessage('');
  };

  const securityNumber = process.env.EXPO_PUBLIC_SECURITY_CONTACT || '+917358424309';
  const medicalNumber = process.env.EXPO_PUBLIC_MEDICAL_CONTACT || '+917305946116';
  const hotwordMedical = (process.env.EXPO_PUBLIC_HOTWORD_MEDICAL || 'One chocolate please').toLowerCase();
  const hotwordSecurity = (process.env.EXPO_PUBLIC_HOTWORD_SECURITY || 'One butterscotch please').toLowerCase();

  const stopAndTranscribe = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      if (!uri) return;
      setIsUploading(true);
      const text = await uploadSpeechToEnglish(uri);
      if (text) setIncidentMessage(text);
    } catch {
      // ignore errors
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        alert('Microphone permission is required.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      setRecording(null);
    }
  };

  const handleVoiceButton = async () => {
    if (isRecording) {
      await stopAndTranscribe();
    } else {
      await startRecording();
    }
  };

  const handleSos = () => {
    const payload = incidentMessage.trim();
    if (!payload) {
      onSendIncident('general', 'HIGH PRIORITY SOS', false, coords.latitude, coords.longitude);
    } else {
      onSendIncident('general', payload, false, coords.latitude, coords.longitude);
      setIncidentMessage('');
    }
  };

  // Grab location once
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        // ignore if unavailable
      }
    })();
  }, []);

  const normalizeHotword = (s: string) =>
    s
      .toLowerCase()
      .replace(/\\b2\\b/g, 'two')
      .replace(/\\b1\\b/g, 'one')
      .replace(/[^a-z0-9\\s]/g, '')
      .trim();

  const matchesHotword = (heard: string, target: string) => {
    const h = normalizeHotword(heard);
    const t = normalizeHotword(target);
    if (!h || !t) return false;
    if (h.includes(t) || t.includes(h)) return true;
    const hWords = new Set(h.split(/\s+/).filter(Boolean));
    const tWords = new Set(t.split(/\s+/).filter(Boolean));
    const intersection = [...hWords].filter((w) => tWords.has(w)).length;
    const score = intersection / Math.max(tWords.size, 1);
    return score >= 0.3; // allow partial overlap (subset) and noise
  };

  // Background hotword listener (best-effort while app is active)
  useEffect(() => {
    backgroundListenCancelRef.current = false;
    const listenLoop = async () => {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        console.warn('Microphone permission not granted; hotword listening disabled.');
        return;
      }
      while (!backgroundListenCancelRef.current) {
        if (isRecording || hotwordInProgressRef.current) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        hotwordInProgressRef.current = true;
        let rec: Audio.Recording | null = null;
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
          const { recording: recObj } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          rec = recObj;
          await new Promise((r) => setTimeout(r, 4000));
          await rec.stopAndUnloadAsync();
          const uri = rec.getURI();
          if (uri) {
            const text = (await uploadSpeechToEnglish(uri)).toLowerCase().trim();
            console.log('[HOTWORD] heard:', text);
            if (matchesHotword(text, hotwordMedical)) {
              onSendIncident('medical', 'Medical emergency (hotword)', true, coords.latitude, coords.longitude);
            } else if (matchesHotword(text, hotwordSecurity)) {
              onSendIncident('security', 'Security emergency (hotword)', true, coords.latitude, coords.longitude);
            }
          }
        } catch {
          // ignore errors to keep loop alive
        } finally {
          if (rec) {
            try { await rec.stopAndUnloadAsync(); } catch {}
          }
          hotwordInProgressRef.current = false;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    };
    listenLoop();
    return () => {
      backgroundListenCancelRef.current = true;
    };
  }, [coords.latitude, coords.longitude, hotwordMedical, hotwordSecurity, onSendIncident, isRecording]);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={gradients.purplePink as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={{ paddingTop: 24, paddingBottom: 12 }}>
          <Text style={styles.headerTitle}>Welcome, {userName}</Text>
          <Text style={styles.headerSubtitle}>Stay Safe, Stay Connected</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 32 }}
      >
        {activeTab === 'sos' ? (
          <View style={{ gap: 18 }}>
            <Card style={{ gap: 12, marginBottom: 12 }}>
              <Text style={styles.title}>Describe Your Emergency</Text>
              <TextInput
                multiline
                value={incidentMessage}
                onChangeText={setIncidentMessage}
                placeholder="Type details here..."
                placeholderTextColor="#94a3b8"
                style={styles.textArea}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PrimaryButton
                  label={isRecording ? 'Tap to stop' : 'Voice Input'}
                  variant="outline"
                  onPress={handleVoiceButton}
                  style={{ flex: 1 }}
                />
              </View>
              <View style={styles.quickGrid}>
                {[
                  { label: 'Medical', type: 'medical', color: '#fee2e2' },
                  { label: 'Security', type: 'security', color: '#dbeafe' },
                  { label: 'Harassment', type: 'harassment', color: '#ffedd5' },
                  { label: 'Accident', type: 'accident', color: '#ede9fe' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    activeOpacity={0.9}
                    style={[styles.quickCard, { backgroundColor: item.color }]}
                    onPress={() => triggerSend(item.type)}
                  >
                    <Text style={styles.quickLabel}>{item.label}</Text>
                    <Text style={styles.quickCaption}>Tap to send</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {isRecording ? (
                <View style={styles.recordingBanner}>
                  <Text style={styles.recordingText}>Listening...</Text>
                </View>
              ) : null}
              {isUploading ? (
                <View style={styles.recordingBanner}>
                  <Text style={styles.recordingText}>Processing...</Text>
                </View>
              ) : null}
            </Card>

            <TouchableOpacity style={styles.sosCircle} activeOpacity={0.9} onPress={handleSos}>
              <Text style={styles.sosCircleText}>SOS</Text>
              <Text style={styles.sosCircleSub}>Tap to send</Text>
            </TouchableOpacity>

            <Card style={{ marginBottom: 12 }}>
              <Text style={styles.title}>Emergency Contacts</Text>
              <View style={{ gap: 10, marginTop: 8 }}>
                {[
                  { title: 'Campus Security', detail: securityNumber },
                  { title: 'Medical Services', detail: medicalNumber },
                ].map((item) => (
                  <View key={item.title} style={styles.contactRow}>
                    <View>
                      <Text style={styles.contactTitle}>{item.title}</Text>
                      <Text style={styles.contactDetail}>{item.detail}</Text>
                    </View>
                    <PrimaryButton
                      label="Call"
                      variant="outline"
                      style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                      onPress={() => Linking.openURL(`tel:${item.detail}`)}
                    />
                  </View>
                ))}
              </View>
            </Card>
          </View>
        ) : null}

        {activeTab === 'profile' ? (
          <View style={{ gap: 14 }}>
            <Card style={{ alignItems: 'center', gap: 12 }}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.title}>{userName}</Text>
              <Text style={styles.mono}>{userId}</Text>
            </Card>
            <Card style={{ gap: 10 }}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Account Type</Text>
                <Text style={styles.body}>Anonymous User</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Privacy Status</Text>
                <Badge label="Protected" tone="success" />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Session</Text>
                <Text style={styles.body}>Stays active until removed by admin</Text>
              </View>
              {onLogout ? (
                <PrimaryButton
                  label="Logout"
                  onPress={onLogout}
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.navbar, { bottom: 24 }]}>
        {[
          { id: 'sos', label: 'SOS' },
          { id: 'profile', label: 'Profile' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={styles.navItem}
          >
            <Text style={[styles.navText, activeTab === tab.id ? styles.navTextActive : styles.navTextInactive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.navSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navSpacer: {
    height: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 22,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.muted,
    fontSize: 13,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    color: colors.muted,
    marginTop: 2,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    color: colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  sosButton: {
    flexBasis: '48%',
    padding: 16,
    borderRadius: 16,
  },
  sosButtonActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  sosLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  sosCaption: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  sosCircle: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sosCircleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 28,
  },
  sosCircleSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  recordingBanner: {
    marginTop: 12,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 12,
  },
  recordingText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    flexBasis: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: {
    fontWeight: '700',
    color: colors.text,
  },
  quickCaption: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  contactTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  contactDetail: {
    color: colors.muted,
    marginTop: 2,
  },
  historyRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  historyTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  historyTime: {
    color: colors.muted,
    marginTop: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    color: colors.text,
    fontWeight: '600',
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navTextActive: {
    color: colors.secondary,
  },
  navTextInactive: {
    color: colors.muted,
  },
});
