'use client';

// ============================================================
// FALLORA — Detection State Hook (Revisi ISCOMFEST 2026)
// Mengintegrasikan incident management dengan deteksi jatuh.
// ============================================================

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  SystemStatus,
  PoseEstimate,
  DetectionInfo,
  IncidentRecord,
  AlgorithmResult,
  IncidentStats,
  FacingMode,
} from '@/types';
import { CONFIG } from '@/lib/config';
import { canTransition } from '@/lib/stateMachine';
import {
  loadIncidents,
  saveIncident,
  generateIncidentId,
  updateIncidentCaregiverStatus,
  computeStats,
} from '@/lib/storage';
import {
  loadPoseDetector,
  estimatePoses,
  disposePoseDetector,
} from '@/cv/poseEstimation';
import { detectFall, TemporalContext } from '@/cv/fallDetection';
import { detectMovement, evaluatePostFallCondition } from '@/cv/movementDetection';
import { drawPoses } from '@/cv/drawing';
import { alarm } from '@/lib/alarm';
import { CaregiverStatus, CaregiverVerdict } from '@/types';

export interface UseDetectionStateReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: SystemStatus;
  detectionInfo: DetectionInfo | null;
  postFallSecondsLeft: number;
  fallStartTime: number | null;
  incidents: IncidentRecord[];
  stats: IncidentStats;
  isModelLoading: boolean;
  facingMode: FacingMode;
  setFacingMode: (mode: FacingMode) => void;
  transition: (next: SystemStatus) => boolean;
  startDetection: (videoEl: HTMLVideoElement, mode?: FacingMode) => void;
  stopDetection: () => void;
  resetStatus: () => void;
  updateIncident: (
    id: string,
    caregiverStatus: CaregiverStatus,
    verdict?: CaregiverVerdict | null,
    note?: string,
    action?: string
  ) => void;
  clearIncidents: () => void;
}

