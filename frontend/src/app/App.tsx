import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { HealthDashboard } from './components/HealthDashboard';
import { SecurityDashboard } from './components/SecurityDashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

const API_URL = 'http://127.0.0.1:8000';

type AppState =
  | { screen: 'login' }
  | { screen: 'user-dashboard'; userId: string; userName: string }
  | { screen: 'admin-dashboard'; adminId: string; adminName: string; email: string }
  | { screen: 'health-dashboard'; staffId: string; staffName: string; email: string }
  | { screen: 'security-dashboard'; staffId: string; staffName: string; email: string };

interface User {
  id: string; // Component expects string, backend gives int. We'll convert.
  name: string;
}

interface AuthorityMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'health' | 'security';
}

interface Incident {
  id: string;
  userId: string;
  type: string;
  message: string;
  isVoice: boolean;
  timestamp: string;
  status: 'pending' | 'responding' | 'resolved';
  authority: 'health' | 'security';
  // LLM Enrichment
  officer_message?: string;
  final_severity?: string;
  reasoning?: string;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'login' });
  const [users, setUsers] = useState<User[]>([]);
  const [authorityMembers, setAuthorityMembers] = useState<AuthorityMember[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Refresh data helper
  const refreshData = async () => {
    try {
      const usersRes = await fetch(`${API_URL}/users/`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.map((u: any) => ({ ...u, id: String(u.id) })));
      }

      const authRes = await fetch(`${API_URL}/authority/members/`);
      if (authRes.ok) {
        const authData = await authRes.json();
        setAuthorityMembers(authData.map((m: any) => ({ ...m, id: String(m.id) })));
      }

      const incRes = await fetch(`${API_URL}/incidents/`);
      if (incRes.ok) {
        const incData = await incRes.json();
        setIncidents(incData.map((i: any) => ({ ...i, id: String(i.id), userId: String(i.user_id), authority: i.authority })));
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  // Poll for data updates when dashboard is active (simple implementation)
  useEffect(() => {
    if (appState.screen !== 'login') {
      refreshData();
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [appState.screen]);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('fantasticfour_session');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setAppState(parsedState);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  // Save session to sessionStorage when appState changes
  useEffect(() => {
    if (appState.screen !== 'login') {
      sessionStorage.setItem('fantasticfour_session', JSON.stringify(appState));
    } else {
      sessionStorage.removeItem('fantasticfour_session');
    }
  }, [appState]);

  const handleLogin = async (userType: 'user' | 'authority', email?: string, password?: string) => {
    if (userType === 'user') {
      try {
        const res = await fetch(`${API_URL}/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `User` }) // Default name
        });

        if (res.ok) {
          const newUser = await res.json();
          const userIdStr = String(newUser.id);

          setAppState({
            screen: 'user-dashboard',
            userId: userIdStr,
            userName: newUser.name
          });
          toast.success(`Welcome! Your ID: ${userIdStr}`);
        } else {
          toast.error("Failed to create user");
        }
      } catch (err) {
        toast.error("Connection error");
        console.error(err);
      }
    } else if (email && password) {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (res.ok) {
          const data = await res.json();
          // data matches {id, name, email, role}

          switch (data.role) {
            case 'admin':
              setAppState({
                screen: 'admin-dashboard',
                adminId: String(data.id),
                adminName: data.name,
                email: data.email
              });
              break;
            case 'health':
              setAppState({
                screen: 'health-dashboard',
                staffId: String(data.id),
                staffName: data.name,
                email: data.email
              });
              break;
            case 'security':
              setAppState({
                screen: 'security-dashboard',
                staffId: String(data.id),
                staffName: data.name,
                email: data.email
              });
              break;
          }
          toast.success('Welcome back!');
        } else {
          toast.error('Invalid credentials');
        }
      } catch (err) {
        toast.error("Login failed");
        console.error(err);
      }
    }
  };

  const handleAddMember = async (role: 'admin' | 'health' | 'security', email: string, name: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/authority/members/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, password })
      });

      if (res.ok) {
        const newMember = await res.json();
        toast.success(`${role.toUpperCase()} added!`, { description: `ID: ${newMember.id}` });
        refreshData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to add member");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
      toast.success('User removed');
      refreshData();
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const handleUpdateIncidentStatus = async (id: string, status: 'responding' | 'resolved') => {
    try {
      // Backend needs an endpoint for this, we'll assume /incidents/{id}/status for now or just generic update
      // Creating simple endpoint in backend next step.
      const res = await fetch(`${API_URL}/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Incident marked as ${status}`);
        refreshData();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleSendIncident = async (userId: string, type: string, message: string, isVoice: boolean) => {
    let authority: 'health' | 'security' = 'security';
    if (type === 'medical' || type === 'accident') {
      authority = 'health';
    }

    try {
      const res = await fetch(`${API_URL}/incidents/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId),
          type,
          message,
          is_voice: isVoice,
          authority
        })
      });

      if (res.ok) {
        toast.success('Emergency alert sent!', { description: `Sent to ${authority}` });
        refreshData();
      } else {
        toast.error("Failed to send alert");
      }
    } catch {
      toast.error("Network error sending alert");
    }
  };

  const handleLogout = () => {
    setAppState({ screen: 'login' });
    toast.success('Logged out successfully');
  };

  return (
    <>
      {appState.screen === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {appState.screen === 'user-dashboard' && (
        <UserDashboard
          userId={appState.userId}
          userName={appState.userName}
          apiBaseUrl={API_URL}
          onSendIncident={(type, message, isVoice) => handleSendIncident(appState.userId, type, message, isVoice)}
        />
      )}

      {appState.screen === 'admin-dashboard' && (
        <AdminDashboard
          adminId={appState.adminId}
          adminName={appState.adminName}
          onLogout={handleLogout}
          onAddMember={handleAddMember}
          onRemoveUser={handleRemoveUser}
          members={authorityMembers.map(m => ({
            id: String(m.id),
            name: m.name,
            email: m.email,
            role: m.role
          }))}
          users={users.map(u => ({
            id: String(u.id),
            name: u.name
          }))}
          incidents={incidents}
        />
      )}

      {appState.screen === 'health-dashboard' && (
        <HealthDashboard
          staffId={appState.staffId}
          staffName={appState.staffName}
          onLogout={handleLogout}
          incidents={incidents.filter(i => i.authority === 'health')}
          onUpdateStatus={handleUpdateIncidentStatus}
        />
      )}

      {appState.screen === 'security-dashboard' && (
        <SecurityDashboard
          staffId={appState.staffId}
          staffName={appState.staffName}
          onLogout={handleLogout}
          incidents={incidents.filter(i => i.authority === 'security')}
          onUpdateStatus={handleUpdateIncidentStatus}
        />
      )}

      <Toaster position="top-center" richColors />
    </>
  );
}
