'use client';

import { SystemStatus, CameraStatus, IncidentRecord, DetectionInfo } from '@/types';
import StatusCard from '@/components/dashboard/StatusCard';
import CameraFeed from '@/components/dashboard/CameraFeed';
import DetectionInfoPanel from '@/components/dashboard/DetectionInfo';
import EmergencyAlert from '@/components/emergency/EmergencyAlert';
import { Play, Clock } from 'lucide-react';

interface MonitoringPageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  systemStatus: SystemStatus;
  cameraStatus: CameraStatus;
  detectionInfo: DetectionInfo | null;
  postFallSecondsLeft: number;
  fallStartTime: number | null;
  incidents: IncidentRecord[];
  isModelLoading: boolean;
  errorMessage: string | null;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function getAlgorithmInfo(result: IncidentRecord['algorithmResult']): { label: string; cls: string } {
  switch (result) {
    case 'movement_detected': return { label: 'Gerakan Terdeteksi', cls: 'text-[#16A34A]' };
    case 'no_significant_movement': return { label: 'Tanpa Gerakan', cls: 'text-[#B94B48]' };
    case 'fall_indication': return { label: 'Indikasi Jatuh', cls: 'text-[#D6A66A]' };
    case 'unable_to_verify': return { label: 'Tidak Terverifikasi', cls: 'text-[#7A9490]' };
  }
}

export default function MonitoringPage({
  videoRef,
  canvasRef,
  systemStatus,
  cameraStatus,
  detectionInfo,
  postFallSecondsLeft,
  fallStartTime,
  incidents,
  isModelLoading,
  errorMessage,
  onStart,
  onStop,
  onReset,
}: MonitoringPageProps) {
  const isIdle = systemStatus === 'IDLE' && cameraStatus === 'disconnected';
  const isEmergency = systemStatus === 'EMERGENCY';
  const recentIncidents = incidents.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Halaman */}
      <div>
        <p className="text-xs font-semibold text-[#7A9490] uppercase tracking-wider mb-1">
          Telemetri Aktif · Umpan &amp; Analisis Langsung
        </p>
        <h1 className="font-heading text-2xl font-bold text-[#0F2421]">
          Pemantauan Langsung
        </h1>
        <p className="text-sm text-[#4A6760] mt-1 max-w-2xl">
          Pelacakan pose spasial real-time dan evaluasi kejadian jatuh secara langsung.
        </p>
      </div>

      {/* Kartu Ringkasan Metrik Sistem */}
      <StatusCard
        systemStatus={systemStatus}
        cameraStatus={cameraStatus}
        isModelLoading={isModelLoading}
        postFallSecondsLeft={postFallSecondsLeft}
      />

      {/* Spanduk Peringatan Darurat */}
      {isEmergency && (
        <EmergencyAlert
          fallStartTime={fallStartTime}
          onReset={onReset}
          onStop={onStop}
        />
      )}

      {/* Tampilan Kamera & Panel Telemetri Metrik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <CameraFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraStatus={cameraStatus}
            systemStatus={systemStatus}
            errorMessage={errorMessage}
            postFallSecondsLeft={postFallSecondsLeft}
            onStart={onStart}
            onStop={onStop}
          />
        </div>
        <div>
          <DetectionInfoPanel
            info={detectionInfo}
            status={systemStatus}
            postFallSecondsLeft={postFallSecondsLeft}
          />
        </div>
      </div>

      {/* Log Insiden Sesi (compact) */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#D4E0DC] flex items-center gap-2 bg-white">
          <Clock size={14} className="text-[#4A6760]" />
          <span className="text-xs font-semibold text-[#0F2421] uppercase tracking-wider">
            Log Insiden Sesi
          </span>
          {incidents.length > 0 && (
            <span className="text-[10px] bg-[#E8F0EC] text-[#4A6760] px-1.5 py-0.5 rounded font-mono border border-[#D4E0DC]">
              {incidents.length}
            </span>
          )}
        </div>
        {recentIncidents.length === 0 ? (
          <div className="px-5 py-6 text-center text-[#7A9490] text-xs">
            Belum ada insiden yang tercatat dalam sesi ini.
          </div>
        ) : (
          <div className="divide-y divide-[#D4E0DC]">
            {recentIncidents.map((inc) => {
              const algo = getAlgorithmInfo(inc.algorithmResult);
              return (
                <div key={inc.id} className="px-5 py-2.5 flex items-center justify-between gap-4 hover:bg-[#F7F8F5] transition-colors">
                  <div>
                    <span className="text-[11px] font-mono text-[#7A9490]">{formatTime(inc.detectedAt)}</span>
                    <span className="mx-2 text-[#D4E0DC]">·</span>
                    <span className={`text-[11px] font-medium ${algo.cls}`}>{algo.label}</span>
                  </div>
                  <span className="text-[10px] text-[#7A9490] font-mono shrink-0">
                    {inc.id.split('-').pop()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kartu Panduan Saat Siaga */}
      {isIdle && (
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-6 text-center shadow-sm">
          <p className="text-xs text-[#4A6760] mb-3">
            Aliran kamera saat ini dijeda. Mulai pemantauan untuk mengaktifkan deteksi jatuh berkelanjutan.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#173C39] text-white text-xs font-medium rounded-lg hover:bg-[#1f4d49] transition-all shadow-sm"
          >
            <Play size={13} fill="currentColor" />
            <span>Mulai Sesi Pemantauan</span>
          </button>
        </div>
      )}
    </div>
  );
}
