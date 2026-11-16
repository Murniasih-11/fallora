# FALLORA
**Fall Detection & Post-Fall Incident Monitoring System**

> Sistem pemantauan potensi jatuh berbasis Computer Vision untuk mendukung keselamatan lansia di lingkungan panti jompo.

---

## Latar Belakang

Kejadian jatuh pada lansia merupakan salah satu risiko keselamatan yang paling umum di lingkungan panti jompo. Tanpa sistem deteksi otomatis, pengasuh bergantung sepenuhnya pada pengawasan manual yang tidak dapat dilakukan secara terus-menerus.

**Permasalahan yang diangkat:**

1. Potensi kejadian jatuh dapat tidak segera diketahui pengasuh.
2. Deteksi otomatis belum tentu selalu sesuai dengan kondisi sebenarnya.
3. Peringatan yang dihasilkan sistem membutuhkan verifikasi oleh manusia.
4. Pengelola membutuhkan riwayat insiden dan catatan tindak lanjut yang terstruktur.
5. Gangguan kamera dapat menyebabkan area tidak terpantau tanpa disadari.

---

## Deskripsi Sistem

FALLORA merupakan prototipe sistem pendukung pemantauan yang menggunakan kamera untuk menganalisis posisi dan pergerakan tubuh manusia secara real-time. Sistem tidak hanya mendeteksi indikasi jatuh, tetapi juga menyediakan:

- **Proses verifikasi pascajatuh** — observasi selama 5 detik untuk membedakan jatuh dari false positive.
- **Manajemen insiden** — pencatatan setiap kejadian dengan status yang dapat diperbarui pengasuh.
- **Caregiver response log** — pengasuh dapat menambahkan catatan, verdict, dan tindakan yang dilakukan.
- **Evaluasi akurasi** — statistik true positive dan false alarm berdasarkan input pengasuh.

> **Penting:** FALLORA adalah prototipe sistem pendukung, bukan alat diagnosis medis, bukan pengganti tenaga medis, dan tidak menjamin keselamatan penghuni.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Deteksi Jatuh Real-Time** | Analisis pose skeleton dengan MoveNet Lightning via TF.js |
| **Verifikasi Pascajatuh** | Jendela observasi 5 detik untuk membedakan jatuh nyata dari false positive |
| **Manajemen Insiden** | Setiap insiden tercatat otomatis dengan ID unik dan timestamp |
| **Caregiver Review** | Pengasuh dapat memeriksa, memberikan verdict, catatan, dan tindakan |
| **Statistik Akurasi** | Hitung true positive dan false alarm berdasarkan input pengasuh |
| **Penyimpanan Lokal** | Data tersimpan di localStorage, tidak ada server, privasi terjaga |

---

## Teknologi

| Komponen | Teknologi |
|---|---|
| **Framework** | Next.js 16.3.8 (App Router, Turbopack) |
| **UI Library** | React 19 |
| **Bahasa** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Computer Vision** | TensorFlow.js 4.22 + MoveNet Lightning (via TFHub) |
| **Ikon** | Lucide React |
| **Audio** | Web Audio API (alarm darurat) |
| **Penyimpanan** | localStorage (client-side only) |

---

## Arsitektur Sistem

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Inter font, metadata)
│   └── page.tsx            # Main entry — routing + state orchestration
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # Desktop navigation + telemetri sidebar
│   │   └── MobileNav.tsx   # Mobile header + bottom tab bar
│   ├── pages/
│   │   ├── OverviewPage.tsx    # Halaman ringkasan + statistik insiden
│   │   ├── MonitoringPage.tsx  # Halaman pemantauan live
│   │   ├── HistoryPage.tsx     # Riwayat insiden + caregiver review
│   │   ├── ResidentsPage.tsx   # Manajemen data & profil risiko penghuni
│   │   ├── SettingsPage.tsx    # Kalibrasi parameter deteksi & audio
│   │   └── AboutPage.tsx       # Dokumentasi teknis sistem
│   ├── dashboard/
│   │   ├── CameraFeed.tsx      # Tampilan webcam + canvas overlay
│   │   ├── DetectionInfo.tsx   # Panel metrik deteksi real-time
│   │   └── StatusCard.tsx      # Kartu status sistem
│   └── emergency/
│       └── EmergencyAlert.tsx  # Banner darurat saat EMERGENCY state
├── cv/
│   ├── poseEstimation.ts   # MoveNet Lightning loader + estimatePose()
│   ├── fallDetection.ts    # Multi-signal fall detection algorithm
│   ├── movementDetection.ts # Post-fall movement analysis
│   └── drawing.ts          # Skeleton overlay renderer
├── hooks/
│   ├── useCamera.ts            # Camera lifecycle management
│   └── useDetectionState.ts    # Detection state + incident management
├── lib/
│   ├── config.ts           # Konstanta konfigurasi sistem
│   ├── stateMachine.ts     # State transitions + label helpers
│   ├── storage.ts          # localStorage CRUD untuk IncidentRecord
│   └── alarm.ts            # Web Audio API alarm
└── types/
    └── index.ts            # Type definitions lengkap
