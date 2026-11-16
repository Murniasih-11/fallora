// ============================================================
// FALLORA — Pose Estimation Module
// Primary: MoveNet MultiPose Lightning (deteksi hingga 6 orang)
// Fallback: MoveNet SinglePose Lightning (1 orang, lebih ringan)
//
// Semua orang yang terlihat di kamera akan dideteksi (MultiPose).
// Fall detection menggunakan pose dengan confidence tertinggi.
// ============================================================

import { Keypoint, PoseEstimate } from '@/types';
import { CONFIG } from '@/lib/config';

const MOVENET_KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

// URL Model
const MULTIPOSE_URL  = 'https://tfhub.dev/google/tfjs-model/movenet/multipose/lightning/1';
const SINGLEPOSE_URL = 'https://tfhub.dev/google/tfjs-model/movenet/singlepose/lightning/4';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let model: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tf: any = null;
let isLoading  = false;
let isLoaded   = false;
let isMultiPose = false; // apakah model yang ter-load adalah MultiPose

export async function loadPoseDetector(): Promise<boolean> {
  if (isLoaded) return true;
  if (isLoading) return false;
  isLoading = true;

  try {
    tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.ready();
    await tf.setBackend('webgl');

    // Coba load MultiPose dulu
    try {
      console.info('[FALLORA] Mencoba memuat MoveNet MultiPose Lightning…');
      model = await tf.loadGraphModel(MULTIPOSE_URL, { fromTFHub: true });

      // Warm-up: MultiPose butuh minimal 256×256
      const dummy = tf.zeros([1, 256, 256, 3], 'int32');
      const out = await model.predict(dummy);
      dummy.dispose();
      if (out && typeof out.dispose === 'function') out.dispose();

      isMultiPose = true;
      console.info('[FALLORA] MoveNet MultiPose Lightning berhasil dimuat ✓');
    } catch (multiErr) {
      console.warn('[FALLORA] MultiPose gagal, beralih ke SinglePose:', multiErr);
      model = await tf.loadGraphModel(SINGLEPOSE_URL, { fromTFHub: true });

      // Warm-up: SinglePose butuh 192×192
      const dummy = tf.zeros([1, 192, 192, 3], 'int32');
      const out = await model.predict(dummy);
      dummy.dispose();
      if (out && typeof out.dispose === 'function') out.dispose();

      isMultiPose = false;
      console.info('[FALLORA] MoveNet SinglePose Lightning berhasil dimuat ✓ (fallback)');
    }

    isLoaded  = true;
    isLoading = false;
    return true;
  } catch (err) {
    console.error('[FALLORA] Semua model gagal dimuat:', err);
    isLoading = false;
    return false;
  }
}

export function isDetectorReady(): boolean {
  return isLoaded && model !== null;
}

// ---- Internal parsers ----

function parseMultiPose(
  data: Float32Array,
  vw: number,
  vh: number
): PoseEstimate[] {
  // Output: [1, 6, 56]
  // 56 = 17 kp × 3 (y, x, score) + 5 (bbox: top, left, bottom, right, score)
  const poses: PoseEstimate[] = [];
  const numPersons = 6;
  const valuesPerPerson = 56;

  for (let p = 0; p < numPersons; p++) {
    const base = p * valuesPerPerson;
    const personScore = data[base + 55] || 0; // bbox score

    const keypoints: Keypoint[] = [];
    let confidentCount = 0;
    let confidentSum = 0;

    for (let i = 0; i < 17; i++) {
      const y     = data[base + i * 3 + 0]; // normalised 0–1
      const x     = data[base + i * 3 + 1]; // normalised 0–1
      const score = data[base + i * 3 + 2];

      keypoints.push({
        x: x * vw,
        y: y * vh,
        score,
        name: MOVENET_KEYPOINT_NAMES[i],
      });

      if (score >= 0.15) {
        confidentCount++;
        confidentSum += score;
      }
    }

    // Deteksi valid jika ada minimal 3 keypoint terdeteksi dengan baik
    // atau personScore di atas threshold dasar (memungkinkan deteksi sebagian tubuh seperti kepala/bahu saat duduk)
    if (confidentCount < 3 && personScore < 0.2) continue;

    const overallScore = confidentCount > 0
      ? confidentSum / confidentCount
      : Math.max(personScore, 0.2);

    poses.push({ keypoints, score: overallScore, timestamp: Date.now() });
  }

  // Urutkan berdasarkan skor tertinggi
  poses.sort((a, b) => b.score - a.score);
  return poses;
}

