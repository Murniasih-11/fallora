'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraStatus, SystemStatus } from '@/types';
import { Loader2, CameraOff, Play, Square, Maximize2, Minimize2, Video } from 'lucide-react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraStatus: CameraStatus;
  systemStatus: SystemStatus;
  errorMessage: string | null;
  postFallSecondsLeft: number;
  onStart: () => void;
  onStop: () => void;
}

export default function CameraFeed({
  videoRef,
  canvasRef,
  cameraStatus,
  systemStatus,
  errorMessage,
  postFallSecondsLeft,
  onStart,
  onStop,
}: CameraFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isActive = cameraStatus === 'active';
  const isConnecting = cameraStatus === 'connecting';
  const isEmergency = systemStatus === 'EMERGENCY';
  const isPostFall =
    systemStatus === 'POST_FALL_MONITORING' || systemStatus === 'FALL_DETECTED';

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
    } catch { /* ignore */ }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
    } catch { /* ignore */ }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleChange = () => {
      const fsEl = document.fullscreenElement;
      setIsFullscreen(!!fsEl && fsEl === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && isActive) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, toggleFullscreen]);

  return (
    <div className="bg-white border border-[#D4E0DC] rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-[#D4E0DC] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <Video size={15} className="text-[#4A6760]" />
          <span className="text-xs font-semibold text-[#0F2421] uppercase tracking-wider">
            Umpan Kamera Langsung
          </span>
          {isActive && (
            <span className="text-[10px] bg-[#E8F0EC] text-[#4A6760] px-1.5 py-0.5 rounded font-mono border border-[#D4E0DC]">
              640×480
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Layar Penuh (F)' : 'Layar Penuh (F)'}
              className="flex items-center justify-center w-7 h-7 rounded border border-[#D4E0DC] text-[#4A6760] hover:bg-[#F7F8F5] hover:text-[#0F2421] transition-colors"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          {!isActive && !isConnecting ? (
            <button
              onClick={onStart}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#173C39] text-white text-xs font-medium rounded-lg hover:bg-[#1f4d49] transition-all shadow-sm"
            >
              <Play size={12} fill="currentColor" />
              <span>Mulai Pemantauan</span>
            </button>
          ) : isConnecting ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-[#4A6760] px-3 py-1.5 bg-[#F7F8F5] border border-[#D4E0DC] rounded-lg font-medium">
              <Loader2 size={13} className="animate-spin text-[#173C39]" />
              <span>Menghubungkan…</span>
            </div>
          ) : (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0F2421] text-xs font-medium rounded-lg border border-[#D4E0DC] hover:bg-[#F7F8F5] transition-colors shadow-sm"
            >
              <Square size={12} />
              <span>Hentikan Pemantauan</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden flex items-center justify-center ${
          isEmergency ? 'ring-2 ring-[#B94B48] ring-inset' : ''
        } ${isFullscreen ? 'w-screen h-screen' : 'aspect-video'}`}
      >
        {/*
          Video element dipertahankan di DOM untuk decoding stream dari webcam.
          Frame video ditransfer ke canvas secara presisi melalui ctx.drawImage().
        */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Umpan kamera langsung (sumber)"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            display: isActive ? 'block' : 'none',
          }}
        />

        {/* === UI State Overlays === */}

        {/* Inactive */}
        {!isActive && !isConnecting && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full border border-slate-800 bg-slate-900/60 flex items-center justify-center">
              <CameraOff size={20} className="text-slate-500" />
            </div>
            <div>
              <p className="text-slate-300 text-sm font-semibold tracking-wide">
                Umpan Kamera Nonaktif
              </p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs">
                Tekan &quot;Mulai Pemantauan&quot; untuk mengaktifkan kamera dan estimasi pose.
              </p>
            </div>
          </div>
        )}

        {/* Connecting */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-[#E8F0EC] animate-spin" />
            <div className="text-center">
              <p className="text-slate-200 text-sm font-medium">Menghubungkan Kamera…</p>
              <p className="text-slate-400 text-xs mt-1">Memuat model AI deteksi pose</p>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 text-center px-8">
            <div className="w-10 h-10 rounded-full border border-red-800 bg-red-950/40 flex items-center justify-center">
              <CameraOff size={16} className="text-[#B94B48]" />
            </div>
            <p className="text-red-300 text-xs leading-relaxed max-w-sm">{errorMessage}</p>
            <button
              onClick={onStart}
              className="px-3.5 py-1.5 bg-slate-800 text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* HUD — hanya saat aktif */}
        {isActive && (
          <>
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-mono tracking-wider text-white/90 flex items-center gap-1.5 border border-white/10 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6A66A] animate-pulse" />
              SIARAN LANGSUNG
            </div>

            {systemStatus !== 'IDLE' && (
              <div
                className={`absolute top-3 right-3 px-2.5 py-1 rounded text-xs font-semibold backdrop-blur-sm shadow-md border pointer-events-none ${
                  isEmergency
                    ? 'bg-[#B94B48]/95 text-white border-red-400'
                    : isPostFall
                    ? 'bg-[#D6A66A]/95 text-white border-amber-300'
                    : systemStatus === 'RECOVERED'
                    ? 'bg-[#16A34A]/95 text-white border-emerald-400'
                    : 'bg-black/70 text-white/90 border-white/10'
                }`}
              >
                {systemStatus === 'MONITORING'
                  ? 'MEMANTAU'
                  : systemStatus === 'FALL_DETECTED'
                  ? 'JATUH TERDETEKSI'
                  : systemStatus === 'POST_FALL_MONITORING'
                  ? `VERIFIKASI: ${postFallSecondsLeft}d`
                  : systemStatus === 'RECOVERED'
                  ? 'PULIH'
                  : 'PERINGATAN DARURAT'}
              </div>
            )}

            {isPostFall && postFallSecondsLeft > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 pointer-events-none">
                <div
                  className="h-full bg-[#D6A66A] transition-all duration-1000"
                  style={{ width: `${(postFallSecondsLeft / 5) * 100}%` }}
                />
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              className="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 rounded bg-black/60 backdrop-blur-sm text-white/80 hover:bg-black/80 hover:text-white transition-colors border border-white/10"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {isFullscreen && (
              <div className="absolute bottom-3 left-3 text-[10px] text-white/40 font-mono select-none pointer-events-none">
                Tekan ESC atau F untuk keluar layar penuh
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
