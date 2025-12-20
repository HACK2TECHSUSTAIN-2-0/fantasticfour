import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { HeaderBar } from '../components/HeaderBar';
import { AuthorityMember, Incident, User } from '../types';
import { colors } from '../theme';
import { Linking } from 'react-native';

interface AdminDashboardProps {
  adminId: string;
  adminName: string;
  onLogout: () => void;
  onAddMember: (role: 'admin' | 'health' | 'security', email: string, name: string, password: string) => void;
  onRemoveUser: (userId: string) => void;
  members: AuthorityMember[];
  users: User[];
  incidents: Incident[];
  onUpdatePriority: (id: string, sev: 'low' | 'medium' | 'critical') => void;
}

export function AdminDashboard({
  adminId,
  adminName,
  onLogout,
  onAddMember,
  onRemoveUser,
  members,
  users,
  incidents,
  onUpdatePriority,
}: AdminDashboardProps) {
  const now = new Date().toLocaleString();
  const normalizeSeverity = (sev?: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'critical';
    if (s === 'medium') return 'medium';
    return 'low';
  };
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalCount = activeIncidents.filter((i) => normalizeSeverity(i.final_severity) === 'critical').length;
  const mediumCount = activeIncidents.filter((i) => normalizeSeverity(i.final_severity) === 'medium').length;
  const lowCount = activeIncidents.filter((i) => normalizeSeverity(i.final_severity) === 'low').length;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'health' | 'security'>('health');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const stats = [
    { label: 'Total Users', value: users.length.toString(), color: '#2563eb' },
    { label: 'Active Incidents', value: activeIncidents.length.toString(), color: '#ef4444' },
    { label: 'Critical Severity', value: criticalCount.toString(), color: '#ef4444' },
    { label: 'Medium Severity', value: mediumCount.toString(), color: '#f59e0b' },
    { label: 'Low Severity', value: lowCount.toString(), color: '#16a34a' },
    { label: 'Health Staff', value: members.filter((m) => m.role === 'health').length.toString(), color: '#ec4899' },
    { label: 'Security Staff', value: members.filter((m) => m.role === 'security').length.toString(), color: '#f97316' },
  ];

  const handleAdd = () => {
    if (!newMemberEmail || !newMemberName || !newMemberPassword) return;
    onAddMember(newMemberRole, newMemberEmail.trim(), newMemberName.trim(), newMemberPassword);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('');
    setIsAddModalOpen(false);
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    onRemoveUser(userToDelete.id);
    setUserToDelete(null);
  };

  return (
    <View style={styles.screen}>
      <HeaderBar
        title="Admin Dashboard"
        subtitle="System Administration"
        gradient="bluePurple"
        rightContent={
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        }
        style={{ marginTop: 32, paddingVertical: 28 }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 36 }}
      >
        <View style={styles.profileRow}>
          <View>
            <Text style={styles.subtle}>Admin</Text>
            <Text style={styles.heading}>{adminName}</Text>
            <Text style={styles.subtle}>ID: {adminId}</Text>
            <Text style={styles.subtle}>Now: {now}</Text>
          </View>
          <Badge label="Live" tone="info" />
        </View>

        <View style={styles.statGrid}>
          {stats.map((stat) => (
            <Card key={stat.label} style={styles.statCard}>
              <Text style={styles.subtle}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ gap: 12, marginBottom: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Quick Actions</Text>
            <PrimaryButton label="Add Member" onPress={() => setIsAddModalOpen(true)} style={{ paddingVertical: 10, paddingHorizontal: 14 }} />
          </View>
          <View style={styles.actionRow}>
            {['Analytics', 'Manage Alerts', 'System Settings'].map((text) => (
              <View key={text} style={styles.actionTile}>
                <Text style={styles.actionText}>{text}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ gap: 12, marginBottom: 12 }}>
          <Text style={styles.title}>Active Users</Text>
          {users.length === 0 ? (
            <Text style={styles.subtle}>No active users</Text>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.listRow}>
                <View>
                  <Text style={styles.body}>{user.name}</Text>
                  <Text style={styles.subtle}>ID: {user.id}</Text>
                </View>
                <PrimaryButton
                  label="Remove"
                  variant="outline"
                  onPress={() => setUserToDelete(user)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14 }}
                />
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 12, marginBottom: 12 }}>
          <Text style={styles.title}>Team Members</Text>
          {members.length === 0 ? (
            <Text style={styles.subtle}>No team members added yet</Text>
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.listRow}>
                <View>
                  <Text style={styles.body}>{member.name}</Text>
                  <Text style={styles.subtle}>{member.email}</Text>
                </View>
                <Badge
                  label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  tone={member.role === 'admin' ? 'info' : member.role === 'health' ? 'danger' : 'warning'}
                />
              </View>
            ))
          )}
        </Card>

        <Card style={{ gap: 12, marginBottom: 12 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>Active Campus Incidents</Text>
            <Badge label={`${activeIncidents.length} live`} tone="danger" />
          </View>
          {activeIncidents.length === 0 ? (
            <Text style={styles.subtle}>All systems operational</Text>
          ) : (
            activeIncidents.map((incident) => (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.body}>{incident.type}</Text>
                    <Text style={styles.subtle}>
                      User: {incident.user_name ? `${incident.user_name}${incident.user_phone ? ` (${incident.user_phone})` : ''}` : incident.userId}
                    </Text>
                  </View>
                  <Badge label={incident.status.toUpperCase()} tone={incident.status === 'responding' ? 'info' : 'warning'} />
                </View>
                <View style={styles.incidentMsg}>
                  <Text style={styles.body}>{incident.message}</Text>
                  {incident.isVoice ? <Badge label="Voice" tone="info" style={{ marginTop: 6 }} /> : null}
                </View>
                {incident.officer_message ? (
                  <View style={styles.officerNote}>
                    <Text style={styles.subtle}>AI Guidance</Text>
                    <Text style={styles.body}>{incident.officer_message}</Text>
                    {incident.reasoning ? <Text style={styles.subtle}>{incident.reasoning}</Text> : null}
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
                <View style={[styles.actionRow, { marginTop: 8, flexWrap: 'wrap', gap: 8 }]}>
                  <PrimaryButton
                    label="Contact User"
                    variant="outline"
                    onPress={() => Linking.openURL(`tel:${incident.user_phone || ''}`)}
                    style={{ flexBasis: '48%', minHeight: 46 }}
                  />
                  <PrimaryButton
                    label="Open in Google Maps"
                    variant="outline"
                    onPress={() =>
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${incident.latitude || ''},${incident.longitude || ''}`)
                    }
                    style={{ flexBasis: '48%', minHeight: 46 }}
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Add New Team Member</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['admin', 'health', 'security'].map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setNewMemberRole(role as any)}
                  style={[
                    styles.roleChip,
                    newMemberRole === role ? styles.roleChipActive : styles.roleChipInactive,
                  ]}
                >
                  <Text style={newMemberRole === role ? styles.roleTextActive : styles.roleTextInactive}>
                    {role.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              value={newMemberName}
              onChangeText={setNewMemberName}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={newMemberPassword}
              onChangeText={setNewMemberPassword}
              secureTextEntry
              style={styles.input}
            />
            <PrimaryButton label="Add Member" onPress={handleAdd} disabled={!newMemberEmail || !newMemberName || !newMemberPassword} />
            <PrimaryButton label="Cancel" variant="ghost" onPress={() => setIsAddModalOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={!!userToDelete} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>Remove user?</Text>
            <Text style={styles.subtle}>
              This will remove {userToDelete?.name} (ID: {userToDelete?.id}) from the system.
            </Text>
            <PrimaryButton label="Remove" onPress={handleDelete} />
            <PrimaryButton label="Cancel" variant="ghost" onPress={() => setUserToDelete(null)} />
          </View>
        </View>
      </Modal>
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
    fontWeight: '700',
    color: colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionTile: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontWeight: '700',
    color: colors.text,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  incidentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  incidentMsg: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  officerNote: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  roleChip: {
    flex: 1,
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