```

---

## Algoritma Deteksi Jatuh

Sistem menggunakan pendekatan multi-sinyal dengan bobot:

| Sinyal | Bobot | Deskripsi |
|---|---|---|
| `isHorizontal` | 40% | Sudut kemiringan tubuh > 55° dari vertikal |
| `isLow` | 25% | Posisi center-of-mass turun ke area bawah frame |
| `hasVelocitySpike` | 35% | Lonjakan kecepatan perpindahan keypoint |

**Fall Confidence Threshold:** ≥ 65% → dipicu sebagai indikasi jatuh.

**Parameter Konfigurasi:**

```
Resolusi kamera:          640 × 480
Target frame rate:        30 FPS
Interval inferensi:       setiap 6 frame
Min pose confidence:      25%
Fall confidence threshold: 65%
Sudut kemiringan tubuh:   > 55°
Jendela pascajatuh:       5 detik
Keypoint displacement:    threshold 0.04
```

---

## Instalasi

**Prasyarat:** Node.js ≥ 18, npm ≥ 9

```bash
# Clone atau extract project
cd fallora

# Instal dependensi
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Cara Menggunakan

### 1. Mulai Pemantauan
- Buka halaman **Ringkasan** → klik **Mulai Pemantauan**
- Atau navigasi ke halaman **Pemantauan** → klik tombol Start
- Izinkan akses kamera saat browser meminta

### 2. Deteksi Jatuh
- Sistem akan menganalisis pose secara real-time
- Jika indikasi jatuh terdeteksi: masuk ke fase POST_FALL_MONITORING (5 detik)
- Jika tidak ada gerakan setelah 5 detik: status berubah ke EMERGENCY + alarm aktif

### 3. Review Insiden
- Buka halaman **Riwayat Insiden**
- Klik **Periksa** pada insiden yang ingin ditinjau
- Isi form: Kesimpulan, Catatan, Tindakan yang Dilakukan
- Klik **Konfirmasi sebagai Kejadian Jatuh** atau **Tandai sebagai Alarm Palsu**

### 4. Reset Darurat
- Saat status EMERGENCY: klik **Reset Sistem** pada banner darurat
- Sistem kembali ke state IDLE

---

## Keterbatasan Sistem

- **Tidak ada backend** — data hanya tersimpan di localStorage perangkat yang digunakan
- **Tidak ada sinkronisasi** — tidak dapat diakses dari perangkat lain
- **Satu kamera** — tidak mendukung multi-kamera dalam satu antarmuka
- **Cahaya** — performa turun pada kondisi pencahayaan buruk
- **Oklusi** — tubuh yang tertutup sebagian dapat mengurangi akurasi
- **Model tidak belajar** — MoveNet Lightning adalah model pretrained, tidak ada fine-tuning lokal
- **Bukan alat medis** — tidak dapat digunakan sebagai pengganti penilaian medis profesional

---

## Sumber & Lisensi

| Library | Lisensi |
|---|---|
| Next.js | MIT |
| React | MIT |
| TensorFlow.js | Apache 2.0 |
| MoveNet Lightning (TFHub) | Apache 2.0 |
| Tailwind CSS | MIT |
| Lucide React | ISC |

---

## Skenario Pengujian

Untuk menguji deteksi jatuh di lingkungan development:

1. Mulai pemantauan dengan kamera aktif
2. Posisikan tubuh tegak di depan kamera (sistem membangun baseline)
3. Simulasikan gerakan jatuh: condongkan tubuh cepat ke sudut > 55° sambil menurunkan posisi
4. Sistem akan mendeteksi dan masuk POST_FALL_MONITORING
5. Diamlah selama 5 detik untuk memicu status EMERGENCY
6. Atau gerakkan tubuh dalam 5 detik untuk memicu status RECOVERED
7. Buka halaman Riwayat untuk melihat insiden yang tercatat

---

*FALLORA — Dikembangkan untuk ISCOMFEST 2026*
