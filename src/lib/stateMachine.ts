// ============================================================
// FALLORA — State Machine
// Defines valid transitions between system states.
// ============================================================

import { SystemStatus } from '@/types';

type Transition = {
  [K in SystemStatus]?: SystemStatus[];
};

const VALID_TRANSITIONS: Transition = {
  IDLE: ['MONITORING'],
  MONITORING: ['IDLE', 'FALL_DETECTED'],
  FALL_DETECTED: ['POST_FALL_MONITORING'],
  POST_FALL_MONITORING: ['RECOVERED', 'EMERGENCY'],
  RECOVERED: ['MONITORING', 'IDLE'],
  EMERGENCY: ['IDLE'],
};

export function canTransition(from: SystemStatus, to: SystemStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getStatusLabel(status: SystemStatus): string {
  const labels: Record<SystemStatus, string> = {
    IDLE: 'Sistem Siap',
    MONITORING: 'Memantau',
    FALL_DETECTED: 'Jatuh Terdeteksi',
    POST_FALL_MONITORING: 'Verifikasi Pascajatuh',
    RECOVERED: 'Pulih',
    EMERGENCY: 'Peringatan Darurat',
  };
  return labels[status];
}

export function getStatusColor(status: SystemStatus): string {
  switch (status) {
    case 'IDLE':
      return 'text-[#64748B]';
    case 'MONITORING':
      return 'text-[#16A34A]';
    case 'FALL_DETECTED':
    case 'POST_FALL_MONITORING':
      return 'text-[#D97706]';
    case 'RECOVERED':
      return 'text-[#16A34A]';
    case 'EMERGENCY':
      return 'text-[#DC2626]';
    default:
      return 'text-[#64748B]';
  }
}

export function getStatusBg(status: SystemStatus): string {
  switch (status) {
    case 'IDLE':
      return 'bg-slate-100 text-[#64748B] border-[#E2E8F0]';
    case 'MONITORING':
      return 'bg-emerald-50 text-[#16A34A] border-emerald-200/80';
    case 'FALL_DETECTED':
    case 'POST_FALL_MONITORING':
      return 'bg-amber-50 text-[#D97706] border-amber-200/80';
    case 'RECOVERED':
      return 'bg-emerald-50 text-[#16A34A] border-emerald-200/80';
    case 'EMERGENCY':
      return 'bg-red-50 text-[#DC2626] border-red-200/80';
    default:
      return 'bg-slate-100 text-[#64748B] border-[#E2E8F0]';
  }
}
