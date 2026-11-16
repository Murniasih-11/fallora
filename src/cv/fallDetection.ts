// ============================================================
// FALLORA — Fall Detection Module
// Analyses pose estimates to determine if a fall occurred.
// Does NOT declare a fall just because someone is lying down.
// Requires a combination of: rapid velocity, horizontal angle,
// low body centre, and high confidence.
// ============================================================

import { PoseEstimate, FallAnalysis, Keypoint } from '@/types';
import { CONFIG } from '@/lib/config';
import { getConfidentKeypoints, BODY_KEYPOINTS } from './poseEstimation';

interface BodyMetrics {
  centerX: number;
  centerY: number;      // normalised 0–1 (0 = top of frame)
  shoulderMidY: number;
  hipMidY: number;
  bodyAngle: number;    // degrees from vertical (0 = upright, 90 = horizontal)
  valid: boolean;
}

// Exported so the hook can store it as temporal context
export interface BodyMetricsSnapshot {
  centerY: number;
  valid: boolean;
}

function getKeypointByName(kps: Keypoint[], name: string): Keypoint | undefined {
  return kps.find((k) => k.name === name && k.score >= CONFIG.MIN_KEYPOINT_SCORE);
}

function computeBodyMetrics(
  keypoints: Keypoint[],
  frameHeight: number
): BodyMetrics {
  const confident = getConfidentKeypoints(keypoints);
  const bodyKps = confident.filter((k) =>
    (BODY_KEYPOINTS as readonly string[]).includes(k.name)
  );

  if (bodyKps.length < 4) {
    return { centerX: 0, centerY: 0, shoulderMidY: 0, hipMidY: 0, bodyAngle: 0, valid: false };
  }

  const xs = bodyKps.map((k) => k.x);
  const ys = bodyKps.map((k) => k.y);
  const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;

  const lShoulder = getKeypointByName(keypoints, 'left_shoulder');
  const rShoulder = getKeypointByName(keypoints, 'right_shoulder');
  const lHip = getKeypointByName(keypoints, 'left_hip');
  const rHip = getKeypointByName(keypoints, 'right_hip');

  if (!lShoulder || !rShoulder || !lHip || !rHip) {
    return { centerX, centerY: centerY / frameHeight, shoulderMidY: 0, hipMidY: 0, bodyAngle: 0, valid: false };
  }

  const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
  const shoulderMidY = (lShoulder.y + rShoulder.y) / 2;
  const hipMidX = (lHip.x + rHip.x) / 2;
  const hipMidY = (lHip.y + rHip.y) / 2;

  const dx = hipMidX - shoulderMidX;
  const dy = hipMidY - shoulderMidY;
  // Angle of torso from vertical (0° = perfectly upright, 90° = lying flat)
  const angle = Math.abs(Math.atan2(Math.abs(dx), Math.abs(dy)) * (180 / Math.PI));

  return {
    centerX,
    centerY: centerY / frameHeight,
    shoulderMidY: shoulderMidY / frameHeight,
    hipMidY: hipMidY / frameHeight,
    bodyAngle: angle,
    valid: true,
  };
}

export interface TemporalContext {
  prevSnapshot: BodyMetricsSnapshot | null;
  prevTimestamp: number;
  frameHeight: number;
}

/**
 * Analyses a pose estimate for fall indicators.
 * Returns both the FallAnalysis and the current BodyMetricsSnapshot
 * so the caller can store it as temporal context for the next frame.
 */
export function detectFall(
  current: PoseEstimate,
  context: TemporalContext
): { analysis: FallAnalysis; snapshot: BodyMetricsSnapshot } {
  const metrics = computeBodyMetrics(current.keypoints, context.frameHeight);

  const emptyAnalysis: FallAnalysis = {
    isFall: false, confidence: 0, bodyAngle: 0, centerY: 0, velocityY: 0, isHorizontal: false,
  };

  if (!metrics.valid) {
    return { analysis: emptyAnalysis, snapshot: { centerY: 0, valid: false } };
  }

  // --- Individual signals ---
  const isHorizontal = metrics.bodyAngle > CONFIG.BODY_ANGLE_THRESHOLD;
  const isLow = metrics.centerY > CONFIG.LOW_CENTER_THRESHOLD;

  // Velocity: how fast did the body centre move downward since last frame?
  let velocityY = 0;
  if (context.prevSnapshot?.valid) {
    const dt = Math.max((current.timestamp - context.prevTimestamp) / 1000, 0.001);
    velocityY = ((metrics.centerY - context.prevSnapshot.centerY) / dt) * context.frameHeight;
  }
  const hasVelocitySpike = velocityY > CONFIG.VELOCITY_Y_THRESHOLD;

  // --- Weighted confidence score ---
  let score = 0;
  if (isHorizontal) score += 0.40;
  if (isLow) score += 0.25;
  if (hasVelocitySpike) score += 0.35;

  // Angle bonus — sharper angle → higher confidence
  const angleFactor = Math.min((metrics.bodyAngle - CONFIG.BODY_ANGLE_THRESHOLD) / 30, 1);
  if (isHorizontal) score = score * (1 + angleFactor * 0.2);

  const isFall = score >= CONFIG.FALL_CONFIDENCE_THRESHOLD;

  return {
    analysis: {
      isFall,
      confidence: Math.min(score, 1),
      bodyAngle: metrics.bodyAngle,
      centerY: metrics.centerY,
      velocityY,
      isHorizontal,
    },
    snapshot: { centerY: metrics.centerY, valid: true },
  };
}
