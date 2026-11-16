'use client';

import { useState } from 'react';
import { IncidentRecord, IncidentStats, CaregiverStatus, CaregiverVerdict } from '@/types';
import {
  History,
  Trash2,
  Filter,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface HistoryPageProps {
  incidents: IncidentRecord[];
  stats: IncidentStats;
  onUpdateIncident: (
    id: string,
    caregiverStatus: CaregiverStatus,
    verdict?: CaregiverVerdict | null,
    note?: string,
    action?: string
  ) => void;
  onClearAll: () => void;
}

type FilterType = 'all' | 'awaiting_review' | 'confirmed_incident' | 'false_alarm' | 'unable_to_confirm' | 'resolved';

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function getAlgorithmLabel(result: IncidentRecord['algorithmResult']): string {
  switch (result) {
    case 'movement_detected': return 'Gerakan Terdeteksi';
    case 'no_significant_movement': return 'Tanpa Gerakan Signifikan';
    case 'fall_indication': return 'Indikasi Jatuh';
    case 'unable_to_verify': return 'Tidak Dapat Diverifikasi';
  }
}

function getAlgorithmClass(result: IncidentRecord['algorithmResult']): string {
  switch (result) {
    case 'movement_detected': return 'bg-[#E8F0EC] text-[#173C39] border-[#D4E0DC]';
    case 'no_significant_movement': return 'bg-red-50 text-[#B94B48] border-red-200';
    case 'fall_indication': return 'bg-amber-50 text-[#D97706] border-amber-200';
    case 'unable_to_verify': return 'bg-[#F7F8F5] text-[#7A9490] border-[#D4E0DC]';
  }
}

function getCaregiverStatusLabel(status: CaregiverStatus): string {
  switch (status) {
    case 'awaiting_review': return 'Menunggu Review';
    case 'under_review': return 'Sedang Diperiksa';
    case 'confirmed_incident': return 'Terkonfirmasi';
    case 'false_alarm': return 'Alarm Palsu';
    case 'unable_to_confirm': return 'Belum Pasti';
    case 'resolved': return 'Selesai';
  }
}

function getCaregiverStatusClass(status: CaregiverStatus): string {
  switch (status) {
    case 'awaiting_review': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'under_review': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'confirmed_incident': return 'bg-red-50 text-[#B94B48] border-red-200';
    case 'false_alarm': return 'bg-[#F7F8F5] text-[#7A9490] border-[#D4E0DC]';
    case 'unable_to_confirm': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'resolved': return 'bg-[#E8F0EC] text-[#173C39] border-[#D4E0DC]';
  }
}

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'awaiting_review', label: 'Menunggu Review' },
  { id: 'confirmed_incident', label: 'Terkonfirmasi' },
  { id: 'false_alarm', label: 'Alarm Palsu' },
  { id: 'unable_to_confirm', label: 'Belum Pasti' },
  { id: 'resolved', label: 'Selesai' },
];

// ---- Incident Detail Panel ----

interface DetailPanelProps {
  incident: IncidentRecord;
  onClose: () => void;
  onUpdate: (
    id: string,
    caregiverStatus: CaregiverStatus,
    verdict?: CaregiverVerdict | null,
    note?: string,
    action?: string
  ) => void;
}

