// ============================================================
// FALLORA — Drawing Utilities
// Renders pose keypoints and skeleton overlay on canvas.
// Supports multi-person — draws each person with a unique color.
// Canvas MUST be positioned absolutely over the video element
// and MUST remain transparent (clearRect only, no fillRect background).
// ============================================================

import { PoseEstimate, SystemStatus } from '@/types';

// Skeleton bone pairs (keypoint name connections)
const SKELETON_PAIRS: [string, string][] = [
  ['nose', 'left_eye'], ['nose', 'right_eye'],
  ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle'],
];

// Colors per person index (for multi-person display)
// Status-driven color overrides these for the "primary" (most at-risk) person
const PERSON_COLORS = [
  '#16A34A', // green   — person 0
  '#3B82F6', // blue    — person 1
  '#F59E0B', // amber   — person 2
  '#8B5CF6', // purple  — person 3
  '#EC4899', // pink    — person 4
  '#14B8A6', // teal    — person 5
];

function getStatusColor(status: SystemStatus): string {
  if (status === 'FALL_DETECTED' || status === 'POST_FALL_MONITORING') return '#D97706';
  if (status === 'EMERGENCY') return '#DC2626';
  if (status === 'RECOVERED') return '#16A34A';
  return '#16A34A';
}

function drawSinglePose(
  ctx: CanvasRenderingContext2D,
  pose: PoseEstimate,
  color: string,
  scaleX: number,
  scaleY: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Build a map for quick keypoint lookup
  const kpMap = new Map<string, { x: number; y: number; score: number }>();
  for (const kp of pose.keypoints) {
    kpMap.set(kp.name, kp);
  }

  // Draw skeleton lines (min score 0.15 agar terlihat stabil)
  const MIN_SCORE = 0.15;

  for (const [p1Name, p2Name] of SKELETON_PAIRS) {
    const p1 = kpMap.get(p1Name);
    const p2 = kpMap.get(p2Name);

    if (
      p1 && p2 &&
      p1.score >= MIN_SCORE &&
      p2.score >= MIN_SCORE
    ) {
      ctx.globalAlpha = Math.min(Math.max(p1.score, p2.score) * 1.2, 1);
      ctx.beginPath();
      ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
      ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
      ctx.stroke();
    }
  }

  // Draw keypoint dots
  ctx.globalAlpha = 1;
  for (const kp of pose.keypoints) {
    if (kp.score >= MIN_SCORE) {
      // Titik luar putih (halo) agar kontras di segala background
      ctx.beginPath();
      ctx.arc(kp.x * scaleX, kp.y * scaleY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Titik inti warna person/status
      ctx.beginPath();
      ctx.arc(kp.x * scaleX, kp.y * scaleY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

/**
 * Draws video frame + all detected persons on the canvas.
 * Transformasi mirror (kamera selfie) diterapkan secara seragam pada video DAN skeleton
 * sehingga titik kunci dan garis tubuh 100% sejajar dan tepat di atas tubuh manusia.
 */
export function drawPoses(
  ctx: CanvasRenderingContext2D,
  poses: PoseEstimate[],
  status: SystemStatus,
  videoWidth: number,
  videoHeight: number,
  videoEl?: HTMLVideoElement,
  mirror: boolean = true
) {
  // Samakan resolusi buffer canvas dengan resolusi asli video kamera
  // Ini mencegah distorsi / gambar penyok (squashing)
  if (videoWidth > 0 && videoHeight > 0) {
    if (ctx.canvas.width !== videoWidth || ctx.canvas.height !== videoHeight) {
      ctx.canvas.width = videoWidth;
      ctx.canvas.height = videoHeight;
    }
  }

  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;

  // Bersihkan canvas
  ctx.clearRect(0, 0, cw, ch);

  // Terapkan mirror horizontal secara seragam (selfie mode) untuk VIDEO dan SKELETON jika kamera depan
  ctx.save();
  if (mirror) {
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
  }

  // 1. Gambar frame video
  if (videoEl && videoEl.readyState >= 2) {
    ctx.drawImage(videoEl, 0, 0, cw, ch);
  }

  // 2. Gambar skeleton overlay tepat di atas video (dalam ruang koordinat yang sama)
  if (poses && poses.length > 0) {
    const scaleX = cw / videoWidth;
    const scaleY = ch / videoHeight;
    const statusColor = getStatusColor(status);

    for (let i = 0; i < poses.length; i++) {
      const isAlertState =
        status === 'FALL_DETECTED' ||
        status === 'POST_FALL_MONITORING' ||
        status === 'EMERGENCY';

      const color = (i === 0 && isAlertState)
        ? statusColor
        : PERSON_COLORS[i % PERSON_COLORS.length];

      drawSinglePose(ctx, poses[i], color, scaleX, scaleY);
    }
  }

  ctx.restore();
}

/**
 * Backward-compat wrapper for single-pose drawing.
 * Delegates to drawPoses with a single-element array.
 */
export function drawPose(
  ctx: CanvasRenderingContext2D,
  pose: PoseEstimate,
  status: SystemStatus,
  videoWidth: number,
  videoHeight: number
) {
  drawPoses(ctx, [pose], status, videoWidth, videoHeight);
}
