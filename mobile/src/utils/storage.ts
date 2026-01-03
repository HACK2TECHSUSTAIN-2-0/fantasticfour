import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Incident } from '../types';

const STORAGE_KEY = 'fantasticfour_mobile_session';
const OFFLINE_QUEUE_KEY = 'fantasticfour_offline_queue';

export async function loadSession(): Promise<AppState | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as AppState) : null;
  } catch {
    return null;
  }
}

export async function saveSession(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures for now
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function saveOfflineIncident(incident: Incident): Promise<void> {
  try {
    const existing = await getOfflineIncidents();
    existing.push(incident);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
  } catch {
    console.log('Failed to save offline incident');
  }
}

export async function getOfflineIncidents(): Promise<Incident[]> {
  try {
    const value = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function removeOfflineIncident(id: string): Promise<void> {
  try {
    const existing = await getOfflineIncidents();
    const filtered = existing.filter(i => i.id !== id);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // ignore
  }
}
