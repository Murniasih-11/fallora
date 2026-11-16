'use client';

import { DetectionInfo as DetectionInfoType, SystemStatus } from '@/types';
import { Activity, Layers, Move, Gauge } from 'lucide-react';

interface DetectionInfoProps {
  info: DetectionInfoType | null;
  status: SystemStatus;
  postFallSecondsLeft: number;
}

function MetricRow({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#D4E0DC] last:border-0">
      <div className="flex items-center gap-2 text-[#4A6760]">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-xs font-mono font-semibold text-[#0F2421]">
        {value}
        {unit && <span className="text-[#7A9490] text-[11px] font-normal ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

function MetricBar({
  value,
  colorClass,
}: {
  value: number; // 0 to 1
  colorClass: string;
}) {
  return (
    <div className="h-1.5 w-full bg-[#E8F0EC] rounded-full overflow-hidden mb-2">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${Math.min(Math.max(value * 100, 0), 100)}%` }}
      />
    </div>
  );
}

export default function DetectionInfoPanel({
  info,
  status,
  postFallSecondsLeft,
}: DetectionInfoProps) {
  const isPostFall = status === 'POST_FALL_MONITORING' || status === 'FALL_DETECTED';
  const isEmergency = status === 'EMERGENCY';

  return (
    <div className="bg-white border border-[#D4E0DC] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#D4E0DC] bg-white">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-[#4A6760]" />
          <span className="text-[10px] font-semibold text-[#7A9490] uppercase tracking-wider">
            Telemetri Kinematika
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#7A9490]">TF.js MoveNet</span>
      </div>

      <div className="p-4">
        {!info ? (
          <div className="text-xs text-[#7A9490] text-center py-8 bg-[#F7F8F5] rounded-lg border border-dashed border-[#D4E0DC]">
            Telemetri nonaktif. Mulai pemantauan untuk melihat metrik spasial langsung.
          </div>
        ) : (
          <div className="space-y-1">
            <MetricRow
              label="Kemiringan Tubuh"
              value={info.bodyAngle.toFixed(1)}
              unit="°"
              icon={<Layers size={13} className="text-[#4A6760]" />}
            />
            <MetricBar
              value={info.bodyAngle / 90}
              colorClass={info.bodyAngle > 55 ? 'bg-[#D6A66A]' : 'bg-[#173C39]'}
            />

            <MetricRow
              label="Keyakinan Deteksi"
              value={(info.confidence * 100).toFixed(0)}
              unit="%"
              icon={<Activity size={13} className="text-[#4A6760]" />}
            />
            <MetricBar
              value={info.confidence}
              colorClass={
                info.confidence >= 0.65
                  ? 'bg-[#173C39]'
                  : info.confidence >= 0.4
                  ? 'bg-[#D6A66A]'
                  : 'bg-[#D4E0DC]'
              }
            />

            <MetricRow
              label={isPostFall ? "Indeks Gerak Pascajatuh" : "Aktivitas Gerak Tubuh"}
              value={(Math.min(info.movementScore, 1) * 100).toFixed(0)}
              unit="%"
              icon={<Move size={13} className="text-[#4A6760]" />}
            />
            <MetricBar
              value={Math.min(info.movementScore, 1)}
              colorClass={
                isPostFall
                  ? info.movementScore > 0.4 ? 'bg-[#173C39]' : 'bg-[#B94B48]'
                  : info.movementScore > 0.2 ? 'bg-[#173C39]' : 'bg-[#D4E0DC]'
              }
            />

            <MetricRow
              label="Titik Kunci Terdeteksi"
              value={`${info.keypointsDetected} / 17`}
              icon={<Layers size={13} className="text-[#4A6760]" />}
            />
          </div>
        )}

        {/* Spanduk Verifikasi Pascajatuh */}
        {isPostFall && postFallSecondsLeft > 0 && (
          <div className="mt-4 p-3 bg-[#D6A66A]/10 border border-[#D6A66A]/30 rounded-lg">
            <p className="text-[11px] font-semibold text-[#D6A66A] uppercase tracking-wider mb-1">
              Verifikasi Pascajatuh
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#D6A66A]">Mengamati pergerakan</span>
              <span className="text-lg font-bold font-mono text-[#D6A66A]">
                {postFallSecondsLeft} detik
              </span>
            </div>
          </div>
        )}

        {/* Panggilan Kondisi Darurat */}
        {isEmergency && (
          <div className="mt-4 p-3 bg-[#B94B48]/10 border border-[#B94B48]/30 rounded-lg">
            <p className="text-[11px] font-bold text-[#B94B48] uppercase tracking-wider">
              Kritis: Subjek Tidak Bergerak
            </p>
            <p className="text-xs text-[#B94B48] mt-0.5">
              Tidak ada perpindahan posisi yang terdeteksi selama jendela verifikasi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
