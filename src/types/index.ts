// ============================================================
// FALLORA — Type Definitions
// Fall Detection & Post-Fall Incident Monitoring System
// ============================================================

// ---- System State Machine ----

export type SystemStatus =
  | 'IDLE'
  | 'MONITORING'
  | 'FALL_DETECTED'
  | 'POST_FALL_MONITORING'
  | 'RECOVERED'
  | 'EMERGENCY';

export type CameraStatus = 'disconnected' | 'connecting' | 'active' | 'error';
export type FacingMode = 'user' | 'environment';

// ---- Computer Vision Types ----

export interface Keypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

export interface PoseEstimate {
  keypoints: Keypoint[];
  score: number;
  timestamp: number;
}

export interface FallAnalysis {
  isFall: boolean;
  confidence: number;
  bodyAngle: number;        // degrees from vertical
  centerY: number;          // normalized 0–1
  velocityY: number;        // pixels/frame downward
  isHorizontal: boolean;
}

export interface MovementAnalysis {
  hasMovement: boolean;
  movementScore: number;    // 0–1
  keypointDelta: number;    // average keypoint displacement
}

export interface DetectionInfo {
  bodyAngle: number;
  movementScore: number;
  confidence: number;
  keypointsDetected: number;
}

// ---- Incident Management ----

/**
 * Status hasil algoritma deteksi — terpisah dari status penanganan manusia.
 * Ini adalah hasil observasi sistem, bukan diagnosis medis.
 */
export type AlgorithmResult =
  | 'fall_indication'       // indikasi jatuh terdeteksi
  | 'movement_detected'     // pergerakan terdeteksi setelah indikasi
  | 'no_significant_movement' // tidak ada pergerakan signifikan selama observasi
  | 'unable_to_verify';     // kondisi tidak dapat diverifikasi

/**
 * Status penanganan insiden oleh pengasuh.
 * Dipisahkan dari hasil algoritma.
 */
export type CaregiverStatus =
  | 'awaiting_review'       // menunggu pemeriksaan pengasuh
  | 'under_review'          // sedang diperiksa
  | 'confirmed_incident'    // kejadian jatuh terkonfirmasi oleh pengasuh
  | 'false_alarm'           // bukan kejadian jatuh menurut pengasuh
  | 'unable_to_confirm'     // pengasuh tidak dapat memastikan
  | 'resolved';             // selesai ditangani

/**
 * Hasil pemeriksaan pengasuh — input dari manusia.
 */
export type CaregiverVerdict =
  | 'confirmed_fall'        // kejadian jatuh terkonfirmasi
  | 'no_fall'               // tidak terjadi jatuh
  | 'uncertain';            // belum dapat dipastikan

/**
 * Rekam insiden lengkap.
 * Menggabungkan hasil algoritma dengan status penanganan manusia.
 */
export interface IncidentRecord {
  id: string;
  detectedAt: number;           // timestamp saat indikasi jatuh terdeteksi
  resolvedAt: number | null;    // timestamp saat insiden diselesaikan

  // Hasil observasi algoritma
  algorithmResult: AlgorithmResult;
  verificationDuration: number; // durasi observasi (detik)
  bodyAngleAtDetection: number; // sudut tubuh saat terdeteksi
  confidenceAtDetection: number; // confidence score saat terdeteksi

  // Status penanganan oleh pengasuh
  caregiverStatus: CaregiverStatus;
  caregiverVerdict: CaregiverVerdict | null;
  caregiverNote: string;
  caregiverAction: string;      // tindakan yang dilakukan pengasuh
  reviewedAt: number | null;    // timestamp saat pengasuh mulai memeriksa
}

// ---- Legacy type (untuk kompatibilitas mundur) ----
// Dapat dihapus setelah migrasi penuh ke IncidentRecord
export interface EventRecord {
  id: string;
  timestamp: number;
  type: 'fall_detected' | 'recovered' | 'emergency';
  duration: number;
  status: 'Recovered' | 'Emergency' | 'Ongoing';
  // Extended fields untuk incident management
  incidentId?: string;
}

// ---- Camera Health ----

export interface CameraHealth {
  isConnected: boolean;
  lastFrameAt: number | null;    // timestamp frame terakhir diterima
  framesPerSecond: number;
  isDark: boolean;               // frame terlalu gelap
  isFrozen: boolean;             // gambar tidak berubah
  frozenSince: number | null;    // timestamp saat freeze mulai
}

// ---- Statistics ----

export interface IncidentStats {
  total: number;
  awaitingReview: number;
  confirmedIncidents: number;
  falseAlarms: number;
  unableToConfirm: number;
  resolved: number;
  // Evaluasi akurasi (hanya dihitung dari data yang tersedia)
  truePositives: number;         // confirmed_incident
  falsePositives: number;        // false_alarm
  // Note: True Negative & False Negative tidak dapat dihitung tanpa ground truth
}