function IncidentDetailPanel({ incident, onClose, onUpdate }: DetailPanelProps) {
  const isResolved = ['confirmed_incident', 'false_alarm', 'unable_to_confirm', 'resolved'].includes(
    incident.caregiverStatus
  );
  const [verdict, setVerdict] = useState<CaregiverVerdict | ''>(incident.caregiverVerdict ?? '');
  const [note, setNote] = useState(incident.caregiverNote ?? '');
  const [action, setAction] = useState(incident.caregiverAction ?? '');
  const [saving, setSaving] = useState(false);

  function handleSave(status: CaregiverStatus) {
    setSaving(true);
    onUpdate(incident.id, status, verdict || null, note, action);
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sliding Panel */}
      <div className="w-full max-w-md bg-white border-l border-[#D4E0DC] flex flex-col h-full overflow-y-auto shadow-lg">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-[#D4E0DC] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-heading text-sm font-bold text-[#0F2421]">Detail Insiden</h2>
            <p className="text-xs text-[#7A9490] font-mono mt-0.5">{incident.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A9490] hover:text-[#0F2421] hover:bg-[#F7F8F5] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Data Teknis */}
          <section>
            <h3 className="text-xs font-semibold text-[#7A9490] uppercase tracking-wider mb-3">
              Data Teknis Deteksi
            </h3>
            <div className="space-y-2.5 bg-[#F7F8F5] border border-[#EAF0ED] rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#4A6760]">Waktu Deteksi</span>
                <span className="text-xs font-medium text-[#0F2421] font-mono">
                  {formatDateTime(incident.detectedAt)}
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <span className="text-xs text-[#4A6760] shrink-0">Hasil Algoritma</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${getAlgorithmClass(incident.algorithmResult)}`}>
                  {getAlgorithmLabel(incident.algorithmResult)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#4A6760]">Sudut Tubuh</span>
                <span className="text-xs font-medium text-[#0F2421] font-mono">
                  {incident.bodyAngleAtDetection.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#4A6760]">Confidence Score</span>
                <span className="text-xs font-medium text-[#0F2421] font-mono">
                  {(incident.confidenceAtDetection * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#4A6760]">Durasi Observasi</span>
                <span className="text-xs font-medium text-[#0F2421] font-mono">
                  {incident.verificationDuration} detik
                </span>
              </div>
              {incident.resolvedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4A6760]">Waktu Selesai</span>
                  <span className="text-xs font-medium text-[#0F2421] font-mono">
                    {formatDateTime(incident.resolvedAt)}
                  </span>
                </div>
              )}
            </div>
          </section>

          <div className="border-t border-[#EAF0ED]" />

          {/* Status Saat Ini */}
          <section>
            <h3 className="text-xs font-semibold text-[#7A9490] uppercase tracking-wider mb-3">
              Status Penanganan
            </h3>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCaregiverStatusClass(incident.caregiverStatus)}`}>
              {getCaregiverStatusLabel(incident.caregiverStatus)}
            </span>
          </section>

          <div className="border-t border-[#EAF0ED]" />

          {/* Form / Tampilan Review */}
          <section>
            <h3 className="text-xs font-semibold text-[#7A9490] uppercase tracking-wider mb-3">
              {isResolved ? 'Catatan Pengasuh' : 'Review Pengasuh'}
            </h3>

            {isResolved ? (
              <div className="space-y-3">
                {incident.caregiverVerdict && (
                  <div>
                    <p className="text-xs text-[#7A9490] mb-1">Kesimpulan</p>
                    <p className="text-sm font-medium text-[#0F2421]">
                      {incident.caregiverVerdict === 'confirmed_fall'
                        ? 'Jatuh Terkonfirmasi'
                        : incident.caregiverVerdict === 'no_fall'
                        ? 'Tidak Terjadi Jatuh'
                        : 'Belum Dapat Dipastikan'}
                    </p>
                  </div>
                )}
                {incident.caregiverNote && (
                  <div>
                    <p className="text-xs text-[#7A9490] mb-1">Catatan</p>
                    <p className="text-sm text-[#0F2421] leading-relaxed">{incident.caregiverNote}</p>
                  </div>
                )}
                {incident.caregiverAction && (
                  <div>
                    <p className="text-xs text-[#7A9490] mb-1">Tindakan yang Dilakukan</p>
                    <p className="text-sm text-[#0F2421] leading-relaxed">{incident.caregiverAction}</p>
                  </div>
                )}
                {!incident.caregiverVerdict && !incident.caregiverNote && !incident.caregiverAction && (
                  <p className="text-sm text-[#7A9490] italic">Tidak ada catatan pengasuh.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Verdict */}
                <div>
                  <label className="block text-xs font-medium text-[#0F2421] mb-1.5">
                    Kesimpulan
                  </label>
                  <select
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value as CaregiverVerdict | '')}
                    className="w-full text-sm border border-[#D4E0DC] rounded-lg px-3 py-2 bg-white text-[#0F2421] focus:outline-none focus:ring-2 focus:ring-[#173C39]/20 focus:border-[#173C39]"
                  >
                    <option value="">— Pilih Kesimpulan —</option>
                    <option value="confirmed_fall">Jatuh Terkonfirmasi</option>
                    <option value="no_fall">Tidak Terjadi Jatuh</option>
                    <option value="uncertain">Belum Dapat Dipastikan</option>
                  </select>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-medium text-[#0F2421] mb-1.5">
                    Catatan Pengasuh{' '}
                    <span className="text-[#7A9490] font-normal">(opsional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Deskripsikan kondisi yang diamati..."
                    className="w-full text-sm border border-[#D4E0DC] rounded-lg px-3 py-2 bg-white text-[#0F2421] resize-none focus:outline-none focus:ring-2 focus:ring-[#173C39]/20 focus:border-[#173C39] placeholder:text-[#7A9490]"
                  />
                </div>

                {/* Tindakan */}
                <div>
                  <label className="block text-xs font-medium text-[#0F2421] mb-1.5">
                    Tindakan yang Dilakukan{' '}
                    <span className="text-[#7A9490] font-normal">(opsional)</span>
                  </label>
                  <textarea
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Pasien diperiksa, ditemukan dalam kondisi baik."
                    className="w-full text-sm border border-[#D4E0DC] rounded-lg px-3 py-2 bg-white text-[#0F2421] resize-none focus:outline-none focus:ring-2 focus:ring-[#173C39]/20 focus:border-[#173C39] placeholder:text-[#7A9490]"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Action Buttons — hanya untuk insiden yang belum diselesaikan */}
        {!isResolved && (
          <div className="p-5 border-t border-[#D4E0DC] space-y-2 sticky bottom-0 bg-white">
            <button
              onClick={() => handleSave('confirmed_incident')}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B94B48] text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle size={14} />
              Konfirmasi sebagai Kejadian Jatuh
            </button>
            <button
              onClick={() => handleSave('false_alarm')}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#173C39] text-sm font-semibold rounded-lg border border-[#D4E0DC] hover:bg-[#F7F8F5] transition-colors disabled:opacity-60"
            >
              <XCircle size={14} />
              Tandai sebagai Alarm Palsu
            </button>
            <button
              onClick={() => handleSave('unable_to_confirm')}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-[#7A9490] text-sm font-medium hover:text-[#0F2421] transition-colors disabled:opacity-60"
            >
              <HelpCircle size={14} />
              Belum Dapat Dipastikan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function HistoryPage({ incidents, stats, onUpdateIncident, onClearAll }: HistoryPageProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter((i) => i.caregiverStatus === filter);

  function handleUpdate(
    id: string,
    caregiverStatus: CaregiverStatus,
    verdict?: CaregiverVerdict | null,
    note?: string,
    action?: string
  ) {
    onUpdateIncident(id, caregiverStatus, verdict, note, action);
    setSelectedIncident(null);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Halaman */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#0F2421]">
          Riwayat Insiden
        </h1>
        <p className="text-sm text-[#4A6760] mt-1 max-w-2xl leading-relaxed">
          Catatan seluruh indikasi jatuh yang terdeteksi. Periksa setiap insiden dan catat tindak lanjut pengasuh.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-[#7A9490]" />
            <span className="text-xs text-[#7A9490] uppercase tracking-wide font-medium">Total</span>
          </div>
          <p className="text-3xl font-bold font-mono text-[#0F2421]">{stats.total}</p>
          <p className="text-xs text-[#7A9490] mt-1">Semua insiden</p>
        </div>
        <div className={`rounded-xl p-5 shadow-sm border ${stats.awaitingReview > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#D4E0DC]'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className={stats.awaitingReview > 0 ? 'text-amber-600' : 'text-[#7A9490]'} />
            <span className={`text-xs uppercase tracking-wide font-medium ${stats.awaitingReview > 0 ? 'text-amber-700' : 'text-[#7A9490]'}`}>
              Menunggu
            </span>
          </div>
          <p className={`text-3xl font-bold font-mono ${stats.awaitingReview > 0 ? 'text-amber-700' : 'text-[#0F2421]'}`}>
            {stats.awaitingReview}
          </p>
          <p className="text-xs text-[#7A9490] mt-1">Perlu ditinjau</p>
        </div>
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-[#173C39]" />
            <span className="text-xs text-[#7A9490] uppercase tracking-wide font-medium">Terkonfirmasi</span>
          </div>
          <p className="text-3xl font-bold font-mono text-[#0F2421]">{stats.confirmedIncidents}</p>
          <p className="text-xs text-[#7A9490] mt-1">Jatuh nyata</p>
        </div>
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={14} className="text-[#7A9490]" />
            <span className="text-xs text-[#7A9490] uppercase tracking-wide font-medium">Alarm Palsu</span>
          </div>
          <p className="text-3xl font-bold font-mono text-[#0F2421]">{stats.falseAlarms}</p>
          <p className="text-xs text-[#7A9490] mt-1">Bukan jatuh</p>
        </div>
      </div>

      {/* Filter Bar + Clear Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-[#7A9490] shrink-0" />
          {FILTER_OPTIONS.map((f) => {
            const count = f.id === 'all'
              ? incidents.length
              : incidents.filter((i) => i.caregiverStatus === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  filter === f.id
                    ? 'bg-[#173C39] text-white border-[#173C39]'
                    : 'bg-white text-[#4A6760] border-[#D4E0DC] hover:bg-[#F7F8F5] hover:text-[#0F2421]'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 font-mono text-[11px] ${filter === f.id ? 'text-white/60' : 'text-[#7A9490]'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {incidents.length > 0 && (
          <div>
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#4A6760]">Yakin hapus semua?</span>
                <button
                  onClick={() => { onClearAll(); setShowClearConfirm(false); }}
                  className="text-xs font-semibold text-[#B94B48] hover:underline"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs text-[#7A9490] hover:text-[#0F2421]"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-[#7A9490] hover:text-[#B94B48] transition-colors font-medium"
              >
                <Trash2 size={12} />
                Hapus Semua
              </button>
            )}
          </div>
        )}
      </div>

      {/* Incident Table */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-[#D4E0DC] flex items-center gap-2">
          <History size={14} className="text-[#173C39]" />
          <span className="text-sm font-semibold text-[#0F2421]">
            Daftar Insiden
          </span>
          <span className="text-xs bg-[#F7F8F5] text-[#7A9490] px-2 py-0.5 rounded-lg font-mono border border-[#EAF0ED]">
            {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <History size={32} className="text-[#D4E0DC] mx-auto mb-3" />
            <p className="text-sm text-[#7A9490]">
              {incidents.length === 0
                ? 'Belum ada insiden yang tercatat. Mulai pemantauan untuk merekam aktivitas deteksi.'
                : 'Tidak ada insiden dengan filter yang dipilih.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F7F8F5] border-b border-[#D4E0DC]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A9490] uppercase tracking-wider">
                    ID Insiden
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A9490] uppercase tracking-wider">
                    Waktu Deteksi
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A9490] uppercase tracking-wider hidden sm:table-cell">
                    Hasil Algoritma
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A9490] uppercase tracking-wider hidden md:table-cell">
                    Sudut
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A9490] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-[#7A9490] uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF0ED]">
                {filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="bg-white hover:bg-[#F7F8F5] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-[#7A9490]">
                      {inc.id}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#0F2421] font-medium">
                      {formatDate(inc.detectedAt)}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getAlgorithmClass(inc.algorithmResult)}`}>
                        {getAlgorithmLabel(inc.algorithmResult)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#7A9490] hidden md:table-cell">
                      {inc.bodyAngleAtDetection.toFixed(1)}°
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCaregiverStatusClass(inc.caregiverStatus)}`}>
                        {getCaregiverStatusLabel(inc.caregiverStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedIncident(inc); }}
                        className="inline-flex items-center gap-1 text-xs text-[#173C39] hover:text-[#0F2421] font-medium transition-colors"
                      >
                        Periksa <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[#7A9490] leading-relaxed">
        <strong className="font-medium text-[#4A6760]">Catatan Penyimpanan:</strong>{' '}
        Data insiden tersimpan secara lokal pada peramban Anda (localStorage) dan tidak disinkronkan ke server atau perangkat lain. Data akan terhapus apabila dibersihkan secara manual atau riwayat browser dihapus.
      </p>

      {/* Detail Panel */}
      {selectedIncident && (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
