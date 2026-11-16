'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw, Square } from 'lucide-react';

interface EmergencyAlertProps {
  fallStartTime: number | null;
  onReset: () => void;
  onStop: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function ElapsedSince({ startTime }: { startTime: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.round((now - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="font-mono tabular-nums">
      {mins > 0 ? `${mins}m ` : ''}{secs}s
    </span>
  );
}

export default function EmergencyAlert({ fallStartTime, onReset, onStop }: EmergencyAlertProps) {
  return (
    <div className="bg-[#B94B48]/10 border border-[#B94B48]/30 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-[#B94B48]/15 border border-[#B94B48]/30 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={22} className="text-[#B94B48]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#B94B48] text-white rounded-md">
              Peringatan Prioritas Tinggi
            </span>
            <span className="text-xs text-[#B94B48] font-medium">• Tidak Terdeteksi Pergerakan Subjek</span>
          </div>
          <h2 className="font-heading text-base font-bold text-[#B94B48] mb-1 uppercase tracking-wide">
            Peringatan Darurat
          </h2>
          <p className="text-xs text-[#4A6760] mb-4 leading-relaxed max-w-xl">
            Penurunan mendadak tercatat dan tidak ada perubahan posisi tubuh yang signifikan dalam jendela observasi 5 detik pascajatuh. Bantuan segera mungkin dibutuhkan.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4 text-xs bg-white/60 border border-[#B94B48]/20 rounded-lg p-3 max-w-md">
            <div>
              <p className="text-[10px] text-[#7A9490] uppercase tracking-wider font-semibold mb-0.5">
                Waktu Kejadian
              </p>
              <p className="font-mono font-medium text-[#0F2421]">
                {fallStartTime ? formatTime(fallStartTime) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#7A9490] uppercase tracking-wider font-semibold mb-0.5">
                Durasi Tanpa Gerakan
              </p>
              <p className="font-medium text-[#B94B48]">
                {fallStartTime ? <ElapsedSince startTime={fallStartTime} /> : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-reset-status"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#B94B48] text-white text-xs font-semibold rounded-lg hover:bg-[#a03f3c] transition-colors shadow-sm"
            >
              <RotateCcw size={12} />
              <span>Konfirmasi &amp; Atur Ulang</span>
            </button>
            <button
              id="btn-emergency-stop"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#0F2421] text-xs font-medium rounded-lg border border-[#D4E0DC] hover:bg-[#F7F8F5] transition-colors shadow-sm"
            >
              <Square size={12} />
              <span>Hentikan Pemantauan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
