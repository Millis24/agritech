export interface UserProfile {
  nomeUtente: string;
  email: string;
  notifySync: boolean;
  notifyErrors: boolean;
  darkMode: boolean;
  defaultReportRange: '7d' | 'month' | 'quarter' | 'year';
}

export const API_BASE = 'https://agritech-crm.it';
import { getBaseUrl } from '../lib/getBaseUrl';

/**
 * Recupera il profilo utente corrente
 */
export async function getUserProfile(): Promise<UserProfile> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getBaseUrl()}/api/user/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    throw new Error(`Errore nel recupero del profilo (${res.status})`);
  }
  return res.json();
}


/**
 * Aggiorna i campi del profilo utente
 */
export async function updateUserProfile(data: Partial<UserProfile>): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getBaseUrl()}/api/user/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore nell’aggiornamento del profilo');
}


/**
 * Cambia la password dell'utente
 * @returns true se cambiata con successo, false altrimenti
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${getBaseUrl()}/api/user/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return res.ok;
}