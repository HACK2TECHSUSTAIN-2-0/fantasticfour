import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StatusBar, View } from 'react-native';
import {
  addAuthorityMember,
  createIncident,
  deleteUser,
  fetchAuthorityMembers,
  fetchIncidents,
  fetchUsers,
  getApiBaseUrl,
  loginAuthority,
  updateIncidentStatus,
  loginUser,
  registerUser,
  updateIncidentPriority,
  markFalseAlarm,
  updateIncidentLocation,
  updateIncidentAuthority,
} from './src/api';
import * as Location from 'expo-location';
import { LoginScreen } from './src/screens/LoginScreen';
import { UserDashboard } from './src/screens/UserDashboard';
import { AdminDashboard } from './src/screens/AdminDashboard';
import { HealthDashboard } from './src/screens/HealthDashboard';
import { SecurityDashboard } from './src/screens/SecurityDashboard';
import { AppState, AuthorityMember, Incident, User } from './src/types';
import { clearSession, loadSession, saveSession, saveOfflineIncident, getOfflineIncidents, removeOfflineIncident } from './src/utils/storage';
import { runOfflineEdgeTriage } from './src/ai/OfflineTriage';
import { colors } from './src/theme';

export default function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'login' });
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<AuthorityMember[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    loadSession().then((session) => {
      if (session) setAppState(session);
      setInitializing(false);
    });
  }, []);

  // Persist session
  useEffect(() => {
    if (appState.screen === 'login') {
      clearSession();
    } else {
      saveSession(appState);
    }
  }, [appState]);

  // Location tracking effect
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    if (activeIncidentId) {
      const startTracking = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (loc) => {
            updateIncidentLocation(activeIncidentId, loc.coords.latitude, loc.coords.longitude)
              .catch(err => console.log("Loc update failed", err));
          }
        );
      };
      startTracking();
    }

    return () => {
      if (sub) sub.remove();
    };
  }, [activeIncidentId]);

  // Stop tracking if resolved
  useEffect(() => {
    if (activeIncidentId) {
      const inc = incidents.find(i => i.id === activeIncidentId);
      if (inc && inc.status === 'resolved') {
        setActiveIncidentId(null);
        Alert.alert("Incident Resolved", "Tracking stopped.");
      }
    }
  }, [incidents, activeIncidentId]);

  const refreshData = useCallback(async () => {
    try {
      const [usersRes, membersRes, incidentsRes] = await Promise.all([
        fetchUsers(),
        fetchAuthorityMembers(),
        fetchIncidents(),
      ]);
      setUsers(usersRes);
      setMembers(membersRes);
      setIncidents(incidentsRes);

      // ---------------------------------------------------------
      // 🔄 AUTO-SYNC OFFLINE INCIDENTS
      // ---------------------------------------------------------
      const offlineQueue = await getOfflineIncidents();
      if (offlineQueue.length > 0) {
        console.log(`Sync: Found ${offlineQueue.length} offline incidents to upload.`);

        for (const offlineInc of offlineQueue) {
          try {
            console.log(`Sync: Uploading ${offlineInc.id}...`);
            await createIncident(
              offlineInc.userId,
              offlineInc.type,
              offlineInc.message,
              offlineInc.isVoice,
              offlineInc.latitude,
              offlineInc.longitude
            );

            // Remove from queue on success
            await removeOfflineIncident(offlineInc.id);
            console.log(`Sync: Uploaded ${offlineInc.id} successfully.`);

            Alert.alert("✅ Sync Complete", `Your offline SOS has been uploaded to the server.`);
          } catch (syncErr) {
            console.error("Sync: Failed to upload incident, will retry later.", syncErr);
            break; // Stop syncing if connection drops again
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  }, []);

  // Poll data while logged in
  useEffect(() => {
    if (appState.screen === 'login') return;
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [appState.screen, refreshData]);

  const handleLogin = async (
    userType: 'user' | 'authority',
    email?: string,
    password?: string,
    name?: string,
    mode: 'login' | 'register' = 'login',
    phone?: string
  ) => {
    try {
      setLoading(true);
      if (userType === 'user' && email && password) {
        if (mode === 'register') {
          if (!name || !phone) {
            Alert.alert('Missing info', 'Name and phone are required to register');
            setLoading(false);
            return;
          }
          await registerUser(name, email, password, phone);
        }
        const user = await loginUser(email, password);
        setAppState({ screen: 'user-dashboard', userId: user.id, userName: user.name });
        Alert.alert('Welcome!', `Hello ${user.name}`);
      } else if (userType === 'authority' && email && password) {
        const member = await loginAuthority(email, password);
        switch (member.role) {
          case 'admin':
            setAppState({ screen: 'admin-dashboard', adminId: member.id, adminName: member.name, email: member.email });
            break;
          case 'health':
            setAppState({ screen: 'health-dashboard', staffId: member.id, staffName: member.name, email: member.email });
            break;
          case 'security':
            setAppState({ screen: 'security-dashboard', staffId: member.id, staffName: member.name, email: member.email });
            break;
          default:
            Alert.alert('Unsupported role');
        }
        Alert.alert('Welcome back!');
      }
    } catch (error: any) {
      Alert.alert('Login failed', error?.message || 'Unable to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (role: 'admin' | 'health' | 'security', email: string, name: string, password: string) => {
    try {
      setLoading(true);
      await addAuthorityMember(role, email, name, password);
      Alert.alert('Success', `${role.toUpperCase()} added`);
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to add member', error?.message || 'Unable to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setLoading(true);
      await deleteUser(userId);
      Alert.alert('User removed');
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to remove user', error?.message || 'Unable to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncidentStatus = async (id: string, status: 'responding' | 'resolved') => {
    try {
      await updateIncidentStatus(id, status);
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to update status', error?.message || 'Unable to update incident');
    }
  };

  const handleUpdateIncidentPriority = async (id: string, severity: 'low' | 'medium' | 'critical') => {
    try {
      await updateIncidentPriority(id, severity);
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to update priority', error?.message || 'Unable to update incident');
    }
  };

  const handleUpdateIncidentAuthority = async (id: string, authority: 'health' | 'security') => {
    try {
      await updateIncidentAuthority(id, authority);
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to update authority', error?.message || 'Unable to update incident');
    }
  };

  const handleFalseAlarm = async (id: string) => {
    try {
      await markFalseAlarm(id);
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to record false alarm', error?.message || 'Unable to update incident');
    }
  };

  const handleSendIncident = async (userId: string, type: string, message: string, isVoice: boolean, latitude?: number, longitude?: number): Promise<string | void> => {
    try {
      const newInc = await createIncident(userId, type, message, isVoice, latitude, longitude);
      setActiveIncidentId(newInc.id);
      Alert.alert('Emergency alert sent', 'Sharing live location...');
      refreshData();
      return newInc.id;
    } catch (error: any) {
      console.log('Online incident creation failed, falling back to EDGE AI', error);

      // ---------------------------------------------------------
      // 📴 OFFLINE EDGE AI FALLBACK
      // ---------------------------------------------------------
      const triageResult = runOfflineEdgeTriage(message, false);
      const offlineId = `offline_${Date.now()}`;

      const offlineIncident: Incident = {
        id: offlineId,
        userId: userId,
        type: type,
        message: message,
        isVoice: isVoice,
        timestamp: new Date().toISOString(),
        status: 'pending',
        authority: ['medical', 'accident', 'health'].includes(triageResult.category) ? 'health' : 'security',
        final_severity: triageResult.severity,
        reasoning: `[OFFLINE EDGE AI] Source: ${triageResult.classification_source}`,
        latitude: latitude,
        longitude: longitude,
      };

      await saveOfflineIncident(offlineIncident);

      // Update local state immediately so user sees it
      setIncidents(prev => [offlineIncident, ...prev]);
      setActiveIncidentId(offlineId);

      Alert.alert(
        '⚠️ Offline Mode Detected',
        `Network failed. \n\n✅ EDGE AI processed your alert locally.\nSeverity: ${triageResult.severity}\n\nYour SOS is queued and will auto-send when connection is restored.`
      );

      return offlineId;
    }
  };

  const handleLogout = () => {
    setAppState({ screen: 'login' });
    Alert.alert('Logged out');
  };

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  if (initializing) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />
      {appState.screen === 'login' ? (
        <LoginScreen onLogin={handleLogin} loading={loading} apiBaseUrl={apiBaseUrl} />
      ) : null}

      {appState.screen === 'user-dashboard' ? (
        <UserDashboard
          userId={appState.userId}
          userName={appState.userName}
          onSendIncident={(type, message, isVoice, latitude, longitude) =>
            handleSendIncident(appState.userId, type, message, isVoice, latitude, longitude)
          }
          onLogout={handleLogout}
        />
      ) : null}

      {appState.screen === 'admin-dashboard' ? (
        <AdminDashboard
          adminId={appState.adminId}
          adminName={appState.adminName}
          onLogout={handleLogout}
          onAddMember={handleAddMember}
          onRemoveUser={handleRemoveUser}
          members={members}
          users={users}
          incidents={incidents}
          onUpdatePriority={handleUpdateIncidentPriority}
          onUpdateAuthority={handleUpdateIncidentAuthority}
        />
      ) : null}

      {appState.screen === 'health-dashboard' ? (
        <HealthDashboard
          staffId={appState.staffId}
          staffName={appState.staffName}
          onLogout={handleLogout}
          incidents={incidents.filter((i) => i.authority === 'health' || i.authority === 'general')}
          onUpdateStatus={handleUpdateIncidentStatus}
          onUpdatePriority={handleUpdateIncidentPriority}
          onFalseAlarm={handleFalseAlarm}
        />
      ) : null}

      {appState.screen === 'security-dashboard' ? (
        <SecurityDashboard
          staffId={appState.staffId}
          staffName={appState.staffName}
          onLogout={handleLogout}
          incidents={incidents.filter((i) => i.authority === 'security' || i.authority === 'general')}
          onUpdateStatus={handleUpdateIncidentStatus}
          onUpdatePriority={handleUpdateIncidentPriority}
          onFalseAlarm={handleFalseAlarm}
        />
      ) : null}

      {loading && (
        <View style={{ position: 'absolute', top: 20, right: 20 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}