export function useDetectionState(): UseDetectionStateReturn {
  const [status, setStatus] = useState<SystemStatus>('IDLE');
  const [detectionInfo, setDetectionInfo] = useState<DetectionInfo | null>(null);
  const [postFallSecondsLeft, setPostFallSecondsLeft] = useState(0);
  const [fallStartTime, setFallStartTime] = useState<number | null>(null);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    awaitingReview: 0,
    confirmedIncidents: 0,
    falseAlarms: 0,
    unableToConfirm: 0,
    resolved: 0,
    truePositives: 0,
    falsePositives: 0,
  });
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [facingMode, setFacingModeState] = useState<FacingMode>('user');
  const facingModeRef = useRef<FacingMode>('user');

  const setFacingMode = useCallback((mode: FacingMode) => {
    facingModeRef.current = mode;
    setFacingModeState(mode);
  }, []);

  // Sync client storage after initial hydration to prevent SSR mismatch
  useEffect(() => {
    const loaded = loadIncidents();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIncidents(loaded);
    setStats(computeStats(loaded));
  }, []);

  // Refs untuk loop state
  const statusRef = useRef<SystemStatus>('IDLE');
  const frameCountRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPosesRef = useRef<PoseEstimate[]>([]);
  const detectionLoopRef = useRef<() => void>(() => {});

  // Temporal context untuk fall detection
  const prevPoseRef = useRef<PoseEstimate | null>(null);
  const prevMetricsRef = useRef<TemporalContext>({
    prevSnapshot: null,
    prevTimestamp: 0,
    frameHeight: CONFIG.CAMERA_HEIGHT,
  });

  // Post-fall state
  const fallStartRef = useRef<number | null>(null);
  const currentIncidentIdRef = useRef<string | null>(null);
  const bodyAngleAtDetectionRef = useRef<number>(0);
  const confidenceAtDetectionRef = useRef<number>(0);
  const postFallMovementsRef = useRef<ReturnType<typeof detectMovement>[]>([]);
  const postFallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshIncidents = useCallback(() => {
    const loaded = loadIncidents();
    setIncidents(loaded);
    setStats(computeStats(loaded));
  }, []);

  const transition = useCallback((next: SystemStatus): boolean => {
    const current = statusRef.current;
    if (!canTransition(current, next)) return false;
    statusRef.current = next;
    setStatus(next);
    return true;
  }, []);

  const stopPostFallTimer = useCallback(() => {
    if (postFallTimerRef.current !== null) {
      clearInterval(postFallTimerRef.current);
      postFallTimerRef.current = null;
    }
  }, []);

  const handleFallDetected = useCallback(
    (bodyAngle: number, confidence: number) => {
      if (!canTransition(statusRef.current, 'FALL_DETECTED')) return;

      const now = Date.now();
      fallStartRef.current = now;
      setFallStartTime(now);
      postFallMovementsRef.current = [];

      bodyAngleAtDetectionRef.current = bodyAngle;
      confidenceAtDetectionRef.current = confidence;

      // Buat incident baru dengan status awaiting_review
      const incidentId = generateIncidentId();
      currentIncidentIdRef.current = incidentId;

      statusRef.current = 'FALL_DETECTED';
      setStatus('FALL_DETECTED');

      // Transisi ke post-fall monitoring setelah jeda singkat
      setTimeout(() => {
        if (statusRef.current !== 'FALL_DETECTED') return;
        statusRef.current = 'POST_FALL_MONITORING';
        setStatus('POST_FALL_MONITORING');

        let secondsLeft = CONFIG.POST_FALL_DURATION / 1000;
        setPostFallSecondsLeft(secondsLeft);

        stopPostFallTimer();
        postFallTimerRef.current = setInterval(() => {
          secondsLeft -= 1;
          setPostFallSecondsLeft(secondsLeft);

          if (secondsLeft <= 0) {
            stopPostFallTimer();

            const hasRecovered = evaluatePostFallCondition(postFallMovementsRef.current);
            const duration = Math.round(
              (Date.now() - (fallStartRef.current ?? Date.now())) / 1000
            );

            const algorithmResult: AlgorithmResult = hasRecovered
              ? 'movement_detected'
              : 'no_significant_movement';

            // Simpan insiden ke storage
            const incRecord: IncidentRecord = {
              id: currentIncidentIdRef.current ?? generateIncidentId(),
              detectedAt: fallStartRef.current ?? Date.now(),
              resolvedAt: null,
              algorithmResult,
              verificationDuration: duration,
              bodyAngleAtDetection: bodyAngleAtDetectionRef.current,
              confidenceAtDetection: confidenceAtDetectionRef.current,
              caregiverStatus: 'awaiting_review',
              caregiverVerdict: null,
              caregiverNote: '',
              caregiverAction: '',
              reviewedAt: null,
            };

            const updated = saveIncident(incRecord);
            setIncidents(updated);
            setStats(computeStats(updated));

            if (hasRecovered) {
              statusRef.current = 'RECOVERED';
              setStatus('RECOVERED');

              setTimeout(() => {
                if (statusRef.current === 'RECOVERED') {
                  statusRef.current = 'MONITORING';
                  setStatus('MONITORING');
                }
              }, 3000);
            } else {
              statusRef.current = 'EMERGENCY';
              setStatus('EMERGENCY');
              alarm?.play();
            }
          }
        }, 1000);
      }, 800);
    },
    [stopPostFallTimer]
  );

  // ---- Loop Deteksi Utama ----
  const detectionLoop = useCallback(() => {
    const video = videoElRef.current;
    if (!video || statusRef.current === 'IDLE') return;

    frameCountRef.current += 1;
    const vw = video.videoWidth || CONFIG.CAMERA_WIDTH;
    const vh = video.videoHeight || CONFIG.CAMERA_HEIGHT;
    const currentStatus = statusRef.current;
    const isFrontCamera = facingModeRef.current === 'user';

    if (frameCountRef.current % CONFIG.DETECTION_FRAME_INTERVAL === 0) {
      (async () => {
        // estimatePoses: returns array of all visible persons
        const poses = await estimatePoses(video);
        lastPosesRef.current = poses;

        if (poses.length === 0) {
          prevPoseRef.current = null;
          prevMetricsRef.current.prevSnapshot = null;

          // Gambar video frame ke canvas
          if (canvasRef.current && video) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              drawPoses(ctx, [], currentStatus, vw, vh, video, isFrontCamera);
            }
          }

          rafIdRef.current = requestAnimationFrame(() => {
            detectionLoopRef.current();
          });
          return;
        }

        // Gambar frame video + SEMUA poses ke canvas (multi-person)
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            drawPoses(ctx, poses, currentStatus, vw, vh, video, isFrontCamera);
          }
        }

        // Gunakan pose dengan confidence tertinggi untuk fall detection
        const primaryPose = poses.reduce((best, p) => (p.score > best.score ? p : best));

        if (currentStatus === 'MONITORING') {
          const { analysis, snapshot } = detectFall(primaryPose, prevMetricsRef.current);

          // Hitung pergerakan live secara dinamis
          const liveMovement = prevPoseRef.current
            ? detectMovement(primaryPose, prevPoseRef.current, vw, vh)
            : { hasMovement: false, movementScore: 0, keypointDelta: 0 };

          setDetectionInfo({
            bodyAngle: analysis.bodyAngle,
            movementScore: liveMovement.movementScore,
            confidence: analysis.confidence,
            keypointsDetected: poses.reduce(
              (sum, p) => sum + p.keypoints.filter((k) => k.score >= 0.15).length,
              0
            ),
          });

          prevMetricsRef.current = {
            prevSnapshot: snapshot,
            prevTimestamp: primaryPose.timestamp,
            frameHeight: vh,
          };

          if (analysis.isFall) {
            handleFallDetected(analysis.bodyAngle, analysis.confidence);
          }
        } else if (currentStatus === 'POST_FALL_MONITORING') {
          if (prevPoseRef.current) {
            const movement = detectMovement(
              primaryPose,
              prevPoseRef.current,
              vw,
              vh
            );
            postFallMovementsRef.current.push(movement);

            setDetectionInfo((prev) => ({
              bodyAngle: prev?.bodyAngle ?? 0,
              movementScore: movement.movementScore,
              confidence: prev?.confidence ?? 0,
              keypointsDetected: poses.reduce(
                (sum, p) => sum + p.keypoints.filter((k) => k.score >= 0.15).length,
                0
              ),
            }));
          }
        }

        prevPoseRef.current = primaryPose;
        rafIdRef.current = requestAnimationFrame(() => {
          detectionLoopRef.current();
        });
      })();
    } else {
      // Frame antara: render video + posisi skeleton terakhir (tidak dihapus) agar visual halus dan tidak kedip
      if (canvasRef.current && video && video.readyState >= 2) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawPoses(ctx, lastPosesRef.current, currentStatus, vw, vh, video, isFrontCamera);
        }
      }
      rafIdRef.current = requestAnimationFrame(() => {
        detectionLoopRef.current();
      });
    }
  }, [handleFallDetected]);

  useEffect(() => {
    detectionLoopRef.current = detectionLoop;
  }, [detectionLoop]);

  const startDetection = useCallback(
    async (videoEl: HTMLVideoElement, mode?: FacingMode) => {
      if (mode) {
        facingModeRef.current = mode;
        setFacingModeState(mode);
      }
      videoElRef.current = videoEl;
      frameCountRef.current = 0;

      alarm?.init();

      setIsModelLoading(true);
      const loaded = await loadPoseDetector();
      setIsModelLoading(false);

      if (!loaded) {
        console.warn('[FALLORA] Model tidak termuat — deteksi tidak tersedia');
      }

      statusRef.current = 'MONITORING';
      setStatus('MONITORING');

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        detectionLoopRef.current();
      });
    },
    []
  );

  const stopDetection = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    stopPostFallTimer();
    alarm?.stop();

    statusRef.current = 'IDLE';
    setStatus('IDLE');
    setDetectionInfo(null);
    setPostFallSecondsLeft(0);
    setFallStartTime(null);
    prevPoseRef.current = null;
    postFallMovementsRef.current = [];
    fallStartRef.current = null;
    videoElRef.current = null;
    currentIncidentIdRef.current = null;
    lastPosesRef.current = [];

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [stopPostFallTimer]);

  const resetStatus = useCallback(() => {
    stopPostFallTimer();
    alarm?.stop();
    statusRef.current = 'IDLE';
    setStatus('IDLE');
    setDetectionInfo(null);
    setPostFallSecondsLeft(0);
    setFallStartTime(null);
  }, [stopPostFallTimer]);

  const updateIncident = useCallback(
    (
      id: string,
      caregiverStatus: CaregiverStatus,
      verdict?: CaregiverVerdict | null,
      note?: string,
      action?: string
    ) => {
      const now = Date.now();
      const resolvedAt =
        caregiverStatus === 'resolved' ||
        caregiverStatus === 'confirmed_incident' ||
        caregiverStatus === 'false_alarm'
          ? now
          : null;

      const updated = updateIncidentCaregiverStatus(id, {
        caregiverStatus,
        caregiverVerdict: verdict,
        caregiverNote: note,
        caregiverAction: action,
        reviewedAt: caregiverStatus === 'under_review' ? now : undefined,
        resolvedAt,
      });
      setIncidents(updated);
      setStats(computeStats(updated));
    },
    []
  );

  const clearIncidents = useCallback(() => {
    import('@/lib/storage').then(({ clearAllIncidents }) => {
      clearAllIncidents();
      refreshIncidents();
    });
  }, [refreshIncidents]);

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      stopPostFallTimer();
      disposePoseDetector();
    };
  }, [stopPostFallTimer]);

  return {
    canvasRef,
    status,
    detectionInfo,
    postFallSecondsLeft,
    fallStartTime,
    incidents,
    stats,
    isModelLoading,
    facingMode,
    setFacingMode,
    transition,
    startDetection,
    stopDetection,
    resetStatus,
    updateIncident,
    clearIncidents,
  };
}
