import { AuthorityMember, Incident, User } from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://shivaranjane-fantastic-backend.hf.space').replace(/\/$/, '');
const STT_URL = (process.env.EXPO_PUBLIC_STT_URL || `${API_URL}/speech-to-english/`).replace(/\/$/, '') + '/';

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
    user_name: i.user_name,
    user_phone: i.user_phone,
    latitude: i.latitude,
    longitude: i.longitude,
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
  isVoice: boolean,
  latitude?: number,
  longitude?: number
): Promise<Incident> {
  const authority: 'health' | 'security' = ['medical', 'accident'].includes(type) ? 'health' : 'security';

  const res = await fetch(`${API_URL}/incidents/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: parseInt(userId, 10),
      type,
      message,
      is_voice: isVoice,
      authority, // backend might override based on triage or 'general' handling
      latitude,
      longitude,
    }),
  });

  const data = await handleResponse<any>(res);
  return {
    id: String(data.id),
    userId: String(data.user_id),
    type: data.type,
    message: data.message,
    isVoice: Boolean(data.is_voice),
    timestamp: data.timestamp,
    status: data.status,
    authority: data.authority,
    officer_message: data.officer_message,
    final_severity: data.final_severity,
    reasoning: data.reasoning,
    user_name: data.user_name,
    user_phone: data.user_phone,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

export async function updateIncidentLocation(id: string, latitude: number, longitude: number): Promise<void> {
  const res = await fetch(`${API_URL}/incidents/${id}/location`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
  await handleResponse<any>(res);
}

export async function updateIncidentPriority(id: string, severity: 'low' | 'medium' | 'critical'): Promise<void> {
  const res = await fetch(`${API_URL}/incidents/${id}/priority`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ final_severity: severity.toUpperCase() }),
  });
  await handleResponse<any>(res);
}

export async function markFalseAlarm(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/incidents/${id}/false-alarm`, {
    method: 'PUT',
  });
  await handleResponse<any>(res);
  await handleResponse<any>(res);
}

export async function updateIncidentAuthority(id: string, authority: 'health' | 'security'): Promise<void> {
  const res = await fetch(`${API_URL}/incidents/${id}/authority`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authority }),
  });
  await handleResponse<any>(res);
}

export async function getUserDetails(id: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`);
  const data = await handleResponse<any>(res);
  return { ...data, id: String(data.id) };
}

export async function updateUserHotwords(id: string, hotwords: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}/hotwords`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotwords }),
  });
  await handleResponse<any>(res);
}

export async function uploadSpeechToEnglish(audioUri: string, sourceLang = 'auto'): Promise<string> {
  const form = new FormData();
  const filename = audioUri.split('/').pop() || 'audio.m4a';
  form.append('file', {
    uri: audioUri,
    name: filename,
    type: 'audio/m4a',
  } as any);
  form.append('source_lang', sourceLang);

  const res = await fetch(STT_URL, {
    method: 'POST',
    body: form,
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await handleResponse<any>(res);
  return data?.translated_text || '';
}

export async function uploadIncidentEvidence(incidentId: string, audioUri: string): Promise<string> {
  const form = new FormData();
  const filename = audioUri.split('/').pop() || 'evidence.m4a';
  form.append('file', {
    uri: audioUri,
    name: filename,
    type: 'audio/m4a',
  } as any);

  const res = await fetch(`${API_URL}/incidents/${incidentId}/evidence`, {
    method: 'POST',
    body: form,
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await handleResponse<any>(res);
  return data.url;
}

export function getApiBaseUrl() {
  return API_URL;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<any>(res);
  return { id: String(data.id), name: data.name, email: data.email, phone: data.phone };
}

export async function registerUser(name: string, email: string, password: string, phone: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  });
  const data = await handleResponse<any>(res);
  return { id: String(data.id), name: data.name, email: data.email };
}
