import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { HeaderBar } from '../components/HeaderBar';
import { Incident } from '../types';
import { colors } from '../theme';

interface SecurityDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
  incidents: Incident[];
  onUpdateStatus: (id: string, status: 'responding' | 'resolved') => void;
}

const patrols = [
  { id: 'P1', officer: 'Officer Johnson', zone: 'North Campus', status: 'active' },
  { id: 'P2', officer: 'Officer Smith', zone: 'South Campus', status: 'active' },
  { id: 'P3', officer: 'Officer Davis', zone: 'Central Campus', status: 'break' },
  { id: 'P4', officer: 'Officer Wilson', zone: 'East Campus', status: 'active' },
];

export function SecurityDashboard({ staffId, staffName, onLogout, incidents, onUpdateStatus }: SecurityDashboardProps) {
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');

  return (
    <View style={styles.screen}>
      <HeaderBar
        title="Security Operations Center"
        subtitle="Campus Security & Safety"
        gradient="orangePink"
        rightContent={
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileRow}>
          <View>
            <Text style={styles.subtle}>Security Staff</Text>
            <Text style={styles.heading}>{staffName}</Text>
            <Text style={styles.subtle}>ID: {staffId}</Text>
          </View>
          <Badge label={`${activeIncidents.length} Active`} tone="danger" />
        </View>

        <View style={styles.statGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Active Threats</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{activeIncidents.length}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Active Patrols</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{patrols.filter((p) => p.status === 'active').length}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>High Severity</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{incidents.filter((i) => i.final_severity === 'HIGH').length}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Resolved</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{incidents.filter((i) => i.status === 'resolved').length}</Text>
          </Card>
        </View>

        <Card style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Active Incidents</Text>
            <Badge label={`${activeIncidents.length}`} tone="danger" />
          </View>
          {activeIncidents.length === 0 ? (
            <Text style={styles.subtle}>No active security incidents.</Text>
          ) : (
            activeIncidents.map((incident) => (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.body}>{incident.type}</Text>
                    <Text style={styles.subtle}>User: {incident.userId}</Text>
                  </View>
                  <Badge label={incident.status.toUpperCase()} tone={incident.status === 'responding' ? 'info' : 'warning'} />
                </View>
                <View style={styles.messageBox}>
                  <Text style={styles.body}>{incident.message}</Text>
                  {incident.isVoice ? <Badge label="Voice message" tone="info" style={{ marginTop: 6 }} /> : null}
                  {incident.officer_message ? (
                    <View style={styles.officerNote}>
                      <Text style={styles.subtle}>AI Officer Guidance</Text>
                      <Text style={styles.body}>{incident.officer_message}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.rowBetween}>
                  {incident.status === 'pending' ? (
                    <PrimaryButton label="Respond" onPress={() => onUpdateStatus(incident.id, 'responding')} style={{ flex: 1, marginRight: 8 }} />
                  ) : null}
                  <PrimaryButton label="Resolve" onPress={() => onUpdateStatus(incident.id, 'resolved')} style={{ flex: 1 }} />
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={styles.title}>Active Patrol Units</Text>
          <View style={{ gap: 10 }}>
            {patrols.map((patrol) => (
              <View key={patrol.id} style={styles.patrolRow}>
                <View>
                  <Text style={styles.body}>{patrol.officer}</Text>
                  <Text style={styles.subtle}>{patrol.zone}</Text>
                </View>
                <Badge label={patrol.status} tone={patrol.status === 'active' ? 'success' : 'info'} />
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={styles.title}>Response Protocols</Text>
          {[
            { title: 'Critical - Immediate Action', desc: 'Active threats, violence, weapons on campus.' },
            { title: 'High - Priority Response', desc: 'Harassment, suspicious activity, unauthorized access.' },
            { title: 'Medium - Standard Response', desc: 'Property damage, minor disturbances.' },
          ].map((item) => (
            <View key={item.title} style={styles.protocolRow}>
              <Text style={styles.body}>{item.title}</Text>
              <Text style={styles.subtle}>{item.desc}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtle: {
    color: colors.muted,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexBasis: '48%',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  body: {
    color: colors.text,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  incidentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  messageBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 10,
  },
  officerNote: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
  },
  patrolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  protocolRow: {
    paddingVertical: 6,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
});
