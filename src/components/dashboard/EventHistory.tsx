'use client';

import { EventRecord } from '@/types';
import { History, Trash2 } from 'lucide-react';

interface EventHistoryProps {
  events: EventRecord[];
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(seconds: number): string {
  return `${String(seconds).padStart(2, '0')} detik`;
}

function StatusBadge({ status }: { status: EventRecord['status'] }) {
  const styles: Record<EventRecord['status'], { class: string; label: string }> = {
    Recovered: {
      class: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
      label: 'Pulih',
    },
    Emergency: {
      class: 'bg-red-50 text-[#DC2626] border-red-200',
      label: 'Darurat',
    },
    Ongoing: {
      class: 'bg-amber-50 text-[#D97706] border-amber-200',
      label: 'Berlangsung',
    },
  };

  const badge = styles[status] ?? {
    class: 'bg-slate-50 text-[#64748B] border-[#E2E8F0]',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.class}`}
    >
      {badge.label}
    </span>
  );
}

export default function EventHistory({ events, onClear }: EventHistoryProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-2xs">
      <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <History size={14} className="text-[#416A9C]" />
          <span className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
            Log Riwayat Kejadian
          </span>
          {events.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-[#64748B] px-1.5 py-0.5 rounded font-mono border border-[#E2E8F0]">
              {events.length}
            </span>
          )}
        </div>
        {events.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#DC2626] transition-colors font-medium"
          >
            <Trash2 size={12} />
            <span>Hapus Log</span>
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="px-4 py-8 text-center text-[#64748B] text-xs">
          Belum ada kejadian yang tercatat dalam sesi ini.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Waktu
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Klasifikasi
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Durasi
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Resolusi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {events.map((event, idx) => (
                <tr
                  key={event.id}
                  className={`hover:bg-[#F8FAFC] transition-colors ${
                    idx === 0 ? 'bg-slate-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-[#64748B]">
                    {formatTime(event.timestamp)}
                  </td>
                  <td className="px-4 py-2.5 text-[#111827] font-medium">
                    Kejadian Jatuh
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#64748B]">
                    {formatDuration(event.duration)}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={event.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
