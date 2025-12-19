import React, { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, gradients } from '../theme';

interface UserDashboardProps {
  userId: string;
  userName: string;
  onSendIncident: (type: string, message: string, isVoice: boolean) => void;
}

const emergencyTypes = [
  { id: 'medical', label: 'Medical', color: '#ef4444' },
  { id: 'security', label: 'Security', color: '#f97316' },
  { id: 'harassment', label: 'Harassment', color: '#a855f7' },
  { id: 'accident', label: 'Accident', color: '#f59e0b' },
];

export function UserDashboard({ userId, userName, onSendIncident }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'sos' | 'history' | 'profile'>('sos');
  const [incidentMessage, setIncidentMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSend = (type: string, msg?: string) => {
    const payload = msg ?? incidentMessage.trim();
    if (!payload && type === 'general') return;
    onSendIncident(type, payload || `SOS: ${type.toUpperCase()} ALERT`, false);
    if (!msg) setIncidentMessage('');
  };

  const handleVoice = (type: string) => {
    onSendIncident(type, 'Voice message recorded', true);
  };

  const startLongPress = (type: string) => {
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingType(type);
    }, 1200);
  };

  const endLongPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    if (isRecording && recordingType) {
      onSendIncident(recordingType, 'Voice emergency message recorded', true);
      setIsRecording(false);
      setRecordingType(null);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={gradients.purplePink} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Campus Safety</Text>
        <Text style={styles.headerSubtitle}>Stay Safe, Stay Connected</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {activeTab === 'sos' ? (
          <View style={{ gap: 14 }}>
            <Card>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.label}>Your Anonymous ID</Text>
                  <Text style={styles.mono}>{userId}</Text>
                </View>
                <Badge label="Protected" tone="success" />
              </View>
            </Card>

            <Card style={{ gap: 12 }}>
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
                  label="Voice Input"
                  variant="outline"
                  onPress={() => handleVoice('general')}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label="Send Alert"
                  onPress={() => triggerSend('general')}
                  disabled={!incidentMessage.trim()}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>

            <Card>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.title}>Quick SOS</Text>
                  <Text style={styles.caption}>Tap to send. Hold to record voice.</Text>
                </View>
              </View>
              <View style={styles.grid}>
                {emergencyTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    activeOpacity={0.9}
                    onPress={() => triggerSend(type.id)}
                    onPressIn={() => startLongPress(type.id)}
                    onPressOut={endLongPress}
                    style={[styles.sosButton, { backgroundColor: type.color }, recordingType === type.id && isRecording ? styles.sosButtonActive : null]}
                  >
                    <Text style={styles.sosLabel}>{type.label}</Text>
                    <Text style={styles.sosCaption}>{recordingType === type.id && isRecording ? 'Recording...' : 'Tap or hold'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {isRecording ? (
                <View style={styles.recordingBanner}>
                  <Text style={styles.recordingText}>Recording... release to send</Text>
                </View>
              ) : null}
            </Card>

            <Card>
              <Text style={styles.title}>Emergency Contacts</Text>
              <View style={{ gap: 10, marginTop: 8 }}>
                {[
                  { title: 'Campus Security', detail: '911' },
                  { title: 'Medical Services', detail: 'Emergency' },
                ].map((item) => (
                  <View key={item.title} style={styles.contactRow}>
                    <View>
                      <Text style={styles.contactTitle}>{item.title}</Text>
                      <Text style={styles.contactDetail}>{item.detail}</Text>
                    </View>
                    <PrimaryButton label="Call" variant="outline" style={{ paddingVertical: 10, paddingHorizontal: 16 }} />
                  </View>
                ))}
              </View>
            </Card>
          </View>
        ) : null}

        {activeTab === 'history' ? (
          <Card style={{ gap: 10 }}>
            <Text style={styles.title}>Alert History</Text>
            {[
              { title: 'Medical Emergency', status: 'Resolved', time: 'Dec 15, 2025 • 10:30 AM' },
              { title: 'Security Alert', status: 'Resolved', time: 'Dec 10, 2025 • 3:45 PM' },
            ].map((item) => (
              <View key={item.time} style={styles.historyRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Badge label={item.status} tone="success" />
                </View>
                <Text style={styles.historyTime}>{item.time}</Text>
              </View>
            ))}
          </Card>
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
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.navbar}>
        {[
          { id: 'sos', label: 'SOS' },
          { id: 'history', label: 'History' },
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: 16,
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
    minHeight: 110,
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
