'use client';

import Image from 'next/image';
import { SystemStatus, CameraStatus, IncidentStats } from '@/types';
import { LayoutDashboard, Video, ClipboardList, Users, Settings, Info } from 'lucide-react';
import type { Page } from './Sidebar';

interface MobileNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  status: SystemStatus;
  cameraStatus: CameraStatus;
  stats: IncidentStats;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> }[] = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'monitoring', label: 'Pantau', icon: Video },
  { id: 'history', label: 'Riwayat', icon: ClipboardList },
  { id: 'residents', label: 'Penghuni', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
  { id: 'about', label: 'Tentang', icon: Info },
];

export default function MobileNav({ activePage, onNavigate, status, stats }: MobileNavProps) {
  const isEmergency = status === 'EMERGENCY';
  const isMonitoring = status !== 'IDLE';

  return (
    <>
      {/* Top mobile header */}
      <header className="md:hidden bg-[#173C39] border-b border-[#1f4d49] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-sm text-white">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Logo FALLORA"
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/20"
            unoptimized
          />
          <div>
            <div
              className="text-white font-bold text-sm tracking-wider uppercase leading-none font-heading"
            >
              FALLORA
            </div>
            <span className="text-[10px] font-medium text-[#A8C5BC] block mt-0.5">
              Deteksi Jatuh Lansia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEmergency ? (
            <div className="px-2 py-0.5 bg-[#EF4444] text-white text-[10px] font-bold rounded border border-red-300 animate-pulse">
              DARURAT
            </div>
          ) : isMonitoring ? (
            <div className="px-2 py-0.5 bg-white/15 text-[#E8F0EC] text-[10px] font-semibold rounded border border-white/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              AKTIF
            </div>
          ) : (
            <div className="px-2 py-0.5 bg-white/10 text-[#A8C5BC] text-[10px] font-medium rounded border border-white/10">
              SIAGA
            </div>
          )}
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#173C39] border-t border-[#1f4d49] z-30 safe-area-pb shadow-lg">
        <div className="flex overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const showBadge = item.id === 'history' && stats.awaitingReview > 0;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 min-w-[56px] flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors relative ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-[#A8C5BC] hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-2 right-2 h-[2.5px] bg-[#E8F0EC] rounded-full" />
                )}
                <span className="relative">
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.4 : 1.7}
                    className={isActive ? 'text-white' : 'text-[#A8C5BC]'}
                  />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-[#EF4444] text-white text-[9px] font-bold">
                      {stats.awaitingReview > 9 ? '9+' : stats.awaitingReview}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