function parseSinglePose(
  data: Float32Array,
  vw: number,
  vh: number
): PoseEstimate[] {
  // Output: [1, 1, 17, 3]
  const keypoints: Keypoint[] = [];
  let confidentCount = 0;
  let confidentSum = 0;

  for (let i = 0; i < 17; i++) {
    const y     = data[i * 3 + 0];
    const x     = data[i * 3 + 1];
    const score = data[i * 3 + 2];

    keypoints.push({ x: x * vw, y: y * vh, score, name: MOVENET_KEYPOINT_NAMES[i] });

    if (score >= 0.15) {
      confidentCount++;
      confidentSum += score;
    }
  }

  // Jika minimal 3 titik terdeteksi (misal kepala + 2 bahu), subjek valid
  if (confidentCount < 3) return [];

  const overallScore = confidentSum / confidentCount;
  return [{ keypoints, score: overallScore, timestamp: Date.now() }];
}

// ---- Public API ----

/**
 * Deteksi semua orang yang terlihat di kamera.
 * Mengembalikan array PoseEstimate (1 per orang terdeteksi).
 */
export async function estimatePoses(
  videoElement: HTMLVideoElement
): Promise<PoseEstimate[]> {
  if (!model || !tf || !videoElement) return [];
  if (videoElement.readyState < 2) return [];

  const vw = videoElement.videoWidth  || CONFIG.CAMERA_WIDTH;
  const vh = videoElement.videoHeight || CONFIG.CAMERA_HEIGHT;

  let input:  unknown = null;
  let result: unknown = null;

  try {
    if (isMultiPose) {
      // MultiPose: input 256×256
      input = tf.tidy(() => {
        const img     = tf.browser.fromPixels(videoElement);
        const resized = tf.image.resizeBilinear(img, [256, 256]);
        return tf.cast(tf.expandDims(resized, 0), 'int32');
      });
    } else {
      // SinglePose: input 192×192
      input = tf.tidy(() => {
        const img     = tf.browser.fromPixels(videoElement);
        const resized = tf.image.resizeBilinear(img, [192, 192]);
        return tf.cast(tf.expandDims(resized, 0), 'int32');
      });
    }

    result = await model.predict(input as Parameters<typeof model.predict>[0]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Float32Array = await (result as any).data();

    return isMultiPose
      ? parseMultiPose(data, vw, vh)
      : parseSinglePose(data, vw, vh);

  } catch (err) {
    console.error('[FALLORA] Pose estimation error:', err);
    return [];
  } finally {
    if (input  && typeof (input  as { dispose?: () => void }).dispose === 'function')
      (input  as { dispose: () => void }).dispose();
    if (result && typeof (result as { dispose?: () => void }).dispose === 'function')
      (result as { dispose: () => void }).dispose();
  }
}

/**
 * Convenience wrapper — kembalikan pose tunggal dengan confidence tertinggi.
 * Dipakai oleh fallDetection.ts (backward compat).
 */
export async function estimatePose(
  videoElement: HTMLVideoElement
): Promise<PoseEstimate | null> {
  const poses = await estimatePoses(videoElement);
  if (poses.length === 0) return null;
  return poses.reduce((best, p) => (p.score > best.score ? p : best));
}

export function disposePoseDetector(): void {
  if (model) {
    try { model.dispose(); } catch { /* ignore */ }
    model = null;
  }
  isLoaded   = false;
  isLoading  = false;
  isMultiPose = false;
}

// ---- Helpers ----

export function getConfidentKeypoints(keypoints: Keypoint[]): Keypoint[] {
  return keypoints.filter((kp) => kp.score >= CONFIG.MIN_KEYPOINT_SCORE);
}

export const BODY_KEYPOINTS = [
  'left_shoulder', 'right_shoulder',
  'left_hip',      'right_hip',
  'left_knee',     'right_knee',
  'left_ankle',    'right_ankle',
] as const;
