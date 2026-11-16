'use client';

import { useState } from 'react';
import { CONFIG } from '@/lib/config';
import { alarm } from '@/lib/alarm';
import { loadIncidents } from '@/lib/storage';
import {
  Sliders,
  Volume2,
  VolumeX,
  Camera,
  Database,
  Download,
  Trash2,
  Check,
  Server,
  Play,
  Square,
} from 'lucide-react';

interface SettingsPageProps {
  onClearIncidents?: () => void;
}

export default function SettingsPage({ onClearIncidents }: SettingsPageProps) {
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleTestAlarm = () => {
    if (isPlayingAudioTest) {
      alarm?.stop();
      setIsPlayingAudioTest(false);
    } else {
      try {
        alarm?.init();
        alarm?.play();
        setIsPlayingAudioTest(true);
        setTimeout(() => {
          alarm?.stop();
          setIsPlayingAudioTest(false);
        }, 2500);
      } catch (err) {
        console.warn('Alarm test error:', err);
      }
    }
  };

  const handleExportJSON = () => {
    try {
      const data = loadIncidents();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fallora_insiden_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess('Data insiden berhasil diekspor ke file JSON');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Export JSON failed:', err);
    }
  };

  const handleExportCSV = () => {
    try {
      const data = loadIncidents();
      if (data.length === 0) {
        setExportSuccess('Tidak ada data insiden untuk diekspor.');
        setTimeout(() => setExportSuccess(null), 3000);
        return;
      }

      const headers = [
        'ID Insiden',
        'Waktu Deteksi',
        'Sudut Tubuh',
        'Keyakinan (%)',
        'Hasil Algoritma',
        'Status Pengasuh',
        'Verdiksi Pengasuh',
        'Catatan',
        'Tindakan',
      ];

      const rows = data.map((d) => [
        d.id,
        new Date(d.detectedAt).toLocaleString('id-ID'),
        d.bodyAngleAtDetection.toFixed(1),
        Math.round(d.confidenceAtDetection * 100),
        d.algorithmResult,
        d.caregiverStatus,
        d.caregiverVerdict || '-',
        `"${(d.caregiverNote || '').replace(/"/g, '""')}"`,
        `"${(d.caregiverAction || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fallora_insiden_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess('Data insiden berhasil diekspor ke file CSV');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#0F2421]">
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-[#4A6760] mt-1 max-w-2xl leading-relaxed">
          Parameter operasional Computer Vision, notifikasi audio, dan manajemen basis data telemetri.
        </p>
      </div>

      {exportSuccess && (
        <div className="bg-[#E8F0EC] border border-[#D4E0DC] text-[#173C39] px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <Check size={14} className="text-[#173C39]" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* 1. Parameter Kinematika CV */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <Sliders size={16} className="text-[#173C39]" />
          <div>
            <h2 className="font-heading text-sm font-bold text-[#0F2421]">
              Parameter Ambang Batas Deteksi (Computer Vision)
            </h2>
            <p className="text-[11px] text-[#7A9490]">
              Konfigurasi heuristik algoritma analisis pose spasial MoveNet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F2421]">Batas Sudut Kemiringan</span>
              <span className="font-mono font-bold text-[#173C39] bg-white px-2 py-0.5 rounded border border-[#D4E0DC]">
                {CONFIG.BODY_ANGLE_THRESHOLD}°
              </span>
            </div>
            <p className="text-[#7A9490] text-[11px] leading-relaxed">
              Sudut deviasi garis bahu-pinggul dari sumbu vertikal. Nilai &gt;55° mengindikasikan posisi tubuh horizontal.
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F2421]">Jendela Observasi Pascajatuh</span>
              <span className="font-mono font-bold text-[#173C39] bg-white px-2 py-0.5 rounded border border-[#D4E0DC]">
                {CONFIG.POST_FALL_DURATION / 1000} Detik
              </span>
            </div>
            <p className="text-[#7A9490] text-[11px] leading-relaxed">
              Waktu evaluasi keheningan atau reposisi gerakan setelah indikasi jatuh terdeteksi sebelum alarm darurat aktif.
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F2421]">Ambang Keyakinan Minimum</span>
              <span className="font-mono font-bold text-[#173C39] bg-white px-2 py-0.5 rounded border border-[#D4E0DC]">
                {Math.round(CONFIG.FALL_CONFIDENCE_THRESHOLD * 100)}%
              </span>
            </div>
            <p className="text-[#7A9490] text-[11px] leading-relaxed">
              Skor probabilitas gabungan minimum untuk memicu status verifikasi jatuh awal.
            </p>
          </div>

          <div className="p-3.5 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F2421]">Interval Sampling Inferensi</span>
              <span className="font-mono font-bold text-[#173C39] bg-white px-2 py-0.5 rounded border border-[#D4E0DC]">
                Tiap {CONFIG.DETECTION_FRAME_INTERVAL} Frame (~5 FPS)
              </span>
            </div>
            <p className="text-[#7A9490] text-[11px] leading-relaxed">
              Mengoptimalkan beban komputasi CPU/GPU browser tanpa mengorbankan ketepatan deteksi lonjakan jatuh.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Audio Alert & Notifications */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAF0ED]">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-[#173C39]" />
            <div>
              <h2 className="font-heading text-sm font-bold text-[#0F2421]">
                Notifikasi Suara &amp; Alarm Darurat
              </h2>
              <p className="text-[11px] text-[#7A9490]">
                Sintesis Web Audio API lokal untuk peringatan ketika kondisi darurat terpicu.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlarmEnabled(!alarmEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              alarmEnabled
                ? 'bg-[#E8F0EC] text-[#173C39] border-[#D4E0DC]'
                : 'bg-slate-100 text-[#7A9490] border-slate-200'
            }`}
          >
            {alarmEnabled ? (
              <>
                <Volume2 size={13} />
                <span>Alarm Aktif</span>
              </>
            ) : (
              <>
                <VolumeX size={13} />
                <span>Senyap</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#F7F8F5] border border-[#EAF0ED] p-4 rounded-xl">
          <div>
            <p className="font-semibold text-[#0F2421]">Uji Coba Pengeras Suara Perangkat</p>
            <p className="text-[#7A9490] text-[11px] mt-0.5">
              Bunyikan sampel nada alarm darurat (durasi 2,5 detik) untuk memastikan speaker caregiver berfungsi.
            </p>
          </div>
          <button
            onClick={handleTestAlarm}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              isPlayingAudioTest
                ? 'bg-[#B94B48] text-white shadow-sm'
                : 'bg-white text-[#173C39] border border-[#D4E0DC] hover:bg-slate-50'
            }`}
          >
            {isPlayingAudioTest ? (
              <>
                <Square size={12} fill="currentColor" />
                <span>Hentikan Suara</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>Uji Bunyi Alarm</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Input Kamera */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <Camera size={16} className="text-[#173C39]" />
          <div>
            <h2 className="font-heading text-sm font-bold text-[#0F2421]">
              Input Video &amp; Telemetri Kamera
            </h2>
            <p className="text-[11px] text-[#7A9490]">Spesifikasi perangkat tangkap video lokal.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl">
            <span className="text-[#7A9490] text-[11px] block">Resolusi Operasional</span>
            <span className="font-mono font-bold text-[#0F2421] text-sm mt-0.5 block">640 × 480 px</span>
            <span className="text-[10px] text-[#7A9490]">Rasio aspek 4:3 standar</span>
          </div>
          <div className="p-3 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl">
            <span className="text-[#7A9490] text-[11px] block">Target Frame Rate</span>
            <span className="font-mono font-bold text-[#0F2421] text-sm mt-0.5 block">30 FPS</span>
            <span className="text-[10px] text-[#7A9490]">Sinkronisasi canvas 60Hz</span>
          </div>
          <div className="p-3 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl">
            <span className="text-[#7A9490] text-[11px] block">Model Estimasi Multi-Person</span>
            <span className="font-semibold text-[#173C39] text-sm mt-0.5 block">MultiPose Lightning</span>
            <span className="text-[10px] text-[#7A9490]">Hingga 6 subjek simultan</span>
          </div>
        </div>
      </div>

      {/* 4. Database & Export Log Insiden */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <Database size={16} className="text-[#173C39]" />
          <div>
            <h2 className="font-heading text-sm font-bold text-[#0F2421]">
              Manajemen Data &amp; Ekspor Rekam Medis
            </h2>
            <p className="text-[11px] text-[#7A9490]">
              Penyimpanan persisten lokal berbasis browser (LocalStorage).
            </p>
          </div>
        </div>

        <p className="text-xs text-[#4A6760] leading-relaxed">
          Seluruh log insiden, evaluasi kinematika, dan verifikasi tindakan pengasuh disimpan secara aman di peramban lokal. Anda dapat mengekspor rekam data untuk laporan keperawatan atau evaluasi fasilitas panti jompo.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#173C39] border border-[#D4E0DC] text-xs font-semibold rounded-lg hover:bg-[#F7F8F5] transition-colors shadow-2xs"
          >
            <Download size={13} />
            <span>Ekspor JSON (Audit Lengkap)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#173C39] border border-[#D4E0DC] text-xs font-semibold rounded-lg hover:bg-[#F7F8F5] transition-colors shadow-2xs"
          >
            <Download size={13} />
            <span>Ekspor CSV (Format Tabel Excel)</span>
          </button>

          {onClearIncidents && (
            <div className="ml-auto">
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#B94B48] font-medium">Hapus seluruh riwayat?</span>
                  <button
                    onClick={() => {
                      onClearIncidents();
                      setShowClearConfirm(false);
                      setExportSuccess('Seluruh data insiden lokal telah dibersihkan.');
                      setTimeout(() => setExportSuccess(null), 3000);
                    }}
                    className="px-2.5 py-1 bg-[#B94B48] text-white text-xs font-semibold rounded-lg"
                  >
                    Ya, Bersihkan
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 text-xs text-[#7A9490] hover:text-[#0F2421]"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#B94B48] hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Bersihkan Cache Riwayat</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Info Engine & Environment */}
      <div className="bg-[#F7F8F5] border border-[#D4E0DC] rounded-xl p-4 text-xs text-[#4A6760] space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-[#0F2421]">
          <Server size={13} className="text-[#173C39]" />
          <span>Lingkungan Eksekusi Telemetri FALLORA</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#7A9490]">
          Next.js 16.3.8 (React 19) • TensorFlow.js 4.22 (Akselerasi WebGL GPU) • MoveNet MultiPose Lightning • Local Storage Encryption Partition.
        </p>
      </div>
    </div>
  );
}

