// ============================================================
// FALLORA — Storage Layer
// Menyimpan insiden dan riwayat ke localStorage.
// Data hanya tersimpan pada perangkat dan browser yang digunakan.
// Tidak ada sinkronisasi lintas perangkat atau multi-user.
// ============================================================

import { IncidentRecord, CaregiverStatus, CaregiverVerdict, IncidentStats } from '@/types';
import { CONFIG } from './config';

const INCIDENT_KEY = 'fallora_incidents_v2';

// ---- CRUD Incidents ----

export function loadIncidents(): IncidentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INCIDENT_KEY);
    return raw ? (JSON.parse(raw) as IncidentRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveIncident(incident: IncidentRecord): IncidentRecord[] {
  const all = loadIncidents();
  // Cegah duplikat ID
  const existing = all.findIndex((i) => i.id === incident.id);
  let updated: IncidentRecord[];
  if (existing !== -1) {
    updated = all.map((i) => (i.id === incident.id ? incident : i));
  } else {
    updated = [incident, ...all].slice(0, CONFIG.MAX_HISTORY_RECORDS);
  }
  try {
    localStorage.setItem(INCIDENT_KEY, JSON.stringify(updated));
  } catch {
    // Storage penuh — abaikan
  }
  return updated;
}

export function updateIncidentCaregiverStatus(
  id: string,
  updates: {
    caregiverStatus: CaregiverStatus;
    caregiverVerdict?: CaregiverVerdict | null;
    caregiverNote?: string;
    caregiverAction?: string;
    reviewedAt?: number | null;
    resolvedAt?: number | null;
  }
): IncidentRecord[] {
  const all = loadIncidents();
  const updated = all.map((inc) => {
    if (inc.id !== id) return inc;
    return {
      ...inc,
      ...updates,
      caregiverNote: updates.caregiverNote ?? inc.caregiverNote,
      caregiverAction: updates.caregiverAction ?? inc.caregiverAction,
      caregiverVerdict: updates.caregiverVerdict !== undefined
        ? updates.caregiverVerdict
        : inc.caregiverVerdict,
      reviewedAt: updates.reviewedAt !== undefined ? updates.reviewedAt : inc.reviewedAt,
      resolvedAt: updates.resolvedAt !== undefined ? updates.resolvedAt : inc.resolvedAt,
    };
  });
  try {
    localStorage.setItem(INCIDENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function clearAllIncidents(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(INCIDENT_KEY);
}

// ---- Statistics ----

export function computeStats(incidents: IncidentRecord[]): IncidentStats {
  const total = incidents.length;
  const awaitingReview = incidents.filter((i) => i.caregiverStatus === 'awaiting_review').length;
  const confirmedIncidents = incidents.filter((i) => i.caregiverStatus === 'confirmed_incident').length;
  const falseAlarms = incidents.filter((i) => i.caregiverStatus === 'false_alarm').length;
  const unableToConfirm = incidents.filter((i) => i.caregiverStatus === 'unable_to_confirm').length;
  const resolved = incidents.filter((i) => i.caregiverStatus === 'resolved').length;
  const truePositives = confirmedIncidents;
  const falsePositives = falseAlarms;

  return {
    total,
    awaitingReview,
    confirmedIncidents,
    falseAlarms,
    unableToConfirm,
    resolved,
    truePositives,
    falsePositives,
  };
}

// ---- ID Generation ----

export function generateIncidentId(): string {
  return `INC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ---- Legacy compatibility (EventRecord) ----
// Dipertahankan untuk kompatibilitas mundur

export function loadHistory(): import('@/types').EventRecord[] {
  return [];
}

export function saveEvent(_event: import('@/types').EventRecord): import('@/types').EventRecord[] { // eslint-disable-line @typescript-eslint/no-unused-vars
  return [];
}

export function generateEventId(): string {
  return generateIncidentId();
}
