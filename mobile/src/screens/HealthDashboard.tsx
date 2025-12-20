import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
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
  onUpdatePriority: (id: string, sev: 'low' | 'medium' | 'critical') => void;
}

export function HealthDashboard({ staffId, staffName, onLogout, incidents, onUpdateStatus, onUpdatePriority }: HealthDashboardProps) {
  const now = new Date().toLocaleString();
  const normalizeSeverity = (sev?: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'critical';
    if (s === 'medium') return 'medium';
    return 'low';
  };
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
  const criticalCount = activeIncidents.filter((i) => normalizeSeverity(i.final_severity) === 'critical').length;
  const mediumCount = activeIncidents.filter((i) => normalizeSeverity(i.final_severity) === 'medium').length;
  const lowCount = activeIncidents.filter((i) => normalizeSeverity(i.final_severity) === 'low').length;

  const severityTone = (sev?: string) => {
    const normalized = normalizeSeverity(sev);
    if (!normalized) return 'info';
    if (normalized === 'critical') return 'danger';
    if (normalized === 'medium') return 'warning';
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
        style={{ marginTop: 32, paddingVertical: 28 }}
      />
      <View style={styles.headerSpacer} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 0, rowGap: 12 }}
      >
        <View style={[styles.profileRow, { marginBottom: 16 }]}>
          <View>
            <Text style={styles.subtle}>Health Staff</Text>
            <Text style={styles.heading}>{staffName}</Text>
            <Text style={styles.subtle}>ID: {staffId}</Text>
          </View>
          <Badge label={`${activeIncidents.length} Active`} tone="danger" />
        </View>

        <View style={[styles.statGrid, { marginBottom: 16 }]}>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Active Cases</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{activeIncidents.length}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.subtle}>Critical</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{criticalCount}</Text>
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

        <Card style={{ gap: 14 }}>
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
                  {incident.final_severity ? (
                    <Badge
                      label={normalizeSeverity(incident.final_severity).toUpperCase()}
                      tone={severityTone(incident.final_severity)}
                    />
                  ) : null}
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
                 <View style={styles.priorityRow}>
                 <Text style={styles.subtle}>Priority</Text>
                 <View style={styles.priorityButtons}>
                    {['critical', 'medium', 'low'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.priorityChip,
                          normalizeSeverity(incident.final_severity) === level ? styles.priorityChipActive : null,
                        ]}
                          onPress={() => onUpdatePriority(incident.id, level as 'critical' | 'medium' | 'low')}
                        >
                          <Text
                            style={[
                              styles.priorityChipText,
                              normalizeSeverity(incident.final_severity) === level ? styles.priorityChipTextActive : null,
                            ]}
                          >
                            {level.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                   </View>
                 </View>
                  {incident.latitude && incident.longitude ? (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      <Text style={styles.subtle}>Lat/Lng: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</Text>
                      <PrimaryButton
                        label="Street View"
                        variant="outline"
                        onPress={() =>
                          Linking.openURL(`https://www.google.com/maps?q=&layer=c&cbll=${incident.latitude},${incident.longitude}`)
                        }
                      />
                    </View>
                  ) : (
                    <View style={{ marginTop: 10 }}>
                      <PrimaryButton label="Location unavailable" variant="outline" disabled />
                    </View>
                  )}
                </View>
                <View style={styles.actionRow}>
                  {incident.status === 'pending' ? (
                    <PrimaryButton
                      label="Respond"
                      onPress={() => onUpdateStatus(incident.id, 'responding')}
                      style={styles.actionBtn}
                    />
                  ) : null}
                  <PrimaryButton
                    label="Resolve"
                    onPress={() => onUpdateStatus(incident.id, 'resolved')}
                    style={styles.actionBtn}
                  />
                  <PrimaryButton
                    label="Contact User"
                    variant="outline"
                    onPress={() => Linking.openURL(`tel:${incident.user_phone || ''}`)}
                    style={styles.actionBtn}
                  />
                  <PrimaryButton
                    label="Open in Google Maps"
                    variant="outline"
                    onPress={() =>
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${incident.latitude || ''},${incident.longitude || ''}`)
                    }
                    style={styles.actionBtn}
                  />
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
            <Badge label="Medium" tone="warning" />
            <Text style={styles.triageText}>Serious injuries, allergic reactions, respiratory distress</Text>
          </View>
          <View style={styles.triageRow}>
            <Badge label="Low" tone="info" />
            <Text style={styles.triageText}>Moderate pain, minor injuries</Text>
          </View>
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
    padding: 20,
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
    gap: 12,
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flexBasis: '48%',
    minHeight: 46,
  },
  incidentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
  priorityRow: {
    marginTop: 8,
    gap: 6,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  priorityChipActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#7c3aed',
  },
  priorityChipText: {
    fontWeight: '700',
    color: colors.text,
  },
  priorityChipTextActive: {
    color: '#7c3aed',
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
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerSpacer: {
    height: 32,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
});
