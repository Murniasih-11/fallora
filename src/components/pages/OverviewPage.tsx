'use client';

import { useMemo } from 'react';
import { SystemStatus, CameraStatus, IncidentStats, IncidentRecord } from '@/types';
import {
  Camera,
  Cpu,
  Clock,
  Play,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bell,
  BarChart3,
  PieChart as PieIcon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface OverviewPageProps {
  systemStatus: SystemStatus;
  cameraStatus: CameraStatus;
  isModelLoading: boolean;
  stats: IncidentStats;
  incidents: IncidentRecord[];
  onStartMonitoring: () => void;
  onNavigateMonitoring: () => void;
  onNavigateHistory: () => void;
}

function formatRelativeTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function getAlgorithmLabel(result: IncidentRecord['algorithmResult']): string {
  switch (result) {
    case 'movement_detected': return 'Gerakan Terdeteksi';
    case 'no_significant_movement': return 'Imobilitas Terdeteksi';
    case 'fall_indication': return 'Indikasi Jatuh';
    case 'unable_to_verify': return 'Belum Terverifikasi';
  }
}

function getCaregiverStatusLabel(status: IncidentRecord['caregiverStatus']): string {
  switch (status) {
    case 'awaiting_review': return 'Menunggu Review';
    case 'under_review': return 'Sedang Diperiksa';
    case 'confirmed_incident': return 'Terkonfirmasi';
    case 'false_alarm': return 'Alarm Palsu';
    case 'unable_to_confirm': return 'Belum Pasti';
    case 'resolved': return 'Selesai';
  }
}

function getCaregiverBadge(status: IncidentRecord['caregiverStatus']) {
  switch (status) {
    case 'awaiting_review':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'under_review':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'confirmed_incident':
      return 'bg-red-50 text-[#B94B48] border-red-200';
    case 'false_alarm':
      return 'bg-[#F7F8F5] text-[#7A9490] border-[#D4E0DC]';
    case 'unable_to_confirm':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'resolved':
      return 'bg-[#E8F0EC] text-[#173C39] border-[#D4E0DC]';
  }
}

export default function OverviewPage({
  systemStatus,
  cameraStatus,
  isModelLoading,
  stats,
  incidents,
  onStartMonitoring,
  onNavigateMonitoring,
  onNavigateHistory,
}: OverviewPageProps) {
  const isMonitoring = systemStatus !== 'IDLE';
  const recentIncidents = incidents.slice(0, 4);

  // Perhitungan Data Grafik Batang (Distribusi Aktivitas 7 Hari / Waktu)
  const barChartData = useMemo(() => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    // Inisialisasi frekuensi hari ini dan 6 hari ke belakang
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7; // Sen=0, Min=6

    // Hitung distribusi berdasarkan insiden aktual
    incidents.forEach((inc) => {
      const d = new Date(inc.detectedAt);
      const dayIdx = (d.getDay() + 6) % 7;
      counts[dayIdx] += 1;
    });

    const maxCount = Math.max(...counts, 4); // Minimal skala 4 agar visual proporsional

    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      heightPct: Math.round((counts[idx] / maxCount) * 100),
      isToday: idx === currentDayIdx,
    }));
  }, [incidents]);

  // Perhitungan Data Grafik Donut (Rasio Verifikasi)
  const donutData = useMemo(() => {
    const total = stats.total || 0;
    const confirmed = stats.confirmedIncidents || 0;
    const falseAlarm = stats.falseAlarms || 0;
    const pending = stats.awaitingReview || 0;
    const other = Math.max(0, total - confirmed - falseAlarm - pending);

    if (total === 0) {
      return {
        confirmedPct: 0,
        falseAlarmPct: 0,
        pendingPct: 0,
        hasData: false,
        total: 0,
      };
    }

    return {
      confirmedPct: Math.round((confirmed / total) * 100),
      falseAlarmPct: Math.round((falseAlarm / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      otherPct: Math.round((other / total) * 100),
      hasData: true,
      total,
      confirmed,
      falseAlarm,
      pending,
    };
  }, [stats]);

  // Hitung stroke offset untuk donut SVG
  const circumference = 2 * Math.PI * 38; // r=38 -> ~238.76
  const confirmedOffset = circumference - (circumference * (donutData.confirmedPct || 0)) / 100;
  const falseAlarmOffset = circumference - (circumference * (donutData.falseAlarmPct || 0)) / 100;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Dasbor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D4E0DC]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#0F2421]">
            Dasbor Pemantauan
          </h1>
          <p className="text-xs text-[#4A6760] mt-0.5">
            Metrik operasional waktu-nyata, status kesiapan kamera, dan evaluasi hasil deteksi.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isMonitoring ? (
            <button
              onClick={() => {
                onNavigateMonitoring();
                onStartMonitoring();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#173C39] text-white text-xs font-semibold rounded-lg hover:bg-[#1f4d49] transition-all shadow-xs"
            >
              <Play size={13} fill="currentColor" />
              <span>Mulai Sesi Pemantauan</span>
            </button>
          ) : (
            <button
              onClick={onNavigateMonitoring}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#173C39] text-xs font-semibold rounded-lg border border-[#D4E0DC] hover:bg-[#F7F8F5] transition-all shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Buka Pemantauan Langsung</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Pusat Notifikasi / Tindak Lanjut Penting */}
      {stats.awaitingReview > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Bell size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Pemberitahuan Tindak Lanjut Pengasuh
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Terdapat <strong>{stats.awaitingReview} insiden</strong> yang menunggu verifikasi manual dan catatan pengasuh.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <span>Tinjau Riwayat</span>
            <ChevronRight size={14} />
          </button>
        </div>
      ) : systemStatus === 'EMERGENCY' ? (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-[#B94B48] animate-bounce shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#B94B48]">
                PERINGATAN DARURAT AKTIF
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Subjek tidak bergerak setelah kejadian jatuh terdeteksi. Tanggap darurat diperlukan.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateMonitoring}
            className="px-3 py-1.5 bg-[#B94B48] text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shrink-0"
          >
            Lihat Kamera
          </button>
        </div>
      ) : null}

      {/* 4 Stat Cards Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Insiden */}
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-[#7A9490] uppercase tracking-wider">
              Total Insiden
            </span>
            <AlertTriangle size={15} className="text-[#4A6760]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-[#0F2421]">{stats.total}</p>
            <p className="text-[11px] text-[#7A9490] mt-0.5">Kejadian tercatat di log</p>
          </div>
        </div>

        {/* Menunggu Review */}
        <div
          className={`rounded-xl p-4 shadow-sm border flex flex-col justify-between ${
            stats.awaitingReview > 0
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-white border-[#D4E0DC]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                stats.awaitingReview > 0 ? 'text-amber-800' : 'text-[#7A9490]'
              }`}
            >
              Menunggu Review
            </span>
            <HelpCircle
              size={15}
              className={stats.awaitingReview > 0 ? 'text-amber-600' : 'text-[#7A9490]'}
            />
          </div>
          <div>
            <p
              className={`text-2xl font-bold font-mono ${
                stats.awaitingReview > 0 ? 'text-amber-800' : 'text-[#0F2421]'
              }`}
            >
              {stats.awaitingReview}
            </p>
            <p className="text-[11px] text-[#7A9490] mt-0.5">Perlu verifikasi pengasuh</p>
          </div>
        </div>

        {/* Terkonfirmasi */}
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-[#7A9490] uppercase tracking-wider">
              Terkonfirmasi
            </span>
            <CheckCircle2 size={15} className="text-[#16A34A]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-[#0F2421]">
              {stats.confirmedIncidents}
            </p>
            <p className="text-[11px] text-[#7A9490] mt-0.5">Jatuh nyata divalidasi</p>
          </div>
        </div>

        {/* Alarm Palsu */}
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-[#7A9490] uppercase tracking-wider">
              Alarm Palsu
            </span>
            <XCircle size={15} className="text-[#7A9490]" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-[#0F2421]">{stats.falseAlarms}</p>
            <p className="text-[11px] text-[#7A9490] mt-0.5">Bukan kondisi darurat</p>
          </div>
        </div>
      </div>

      {/* Section Grafik / Visualisasi Data (2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Grafik Batang (Bar Chart) Aktivitas Mingguan */}
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF0ED]">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-[#173C39]" />
                <h2 className="font-heading text-xs font-bold text-[#0F2421] uppercase tracking-wider">
                  Frekuensi Insiden Mingguan
                </h2>
              </div>
              <span className="text-[10px] text-[#7A9490] font-medium">Berdasarkan Hari</span>
            </div>

            <p className="text-xs text-[#4A6760] mt-2 mb-6">
              Distribusi catatan deteksi jatuh selama siklus mingguan fasilitas.
            </p>

            {/* Visualisasi Batang Bar Chart */}
            <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2 border-b border-[#D4E0DC]">
              {barChartData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-mono text-[#7A9490] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className="w-full max-w-[28px] rounded-t-md transition-all duration-300 relative"
                    style={{
                      height: `${Math.max(item.heightPct, 6)}%`,
                      backgroundColor: item.count > 0 ? (item.isToday ? '#173C39' : '#416A9C') : '#E8F0EC',
                    }}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      item.isToday ? 'text-[#173C39] font-bold' : 'text-[#7A9490]'
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#7A9490] pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#173C39]" />
              <span>Hari Ini</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#416A9C]" />
              <span>Hari Lainnya</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#E8F0EC]" />
              <span>Tanpa Insiden</span>
            </div>
          </div>
        </div>

        {/* 2. Grafik Bulat / Donut Chart Rasio Verifikasi */}
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAF0ED]">
              <div className="flex items-center gap-2">
                <PieIcon size={16} className="text-[#173C39]" />
                <h2 className="font-heading text-xs font-bold text-[#0F2421] uppercase tracking-wider">
                  Distribusi Validasi Pengasuh
                </h2>
              </div>
              <span className="text-[10px] text-[#7A9490] font-medium">Rasio Penanganan</span>
            </div>

            <p className="text-xs text-[#4A6760] mt-2 mb-4">
              Perbandingan hasil konfirmasi jatuh versus alarm palsu dari seluruh riwayat.
            </p>

            {/* Circular Donut Diagram */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Lingkaran latar */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    className="stroke-[#E8F0EC]"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Busur Terkonfirmasi */}
                  {donutData.confirmedPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="stroke-[#173C39] transition-all duration-500"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={confirmedOffset}
                      strokeLinecap="round"
                    />
                  )}
                  {/* Busur Alarm Palsu */}
                  {donutData.falseAlarmPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      className="stroke-[#D6A66A] transition-all duration-500"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={falseAlarmOffset}
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {/* Angka Tengah */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-mono text-[#0F2421] leading-none">
                    {donutData.total}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-[#7A9490] mt-0.5">
                    Total
                  </span>
                </div>
              </div>

              {/* Rincian Donut */}
              <div className="space-y-2 text-xs flex-1 max-w-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#173C39]" />
                    <span className="text-[#0F2421] font-medium">Terkonfirmasi</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0F2421]">
                    {donutData.confirmed || 0} ({donutData.confirmedPct || 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D6A66A]" />
                    <span className="text-[#0F2421] font-medium">Alarm Palsu</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0F2421]">
                    {donutData.falseAlarm || 0} ({donutData.falseAlarmPct || 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-[#0F2421] font-medium">Menunggu Tindak Lanjut</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0F2421]">
                    {donutData.pending || 0} ({donutData.pendingPct || 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#EAF0ED] pt-3 text-[11px] text-[#7A9490] flex items-center justify-between">
            <span>Akurasi Algoritma Teruji</span>
            <span className="font-mono font-semibold text-[#173C39]">
              {donutData.total > 0
                ? `${Math.round(((donutData.confirmed || 0) / (Math.max((donutData.confirmed || 0) + (donutData.falseAlarm || 0), 1))) * 100)}% Presisi`
                : 'Belum Ada Evaluasi'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Kesiapan Sistem & Aktivitas Insiden Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Kesiapan Sistem */}
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAF0ED]">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-[#173C39]" />
              <h2 className="font-heading text-xs font-bold text-[#0F2421] uppercase tracking-wider">
                Kesiapan Sistem
              </h2>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                isMonitoring
                  ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                  : 'bg-slate-100 text-[#7A9490] border-slate-200'
              }`}
            >
              {isMonitoring ? 'Aktif' : 'Siaga'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#EAF0ED]">
              <div className="flex items-center gap-1.5 text-[#4A6760]">
                <Camera size={13} />
                <span>Kamera</span>
              </div>
              <span className="font-medium text-[#0F2421]">
                {cameraStatus === 'active' ? '640×480 @ 30 FPS' : 'Webcam Siaga'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#EAF0ED]">
              <div className="flex items-center gap-1.5 text-[#4A6760]">
                <Cpu size={13} />
                <span>Mesin AI</span>
              </div>
              <span className="font-medium text-[#0F2421]">
                {isModelLoading ? 'Memuat...' : 'MoveNet MultiPose'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#EAF0ED]">
              <div className="flex items-center gap-1.5 text-[#4A6760]">
                <Clock size={13} />
                <span>Ambang Sudut</span>
              </div>
              <span className="font-mono font-semibold text-[#0F2421]">
                &gt; 55° (Deviasi Horisontal)
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5 text-[#4A6760]">
                <Clock size={13} />
                <span>Observasi Pascajatuh</span>
              </div>
              <span className="font-mono font-semibold text-[#0F2421]">
                5,0 Detik
              </span>
            </div>
          </div>
        </div>

        {/* Tabel Ringkas Aktivitas Terkini (2 Kolom) */}
        <div className="lg:col-span-2 bg-white border border-[#D4E0DC] rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-[#D4E0DC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#173C39]" />
                <h2 className="font-heading text-xs font-bold text-[#0F2421] uppercase tracking-wider">
                  Insiden Terkini
                </h2>
              </div>
              <button
                onClick={onNavigateHistory}
                className="inline-flex items-center gap-1 text-xs text-[#173C39] hover:text-[#0F2421] font-semibold transition-colors"
              >
                <span>Buka Riwayat Lengkap</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {recentIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A9490]">
                Belum ada insiden jatuh yang tercatat. Sistem dalam kondisi siaga aman.
              </div>
            ) : (
              <div className="divide-y divide-[#EAF0ED]">
                {recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={onNavigateHistory}
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#F7F8F5] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0F2421]">
                          {inc.id}
                        </span>
                        <span className="text-[11px] text-[#7A9490]">
                          · {formatRelativeTime(inc.detectedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A6760] mt-0.5 truncate">
                        {getAlgorithmLabel(inc.algorithmResult)} · Sudut {inc.bodyAngleAtDetection.toFixed(1)}°
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getCaregiverBadge(
                        inc.caregiverStatus
                      )}`}
                    >
                      {getCaregiverStatusLabel(inc.caregiverStatus)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-2.5 bg-[#F7F8F5] border-t border-[#EAF0ED] text-[11px] text-[#7A9490] flex items-center justify-between">
            <span>Menampilkan {recentIncidents.length} insiden terbaru</span>
            <button
              onClick={onNavigateHistory}
              className="text-[#173C39] font-medium hover:underline"
            >
              Kelola di Halaman Riwayat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
