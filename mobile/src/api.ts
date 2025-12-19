import { AuthorityMember, Incident, User } from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof payload === 'string' ? payload : payload?.detail || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function createAnonymousUser(name = 'User'): Promise<User> {
  const res = await fetch(`${API_URL}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const data = await handleResponse<any>(res);
  return { id: String(data.id), name: data.name };
}

export async function loginAuthority(email: string, password: string): Promise<AuthorityMember> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<any>(res);
  return {
    id: String(data.id),
    email: data.email,
    name: data.name,
    role: data.role,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`);
  const data = await handleResponse<any[]>(res);
  return data.map((u) => ({ id: String(u.id), name: u.name }));
}

export async function fetchAuthorityMembers(): Promise<AuthorityMember[]> {
  const res = await fetch(`${API_URL}/authority/members/`);
  const data = await handleResponse<any[]>(res);
  return data.map((m) => ({
    id: String(m.id),
    email: m.email,
    name: m.name,
    role: m.role,
  }));
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_URL}/incidents/`);
  const data = await handleResponse<any[]>(res);

  return data.map((i) => ({
    id: String(i.id),
    userId: String(i.user_id ?? i.userId ?? i.userID ?? i.user),
    type: i.type,
    message: i.message,
    isVoice: Boolean(i.is_voice ?? i.isVoice),
    timestamp: i.timestamp,
    status: i.status,
    authority: i.authority,
    officer_message: i.officer_message,
    final_severity: i.final_severity,
    reasoning: i.reasoning,
  }));
}

export async function addAuthorityMember(
  role: 'admin' | 'health' | 'security',
  email: string,
  name: string,
  password: string
): Promise<AuthorityMember> {
  const res = await fetch(`${API_URL}/authority/members/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, role, password }),
  });

  const data = await handleResponse<any>(res);
  return {
    id: String(data.id),
    email: data.email,
    name: data.name,
    role: data.role,
  };
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
  await handleResponse<any>(res);
}

export async function updateIncidentStatus(id: string, status: 'responding' | 'resolved'): Promise<void> {
  const res = await fetch(`${API_URL}/incidents/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  await handleResponse<any>(res);
}

export async function createIncident(
  userId: string,
  type: string,
  message: string,
  isVoice: boolean
): Promise<void> {
  const authority: 'health' | 'security' = ['medical', 'accident'].includes(type) ? 'health' : 'security';

  const res = await fetch(`${API_URL}/incidents/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: parseInt(userId, 10),
      type,
      message,
      is_voice: isVoice,
      authority,
    }),
  });

  await handleResponse<any>(res);
}

export function getApiBaseUrl() {
  return API_URL;
}
