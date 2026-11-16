'use client';

import Image from 'next/image';
import { SystemStatus, CameraStatus, IncidentStats } from '@/types';
import { getStatusLabel } from '@/lib/stateMachine';
import {
  LayoutDashboard,
  Video,
  ClipboardList,
  Users,
  Settings,
  Info,
} from 'lucide-react';

export type Page = 'overview' | 'monitoring' | 'history' | 'residents' | 'settings' | 'about';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  status: SystemStatus;
  cameraStatus: CameraStatus;
  stats: IncidentStats;
  onStartResize?: (e: React.MouseEvent) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> }[] = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'monitoring', label: 'Pemantauan', icon: Video },
  { id: 'history', label: 'Riwayat', icon: ClipboardList },
  { id: 'residents', label: 'Penghuni & Zona', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
  { id: 'about', label: 'Tentang', icon: Info },
];

export default function Sidebar({
  activePage,
  onNavigate,
  status,
  cameraStatus,
  stats,
  onStartResize,
}: SidebarProps) {
  const isEmergency = status === 'EMERGENCY';
  const isMonitoring = status !== 'IDLE';

  const cameraColor =
    cameraStatus === 'active'
      ? '#22C55E'
      : cameraStatus === 'connecting'
      ? '#F59E0B'
      : cameraStatus === 'error'
      ? '#EF4444'
      : '#94A3B8';

  const systemDotColor = isEmergency
    ? '#EF4444'
    : isMonitoring
    ? '#22C55E'
    : '#94A3B8';

  return (
    <aside className="w-full h-full bg-[#173C39] border-r border-[#1f4d49] flex flex-col select-none relative text-white">
      {/* Drag resizer handle di sisi kanan */}
      {onStartResize && (
        <div
          onMouseDown={onStartResize}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 active:bg-white/40 transition-colors z-30 flex items-center justify-center group"
          title="Tarik untuk menyesuaikan lebar navigasi"
        >
          <div className="w-0.5 h-8 bg-white/20 group-hover:bg-white/60 rounded-full" />
        </div>
      )}

      {/* Logo & Identitas Aplikasi */}
      <div className="h-16 flex items-center px-4 shrink-0 border-b border-[#1f4d49]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/logo.png"
            alt="Logo FALLORA"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/20"
            unoptimized
          />
          <div className="min-w-0">
            <div
              className="text-white font-bold text-base tracking-wider uppercase leading-none font-heading truncate"
            >
              FALLORA
            </div>
            <div className="text-[#A8C5BC] text-[10px] leading-tight mt-1 font-medium truncate">
              Sistem Deteksi Jatuh
            </div>
          </div>
        </div>
      </div>

      {/* Navigasi Utama */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="mb-2 px-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A8C5BC]">
            Menu Navigasi
          </span>
        </div>

        <div className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const showBadge = item.id === 'history' && stats.awaitingReview > 0;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isActive
                    ? 'bg-[#E8F0EC] text-[#173C39] font-bold shadow-xs'
                    : 'text-[#E8F0EC]/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className="shrink-0"
                />
                <span className="flex-1 text-sm truncate">{item.label}</span>
                {showBadge && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-[#B94B48] text-white'
                        : 'bg-[#B94B48] text-white'
                    }`}
                  >
                    {stats.awaitingReview > 9 ? '9+' : stats.awaitingReview}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Status Sistem Ringkas di Bagian Bawah */}
      <div className="border-t border-[#1f4d49] p-3.5 space-y-2 shrink-0 bg-[#13322f]">
        {/* Status Kamera */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            {(cameraStatus === 'active' || isMonitoring) && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ backgroundColor: cameraColor }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: cameraColor }}
            />
          </span>
          <span className="text-[11px] text-[#A8C5BC] truncate">Kamera:</span>
          <span className="text-[11px] font-medium text-white ml-auto truncate">
            {cameraStatus === 'active'
              ? 'Terhubung'
              : cameraStatus === 'connecting'
              ? 'Menghubungkan'
              : cameraStatus === 'error'
              ? 'Gangguan'
              : 'Siaga'}
          </span>
        </div>

        {/* Status Sistem */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            {isEmergency && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-60" />
            )}
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: systemDotColor }}
            />
          </span>
          <span className="text-[11px] text-[#A8C5BC] truncate">Status:</span>
          <span
            className={`text-[11px] font-medium ml-auto truncate ${
              isEmergency
                ? 'text-[#EF4444] font-bold'
                : isMonitoring
                ? 'text-[#4ADE80] font-semibold'
                : 'text-white/80'
            }`}
          >
            {getStatusLabel(status)}
          </span>
        </div>
      </div>
    </aside>
  );
}
