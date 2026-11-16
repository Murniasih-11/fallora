'use client';

import { SystemStatus, CameraStatus } from '@/types';
import { getStatusLabel, getStatusBg } from '@/lib/stateMachine';
import { Camera, Shield, Cpu } from 'lucide-react';

interface StatusCardProps {
  systemStatus: SystemStatus;
  cameraStatus: CameraStatus;
  isModelLoading: boolean;
  postFallSecondsLeft: number;
}

export default function StatusCard({
  systemStatus,
  cameraStatus,
  isModelLoading,
  postFallSecondsLeft,
}: StatusCardProps) {
  const isPostFall =
    systemStatus === 'POST_FALL_MONITORING' || systemStatus === 'FALL_DETECTED';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Status Sistem */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-[#4A6760]" />
            <span className="text-[10px] font-semibold text-[#7A9490] uppercase tracking-wider">
              Status Sistem
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${getStatusBg(
              systemStatus
            )}`}
          >
            {getStatusLabel(systemStatus)}
          </div>
        </div>
        {isPostFall && postFallSecondsLeft > 0 && (
          <p className="text-xs text-[#D6A66A] mt-2 font-medium tabular-nums flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6A66A] animate-pulse" />
            Jendela verifikasi: {postFallSecondsLeft} detik tersisa
          </p>
        )}
      </div>

      {/* Input Kamera */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Camera size={14} className="text-[#4A6760]" />
          <span className="text-[10px] font-semibold text-[#7A9490] uppercase tracking-wider">
            Input Kamera
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-semibold ${
              cameraStatus === 'active'
                ? 'text-[#16A34A]'
                : cameraStatus === 'error'
                ? 'text-[#B94B48]'
                : cameraStatus === 'connecting'
                ? 'text-[#D6A66A]'
                : 'text-[#7A9490]'
            }`}
          >
            {cameraStatus === 'active'
              ? 'Aliran Aktif'
              : cameraStatus === 'connecting'
              ? 'Menghubungkan…'
              : cameraStatus === 'error'
              ? 'Kesalahan Perangkat'
              : 'Terputus'}
          </span>
          {cameraStatus === 'active' && (
            <span className="text-[11px] text-[#7A9490] font-mono">640×480</span>
          )}
        </div>
      </div>

      {/* Mesin Inferensi */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={14} className="text-[#4A6760]" />
          <span className="text-[10px] font-semibold text-[#7A9490] uppercase tracking-wider">
            Mesin Inferensi
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${
            isModelLoading
              ? 'text-[#D6A66A]'
              : systemStatus !== 'IDLE'
              ? 'text-[#16A34A]'
              : 'text-[#7A9490]'
          }`}
        >
          {isModelLoading
            ? 'Menginisialisasi MoveNet…'
            : systemStatus === 'IDLE'
            ? 'Siaga'
            : 'MoveNet Aktif'}
        </span>
        <p className="text-[11px] text-[#7A9490] mt-0.5">
          {isModelLoading ? 'Memuat model ke WebGL' : '17 Titik Kunci @ ~30 FPS'}
        </p>
      </div>
    </div>
  );
}
