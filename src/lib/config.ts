// ============================================================
// FALLORA — Central Configuration
// All detection thresholds in one place — easy to tune.
// ============================================================

export const CONFIG = {
  // Camera
  CAMERA_WIDTH: 640,
  CAMERA_HEIGHT: 480,
  CAMERA_FPS: 30,

  // Frame sampling — process every N-th frame for CV
  DETECTION_FRAME_INTERVAL: 6,   // ~5 fps inference at 30 fps camera

  // Pose estimation (TensorFlow MoveNet)
  MIN_POSE_SCORE: 0.25,          // minimum overall pose confidence
  MIN_KEYPOINT_SCORE: 0.3,       // minimum per-keypoint confidence

  // Fall detection thresholds
  FALL_CONFIDENCE_THRESHOLD: 0.65,
  BODY_ANGLE_THRESHOLD: 55,      // degrees from vertical → likely horizontal
  VELOCITY_Y_THRESHOLD: 18,      // px/frame downward velocity spike
  LOW_CENTER_THRESHOLD: 0.72,    // normalised Y: body centre near bottom of frame

  // Movement detection (post-fall monitoring)
  MOVEMENT_THRESHOLD: 0.04,      // normalised keypoint displacement to count as movement
  MOVEMENT_WINDOW_FRAMES: 8,     // frames to average for movement decision

  // Post-fall monitoring
  POST_FALL_DURATION: 5000,      // ms before declaring EMERGENCY

  // History
  MAX_HISTORY_RECORDS: 50,

  // Temporal analysis
  POSE_HISTORY_LENGTH: 10,       // number of recent poses to keep
} as const;

export type Config = typeof CONFIG;
