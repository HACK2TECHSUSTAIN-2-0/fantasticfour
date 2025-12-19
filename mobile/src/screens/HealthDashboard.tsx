import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { HeaderBar } from '../components/HeaderBar';
import { Incident } from '../types';
import { colors } from '../theme';

interface HealthDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
  incidents: Incident[];
  onUpdateStatus: (id: string, status: 'responding' | 'resolved') => void;
}

export function HealthDashboard({ staffId, staffName, onLogout, incidents, onUpdateStatus }: HealthDashboardProps) {
  const now = new Date().toLocaleString();
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
  const highCount = incidents.filter((i) => (i.final_severity || '').toLowerCase() === 'high').length;
  const mediumCount = incidents.filter((i) => (i.final_severity || '').toLowerCase() === 'medium').length;
  const lowCount = incidents.filter((i) => (i.final_severity || '').toLowerCase() === 'low').length;

  const severityTone = (sev?: string) => {
    if (!sev) return 'info';
    if (sev.toLowerCase() === 'high' || sev.toLowerCase() === 'critical') return 'danger';
    if (sev.toLowerCase() === 'medium') return 'warning';
    return 'info';
  };

  return (
    <View style={styles.screen}>
      <HeaderBar
        title="Health Services Dashboard"
        subtitle={`Medical Emergency Response • ${now}`}
        gradient="redPink"
        rightContent={
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileRow}>
          <View>
            <Text style={styles.subtle}>Health Staff</Text>
            <Text style={styles.heading}>{staffName}</Text>
            <Text style={styles.subtle}>ID: {staffId}</Text>
          </View>
          <Badge label={`${activeIncidents.length} Active`} tone="danger" />
        </View>

        <View style={styles.statGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Active Cases</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{activeIncidents.length}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Critical</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{highCount}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Medium</Text>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{mediumCount}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Low</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{lowCount}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Responding</Text>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>{incidents.filter((i) => i.status === 'responding').length}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Resolved</Text>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{resolvedIncidents.length}</Text>
          </Card>
        </View>

        <Card style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Active Incidents</Text>
            <Badge label={`${activeIncidents.length}`} tone="danger" />
          </View>
          {activeIncidents.length === 0 ? (
            <Text style={styles.subtle}>No active incidents.</Text>
          ) : (
            activeIncidents.map((incident) => (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.body}>{incident.type}</Text>
                      <Badge label={incident.status} tone={incident.status === 'responding' ? 'info' : 'warning'} />
                    </View>
                    <Text style={styles.subtle}>
                      User: {incident.user_name ? `${incident.user_name}${incident.user_phone ? ` (${incident.user_phone})` : ''}` : incident.userId}
                    </Text>
                  </View>
                  {incident.final_severity ? <Badge label={incident.final_severity} tone={severityTone(incident.final_severity)} /> : null}
                </View>
                <View style={styles.messageBox}>
                  <Text style={styles.body}>{incident.message}</Text>
                  {incident.isVoice ? <Badge label="Voice message" tone="info" style={{ marginTop: 6 }} /> : null}
                  {incident.officer_message ? (
                    <View style={styles.officerNote}>
                      <Text style={styles.subtle}>AI Guidance</Text>
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

        <Card style={{ gap: 10 }}>
          <Text style={styles.title}>Triage Center</Text>
          <View style={styles.triageRow}>
            <Badge label="Critical" tone="danger" />
            <Text style={styles.triageText}>Life-threatening: cardiac arrest, severe bleeding, trauma</Text>
          </View>
          <View style={styles.triageRow}>
            <Badge label="High" tone="warning" />
            <Text style={styles.triageText}>Serious injuries, allergic reactions, respiratory distress</Text>
          </View>
          <View style={styles.triageRow}>
            <Badge label="Medium" tone="info" />
            <Text style={styles.triageText}>Moderate pain, minor injuries</Text>
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={styles.title}>Resources</Text>
          {[
            { label: 'Ambulances Available', status: '3/3', tone: 'success' as const },
            { label: 'AED Units', status: '12/12', tone: 'success' as const },
            { label: 'First Aid Kits', status: '15/18', tone: 'warning' as const },
            { label: 'Medical Staff On Duty', status: '8/8', tone: 'success' as const },
          ].map((item) => (
            <View key={item.label} style={styles.resourceRow}>
              <Text style={styles.body}>{item.label}</Text>
              <Badge label={item.status} tone={item.tone} />
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
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
  },
  officerNote: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
  },
  triageRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  triageText: {
    color: colors.text,
    flex: 1,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
