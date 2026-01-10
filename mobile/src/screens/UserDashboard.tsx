import React, { useRef, useState, useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, gradients } from '../theme';
import { uploadSpeechToEnglish, uploadIncidentEvidence, getUserDetails, updateUserHotwords } from '../api';

interface UserDashboardProps {
  userId: string;
  userName: string;
  onSendIncident: (type: string, message: string, isVoice: boolean, latitude?: number, longitude?: number) => Promise<string | void>;
  onLogout?: () => void;
}

export function UserDashboard({ userId, userName, onSendIncident, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'sos' | 'profile'>('sos');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [hotwords, setHotwords] = useState<Record<string, string>>({});
  const [newHotword, setNewHotword] = useState('');
  const [newHotwordType, setNewHotwordType] = useState('security');
  const backgroundListenCancelRef = useRef(false);
  const hotwordInProgressRef = useRef(false);
  const hotwordRecordingRef = useRef<Audio.Recording | null>(null); // NEW: Track hotword recording specifically
  const blackBoxRef = useRef(false);

  // ... (hotword constants and matchesHotword function remain the same) ...
  const securityNumber = process.env.EXPO_PUBLIC_SECURITY_CONTACT || '+917358424309';
  const medicalNumber = process.env.EXPO_PUBLIC_MEDICAL_CONTACT || '+917305946116';
  const hotwordMedical = (process.env.EXPO_PUBLIC_HOTWORD_MEDICAL || 'One chocolate please').toLowerCase();
  const hotwordSecurity = (process.env.EXPO_PUBLIC_HOTWORD_SECURITY || 'One butterscotch please').toLowerCase();

  const normalizeHotword = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b2\b/g, 'two')
      .replace(/\b1\b/g, 'one')
      .replace(/[^a-z0-9\s]/g, '')
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

  // Refactor Black Box Logic
  const startBlackBoxRecording = async (incidentId: string) => {
    console.log('Starting Black Box Evidence Recording...');
    backgroundListenCancelRef.current = true; // Signal hotword loop to stop
    blackBoxRef.current = true;

    try {
      // 1. Force unload ANY existing recording (Voice Input or Hotword)

      // A. Stop Voice Input Recording (State-based)
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {
          console.log('Cleanup voice recording warning:', e);
        }
        setRecording(null);
        setIsRecording(false);
      }

      // B. Stop Hotword Recording (Ref-based)
      if (hotwordRecordingRef.current) {
        try {
          await hotwordRecordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('Cleanup hotword recording warning:', e);
        }
        hotwordRecordingRef.current = null;
      }

      // 2. Extra safety wait for Audio system to fully release resources
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Configure for background recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 4. Create new recording
      const { recording: bbRec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      // 5. Schedule stop
      setTimeout(async () => {
        console.log('Stopping Black Box Recording...');
        try {
          await bbRec.stopAndUnloadAsync();
          const uri = bbRec.getURI();
          if (uri) {
            console.log('Uploading Evidence...', uri);
            await uploadIncidentEvidence(incidentId, uri);
            console.log('Evidence Uploaded.');
          }
        } catch (e) {
          console.error('Evidence upload failed', e);
        } finally {
          blackBoxRef.current = false;
          // Optionally restart hotword listener here by setting backgroundListenCancelRef.current = false
          // But user might want to stay 'quiet' after an incident.
        }
      }, 30000);

    } catch (e) {
      console.error('Failed to start Black Box', e);
      blackBoxRef.current = false;
    }
  };

  const triggerSend = async (type: string, msg?: string) => {
    const payload = msg ?? incidentMessage.trim();
    if (!payload && type === 'general') return;
    const incidentId = await onSendIncident(type, payload || `SOS: ${type.toUpperCase()} ALERT`, false, coords.latitude, coords.longitude);
    if (!msg) setIncidentMessage('');

    // Only start recording if not already in stealth mode
    if (incidentId && !blackBoxRef.current) {
      startBlackBoxRecording(incidentId as string);
    }
  };

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

  const handleSos = async () => {
    const payload = incidentMessage.trim();
    await triggerSend('general', payload || 'HIGH PRIORITY SOS');
  };

  // Fall Detection (requires expo-sensors)
  // We lazily import or assume it's available. If not, this might crash if we don't handle it.
  // But strictly we should use 'expo-sensors' import.

  useEffect(() => {
    let subscription: any;
    // Dynamic import to avoid crash if not installed, though we expect it installed
    import('expo-sensors').then(({ Accelerometer }) => {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener((data: any) => {
        const totalForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
        // 1g is resting. > 3g is a hard fall/crash.
        if (totalForce > 3.0) {
          if (!blackBoxRef.current) {
            triggerSend('accident', 'Automated Fall/Crash Detection');
            alert('High impact detected! Emergency alert sent.');
          }
        }
      });
    }).catch(() => console.log("Sensors not available"));

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    getUserDetails(userId).then(u => {
      if (u.hotwords) {
        try {
          setHotwords(JSON.parse(u.hotwords));
        } catch { }
      }
    });
  }, []);

  const handleUpdate = async (newHw: Record<string, string>) => {
    setHotwords(newHw);
    try {
      await updateUserHotwords(userId, JSON.stringify(newHw));
    } catch {
      alert('Failed to save hotwords');
    }
  };

  const addHotword = () => {
    if (!newHotword.trim()) return;
    const updated = { ...hotwords, [newHotword.trim()]: newHotwordType };
    setNewHotword('');
    handleUpdate(updated);
  };

  const removeHotword = (hw: string) => {
    const updated = { ...hotwords };
    delete updated[hw];
    handleUpdate(updated);
  };

  // Background hotword
  useEffect(() => {
    backgroundListenCancelRef.current = false;
    const listenLoop = async () => {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        return;
      }
      while (!backgroundListenCancelRef.current) {
        if (isRecording || hotwordInProgressRef.current || blackBoxRef.current) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        hotwordInProgressRef.current = true;
        let rec: Audio.Recording | null = null;
        try {
          // If blackbox started during loop
          if (backgroundListenCancelRef.current) break;

          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
          const { recording: recObj } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          rec = recObj;
          hotwordRecordingRef.current = recObj; // TRACK RECORDING

          await new Promise((r) => setTimeout(r, 4000));

          // Check if blackbox interrupted us
          if (backgroundListenCancelRef.current) {
            // startBlackBoxRecording likely killed it, but let's be safe
            if (hotwordRecordingRef.current) {
              try { await rec.stopAndUnloadAsync(); } catch { }
              hotwordRecordingRef.current = null;
            }
            break;
          }

          await rec.stopAndUnloadAsync();
          hotwordRecordingRef.current = null; // Clear ref after normal stop

          const uri = rec.getURI();
          if (uri) {
            const text = (await uploadSpeechToEnglish(uri)).toLowerCase().trim();
            console.log('[HOTWORD] heard:', text);
            if (matchesHotword(text, hotwordMedical)) {
              triggerSend('medical', 'Medical emergency (hotword)');
            } else if (matchesHotword(text, hotwordSecurity)) {
              triggerSend('security', 'Security emergency (hotword)');
            }
          }
        } catch {
          // ignore
        } finally {
          if (rec && rec._canRecord) { // Basic check if still active
            try { await rec.stopAndUnloadAsync(); } catch { }
          }
          if (hotwordRecordingRef.current === rec) {
            hotwordRecordingRef.current = null;
          }
          hotwordInProgressRef.current = false;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    };
    listenLoop();
    return () => {
      backgroundListenCancelRef.current = true;
      // Cleanup on unmount
      if (hotwordRecordingRef.current) {
        hotwordRecordingRef.current.stopAndUnloadAsync().catch(() => { });
      }
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
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: colors.primary,
    backgroundColor: '#eef2ff',
  },
  roleChipInactive: {
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  roleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  roleTextInactive: {
    color: colors.muted,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
  },
});
