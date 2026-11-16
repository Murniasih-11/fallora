'use client';

// ============================================================
// FALLORA — Camera Hook
// ============================================================

import { useRef, useState, useCallback } from 'react';
import { CameraStatus } from '@/types';
import { CONFIG } from '@/lib/config';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: CameraStatus;
  errorMessage: string | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const startCamera = useCallback(async (): Promise<boolean> => {
    setErrorMessage(null);
    setCameraStatus('connecting');

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('API Kamera tidak didukung pada peramban ini.');
      setCameraStatus('error');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: CONFIG.CAMERA_WIDTH },
          height: { ideal: CONFIG.CAMERA_HEIGHT },
          frameRate: { ideal: CONFIG.CAMERA_FPS, max: CONFIG.CAMERA_FPS },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        // Set stream langsung ke srcObject
        video.srcObject = stream;

        // play() — browser akan otomatis play karena autoPlay + muted
        // Tangani NotAllowedError yang kadang muncul di beberapa browser
        try {
          await video.play();
        } catch (playErr) {
          const e = playErr as Error;
          // AbortError = ok (navigasi), NotAllowedError = no autoplay policy
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

  return { videoRef, cameraStatus, errorMessage, startCamera, stopCamera };
}
