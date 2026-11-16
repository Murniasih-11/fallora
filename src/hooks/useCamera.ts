'use client';

// ============================================================
// FALLORA — Camera Hook
// ============================================================

import { useRef, useState, useCallback } from 'react';
import { CameraStatus, FacingMode } from '@/types';
import { CONFIG } from '@/lib/config';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: CameraStatus;
  errorMessage: string | null;
  facingMode: FacingMode;
  startCamera: (mode?: FacingMode) => Promise<boolean>;
  stopCamera: () => void;
  switchCamera: () => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const facingModeRef = useRef<FacingMode>('user');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('disconnected');
    setErrorMessage(null);
  }, []);

  const startCamera = useCallback(async (requestedMode?: FacingMode): Promise<boolean> => {
    const targetMode = requestedMode || facingModeRef.current;
    facingModeRef.current = targetMode;
    setFacingMode(targetMode);

    setErrorMessage(null);
    setCameraStatus('connecting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('API Kamera tidak didukung pada peramban ini.');
      setCameraStatus('error');
      return false;
    }

    // Hentikan stream sebelumnya jika sedang beralih kamera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream;
      try {
        // Coba dengan preferensi facingMode (user / environment)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CONFIG.CAMERA_WIDTH },
            height: { ideal: CONFIG.CAMERA_HEIGHT },
            frameRate: { ideal: CONFIG.CAMERA_FPS, max: CONFIG.CAMERA_FPS },
            facingMode: { ideal: targetMode },
          },
          audio: false,
        });
      } catch {
        // Fallback jika facingMode tidak didukung pada perangkat kamera tunggal
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CONFIG.CAMERA_WIDTH },
            height: { ideal: CONFIG.CAMERA_HEIGHT },
            frameRate: { ideal: CONFIG.CAMERA_FPS, max: CONFIG.CAMERA_FPS },
          },
          audio: false,
        });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        // Set stream langsung ke srcObject
        video.srcObject = stream;

        try {
          await video.play();
        } catch (playErr) {
          const e = playErr as Error;
          if (e.name !== 'AbortError') {
            console.warn('[FALLORA] video.play() warning:', e.name, e.message);
          }
        }
      }

      setCameraStatus('active');
      return true;
    } catch (err) {
      const error = err as Error;
      let msg = 'Kamera tidak dapat diakses. Periksa izin peramban dan sambungan kamera.';

      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        msg = 'Kamera tidak ditemukan. Hubungkan kamera dan coba lagi.';
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        msg = 'Izin kamera ditolak. Izinkan akses kamera pada pengaturan peramban.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        msg = 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut dan coba lagi.';
      } else if (error.name === 'AbortError') {
        return false;
      }

      setErrorMessage(msg);
      setCameraStatus('error');
      return false;
    }
  }, []);

  const switchCamera = useCallback(async (): Promise<boolean> => {
    const nextMode: FacingMode = facingModeRef.current === 'user' ? 'environment' : 'user';
    facingModeRef.current = nextMode;
    setFacingMode(nextMode);
    return startCamera(nextMode);
  }, [startCamera]);

  return {
    videoRef,
    cameraStatus,
    errorMessage,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
