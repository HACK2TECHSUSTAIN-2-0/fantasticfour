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
} from './src/api';
import { LoginScreen } from './src/screens/LoginScreen';
import { UserDashboard } from './src/screens/UserDashboard';
import { AdminDashboard } from './src/screens/AdminDashboard';
import { HealthDashboard } from './src/screens/HealthDashboard';
import { SecurityDashboard } from './src/screens/SecurityDashboard';
import { AppState, AuthorityMember, Incident, User } from './src/types';
import { clearSession, loadSession, saveSession } from './src/utils/storage';
import { colors } from './src/theme';

export default function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'login' });
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<AuthorityMember[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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

  const handleSendIncident = async (userId: string, type: string, message: string, isVoice: boolean) => {
    try {
      await createIncident(userId, type, message, isVoice);
      Alert.alert('Emergency alert sent');
      refreshData();
    } catch (error: any) {
      Alert.alert('Failed to send alert', error?.message || 'Unable to send alert');
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
          onSendIncident={(type, message, isVoice) => handleSendIncident(appState.userId, type, message, isVoice)}
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
        />
      ) : null}

      {appState.screen === 'health-dashboard' ? (
        <HealthDashboard
          staffId={appState.staffId}
          staffName={appState.staffName}
          onLogout={handleLogout}
          incidents={incidents.filter((i) => i.authority === 'health')}
          onUpdateStatus={handleUpdateIncidentStatus}
        />
      ) : null}

      {appState.screen === 'security-dashboard' ? (
        <SecurityDashboard
          staffId={appState.staffId}
          staffName={appState.staffName}
          onLogout={handleLogout}
          incidents={incidents.filter((i) => i.authority === 'security')}
          onUpdateStatus={handleUpdateIncidentStatus}
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
