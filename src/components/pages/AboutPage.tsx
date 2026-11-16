'use client';

import { CONFIG } from '@/lib/config';
import {
  Info,
  User,
  Workflow,
  Cpu,
  AlertTriangle,
  Shield,
  Sliders,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#0F2421]">
          Tentang FALLORA
        </h1>
        <p className="text-sm text-[#4A6760] mt-1">
          Sistem deteksi jatuh real-time berbasis Computer Vision.
        </p>
      </div>

      {/* Apa itu FALLORA */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <Info size={15} className="text-[#173C39]" />
          <h2 className="font-heading text-sm font-bold text-[#0F2421]">Apa itu FALLORA?</h2>
        </div>
        <p className="text-sm text-[#4A6760] leading-relaxed">
          <strong className="text-[#0F2421]">FALLORA</strong> adalah sistem pemantauan yang menggunakan kamera dan teknologi Computer Vision untuk mendeteksi kejadian jatuh secara real-time. Sistem ini dirancang khusus untuk membantu pengawasan keselamatan lansia.
        </p>
        <p className="text-sm text-[#4A6760] leading-relaxed">
          Ketika jatuh terdeteksi, sistem memantau selama <strong className="text-[#0F2421]">5 detik</strong> untuk menentukan apakah orang tersebut dapat bergerak kembali atau membutuhkan bantuan.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-[#E8F0EC] border border-[#D4E0DC]">
            <p className="text-xs font-semibold text-[#173C39] mb-1">✓ Pulih (Recovered)</p>
            <p className="text-xs text-[#4A6760] leading-relaxed">
              Terdeteksi pergerakan setelah jatuh. Subjek dapat bergerak mandiri.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs font-semibold text-[#B94B48] mb-1">⚠ Darurat (Emergency)</p>
            <p className="text-xs text-[#4A6760] leading-relaxed">
              Tidak ada pergerakan selama 5 detik. Potensi cedera serius.
            </p>
          </div>
        </div>
      </div>

      {/* Cara Kerja */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <Workflow size={15} className="text-[#173C39]" />
          <h2 className="font-heading text-sm font-bold text-[#0F2421]">Cara Kerja</h2>
        </div>
        <div className="flex items-center flex-wrap gap-2 py-1">
          {[
            'Kamera',
            '→',
            'Estimasi Pose',
            '→',
            'Deteksi Jatuh',
            '→',
            'Verifikasi 5 Detik',
            '→',
            'Pulih / Darurat',
          ].map((step, i) => (
            <span
              key={i}
              className={
                step === '→'
                  ? 'text-[#D4E0DC] font-sans text-sm px-1'
                  : 'bg-[#F7F8F5] text-[#0F2421] px-3 py-1.5 rounded-lg border border-[#EAF0ED] text-xs font-medium'
              }
            >
              {step}
            </span>
          ))}
        </div>
        <p className="text-sm text-[#4A6760] leading-relaxed">
          Kamera menangkap video, lalu model AI menganalisis posisi tubuh. Jika terdeteksi jatuh, sistem memverifikasi selama 5 detik sebelum menentukan status akhir.
        </p>
      </div>

      {/* Teknologi */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <Cpu size={15} className="text-[#173C39]" />
          <h2 className="font-heading text-sm font-bold text-[#0F2421]">Teknologi</h2>
        </div>
        <div className="divide-y divide-[#EAF0ED]">
          {[
            ['MoveNet Lightning', 'Model estimasi pose dari Google, mengekstrak 17 titik sendi tubuh secara real-time.'],
            ['TensorFlow.js', 'Inferensi machine learning langsung di browser melalui akselerasi WebGL.'],
            ['Next.js', 'Framework React untuk antarmuka web responsif dan modern.'],
            ['Webcam API', 'Akses kamera perangkat melalui browser standar.'],
            ['localStorage', 'Penyimpanan data insiden secara lokal di browser.'],
          ].map(([tech, desc]) => (
            <div key={tech} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3">
              <span className="text-xs font-semibold text-[#0F2421] sm:w-44 shrink-0">{tech}</span>
              <span className="text-xs text-[#4A6760] leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Parameter Kalibrasi */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-1 border-b border-[#EAF0ED]">
          <Sliders size={15} className="text-[#173C39]" />
          <h2 className="font-heading text-sm font-bold text-[#0F2421]">Parameter Deteksi</h2>
        </div>
        <div className="divide-y divide-[#EAF0ED]">
          {[
            ['Resolusi Kamera', `${CONFIG.CAMERA_WIDTH} × ${CONFIG.CAMERA_HEIGHT} px`],
            ['Target FPS', `${CONFIG.CAMERA_FPS} FPS`],
            [
              'Interval Inferensi',
              `Setiap ${CONFIG.DETECTION_FRAME_INTERVAL} frame (~${Math.round(CONFIG.CAMERA_FPS / CONFIG.DETECTION_FRAME_INTERVAL)} FPS)`,
            ],
            ['Keyakinan Pose Min.', `${(CONFIG.MIN_POSE_SCORE * 100).toFixed(0)}%`],
            ['Ambang Keyakinan Jatuh', `${(CONFIG.FALL_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%`],
            ['Batas Kemiringan Tubuh', `${CONFIG.BODY_ANGLE_THRESHOLD}°`],
            ['Verifikasi Pascajatuh', `${CONFIG.POST_FALL_DURATION / 1000} detik`],
            ['Ambang Perpindahan', CONFIG.MOVEMENT_THRESHOLD.toString()],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-2.5">
              <span className="text-xs text-[#4A6760]">{label}</span>
              <span className="text-xs font-mono font-semibold text-[#0F2421]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keterbatasan */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <AlertTriangle size={15} className="text-[#D6A66A]" />
          <h2 className="font-heading text-sm font-bold text-[#0F2421]">Keterbatasan</h2>
        </div>
        <ul className="space-y-2">
          {[
            'Membutuhkan pencahayaan yang memadai.',
            'Performa bergantung pada kemampuan GPU perangkat.',
            'Mendukung hingga 6 orang secara bersamaan.',
            'Bukan pengganti tenaga medis atau sistem darurat profesional.',
            'Data tersimpan lokal di browser, tidak dikirim ke server.',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#4A6760] leading-relaxed">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#D6A66A] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Pembuat */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EAF0ED]">
          <User size={15} className="text-[#173C39]" />
          <h2 className="font-heading text-sm font-bold text-[#0F2421]">Pembuat</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] border border-[#D4E0DC] flex items-center justify-center shrink-0">
            <User size={18} className="text-[#173C39]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F2421]">Murniasih</h3>
            <p className="text-xs text-[#7A9490]">Mahasiswa Sistem Informasi</p>
          </div>
        </div>
        <p className="text-sm text-[#4A6760] leading-relaxed">
          Dikembangkan oleh <strong className="text-[#0F2421]">Murniasih</strong> sebagai proyek eksplorasi penerapan Computer Vision untuk menyelesaikan permasalahan nyata di bidang keselamatan lansia.
        </p>
      </div>

      {/* Privasi */}
      <div className="bg-[#E8F0EC] border border-[#D4E0DC] rounded-xl p-4 flex gap-3 shadow-sm">
        <Shield size={16} className="text-[#173C39] shrink-0 mt-0.5" />
        <p className="text-sm text-[#4A6760] leading-relaxed">
          <strong className="text-[#0F2421]">Privasi:</strong>{' '}
          Seluruh pemrosesan video berjalan lokal di perangkat Anda. Tidak ada data yang dikirim ke server eksternal.
        </p>
      </div>
    </div>
  );
}
