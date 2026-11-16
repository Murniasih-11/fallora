// ============================================================
// FALLORA — Movement Detection Module
// Used during post-fall monitoring to determine if the person
// has moved (RECOVERED) or remains still (EMERGENCY).
// ============================================================

import { PoseEstimate, MovementAnalysis, Keypoint } from '@/types';
import { CONFIG } from '@/lib/config';

function getKeypointMap(keypoints: Keypoint[]): Map<string, Keypoint> {
  const map = new Map<string, Keypoint>();
  for (const kp of keypoints) {
    if (kp.score >= CONFIG.MIN_KEYPOINT_SCORE) {
      map.set(kp.name, kp);
    }
  }
  return map;
}

/**
 * Computes the average normalised displacement of shared keypoints
 * between two pose estimates. Returns a MovementAnalysis.
 */
export function detectMovement(
  current: PoseEstimate,
  previous: PoseEstimate,
  frameWidth: number,
  frameHeight: number
): MovementAnalysis {
  const currMap = getKeypointMap(current.keypoints);
  const prevMap = getKeypointMap(previous.keypoints);

  const deltas: number[] = [];

  for (const [name, curr] of currMap) {
    const prev = prevMap.get(name);
    if (!prev) continue;

    // Normalise displacement by frame dimensions
    const dx = (curr.x - prev.x) / frameWidth;
    const dy = (curr.y - prev.y) / frameHeight;
    deltas.push(Math.sqrt(dx * dx + dy * dy));
  }

  if (deltas.length === 0) {
    return { hasMovement: false, movementScore: 0, keypointDelta: 0 };
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const movementScore = Math.min(avgDelta / CONFIG.MOVEMENT_THRESHOLD, 1);
  const hasMovement = avgDelta >= CONFIG.MOVEMENT_THRESHOLD;

  return {
    hasMovement,
    movementScore,
    keypointDelta: avgDelta,
  };
}

/**
 * Evaluates a window of recent MovementAnalysis results.
 * Returns true if the person has shown meaningful movement.
 */
export function evaluatePostFallCondition(
  movementHistory: MovementAnalysis[]
): boolean {
  if (movementHistory.length === 0) return false;

  const window = movementHistory.slice(-CONFIG.MOVEMENT_WINDOW_FRAMES);
  const movingFrames = window.filter((m) => m.hasMovement).length;

  // Person is considered recovered if at least 2 of the last 8 frames show movement
  return movingFrames >= 2;
}
