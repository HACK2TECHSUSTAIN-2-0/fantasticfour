export type AppState =
  | { screen: 'login' }
  | { screen: 'user-dashboard'; userId: string; userName: string }
  | { screen: 'admin-dashboard'; adminId: string; adminName: string; email: string }
  | { screen: 'health-dashboard'; staffId: string; staffName: string; email: string }
  | { screen: 'security-dashboard'; staffId: string; staffName: string; email: string };

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  hotwords?: string; // JSON string
}

export interface AuthorityMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'health' | 'security';
}

export interface Incident {
  id: string;
  userId: string;
  type: string;
  message: string;
  isVoice: boolean;
  timestamp: string;
  status: 'pending' | 'responding' | 'resolved';
  authority: 'health' | 'security' | 'general';
  officer_message?: string;
  final_severity?: string;
  reasoning?: string;
  user_name?: string;
  user_phone?: string;
  latitude?: number;
  longitude?: number;
  audio_evidence?: string;
  report_count?: number;
}
