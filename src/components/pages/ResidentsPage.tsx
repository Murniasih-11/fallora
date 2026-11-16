'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  AlertCircle,
  Shield,
  HeartPulse,
  UserCheck,
  X,
  Save,
} from 'lucide-react';

export interface Resident {
  id: string;
  name: string;
  age: number;
  room: string;
  riskLevel: 'high' | 'medium' | 'low';
  mobilityNotes: string;
  emergencyContact: string;
  medicalConditions: string;
  lastChecked: string;
}

const DEFAULT_RESIDENTS: Resident[] = [
  {
    id: 'RES-001',
    name: 'Ny. Siti Rahmawati',
    age: 78,
    room: 'Kamar 101 / Sayap Barat',
    riskLevel: 'high',
    mobilityNotes: 'Memerlukan bantuan tongkat berkaki empat, langkah tidak stabil.',
    emergencyContact: '0812-3456-7890 (Anak)',
    medicalConditions: 'Riwayat osteoporosis dan pusing saat berdiri mendadak (hipotensi ortostatik).',
    lastChecked: 'Hari ini, 08:30 WIB',
  },
  {
    id: 'RES-002',
    name: 'Tn. Hendra Kusuma',
    age: 82,
    room: 'Kamar 102 / Sayap Barat',
    riskLevel: 'medium',
    mobilityNotes: 'Dapat berjalan mandiri dengan pengawasan perlahan.',
    emergencyContact: '0821-9876-5432 (Keluarga)',
    medicalConditions: 'Pasca-pemulihan stroke ringan sisi kiri, penglihatan parsial.',
    lastChecked: 'Hari ini, 09:15 WIB',
  },
  {
    id: 'RES-003',
    name: 'Ny. Maria Magdalena',
    age: 75,
    room: 'Kamar 104 / Sayap Timur',
    riskLevel: 'low',
    mobilityNotes: 'Mandiri, aktif senam pagi lansia.',
    emergencyContact: '0813-1122-3344 (Pengampu)',
    medicalConditions: 'Hipertensi terkontrol rutin, tanpa riwayat jatuh dalam 12 bulan terakhir.',
    lastChecked: 'Kemarin, 16:00 WIB',
  },
  {
    id: 'RES-004',
    name: 'Tn. Ahmad Fauzi',
    age: 85,
    room: 'Ruang Bersama / Paviliun Utama',
    riskLevel: 'high',
    mobilityNotes: 'Pengguna kursi roda dengan risiko tergelincir saat transfer ke tempat tidur.',
    emergencyContact: '0856-7788-9900 (Dokter Jaga)',
    medicalConditions: 'Demensia ringan, sering mencoba bangkit tanpa menunggu pengasuh.',
    lastChecked: 'Hari ini, 10:00 WIB',
  },
];

const STORAGE_KEY = 'fallora_residents_v1';

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>(DEFAULT_RESIDENTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResidents(JSON.parse(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RESIDENTS));
      }
    } catch {}
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for new resident
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState<number>(75);
  const [formRoom, setFormRoom] = useState('');
  const [formRisk, setFormRisk] = useState<'high' | 'medium' | 'low'>('medium');
  const [formMobility, setFormMobility] = useState('');
  const [formMedical, setFormMedical] = useState('');
  const [formContact, setFormContact] = useState('');

  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRoom.trim()) return;

    const newRes: Resident = {
      id: `RES-${String(residents.length + 1).padStart(3, '0')}`,
      name: formName.trim(),
      age: Number(formAge) || 70,
      room: formRoom.trim(),
      riskLevel: formRisk,
      mobilityNotes: formMobility.trim() || 'Tidak ada catatan khusus.',
      emergencyContact: formContact.trim() || 'Belum terdaftar',
      medicalConditions: formMedical.trim() || 'Tidak ada catatan penyakit khusus.',
      lastChecked: 'Baru ditambahkan',
    };

    const updated = [newRes, ...residents];
    setResidents(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Reset & close
    setFormName('');
    setFormAge(75);
    setFormRoom('');
    setFormRisk('medium');
    setFormMobility('');
    setFormMedical('');
    setFormContact('');
    setIsModalOpen(false);
  };

  const filteredResidents = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || r.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const getRiskBadge = (risk: Resident['riskLevel']) => {
    switch (risk) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#B94B48] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B94B48]" />
            Risiko Tinggi
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#D6A66A] border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6A66A]" />
            Risiko Sedang
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EC] text-[#173C39] border border-[#D4E0DC]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#173C39]" />
            Risiko Rendah
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#0F2421]">
            Penghuni &amp; Zona Pantau
          </h1>
          <p className="text-sm text-[#4A6760] mt-1 max-w-2xl leading-relaxed">
            Profil lansia dan zona ruang pemantauan panti jompo untuk referensi tanggap insiden cepat.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#173C39] text-white text-xs font-semibold rounded-lg hover:bg-[#1f4d49] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tambah Penghuni</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <Users size={14} className="text-[#4A6760]" />
            <span className="text-[10px] font-semibold text-[#7A9490] uppercase tracking-wider">
              Total Penghuni
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#0F2421]">{residents.length}</p>
          <p className="text-[11px] text-[#4A6760] mt-0.5">Terdaftar dalam zona</p>
        </div>
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertCircle size={14} className="text-[#B94B48]" />
            <span className="text-[10px] font-semibold text-[#B94B48] uppercase tracking-wider">
              Risiko Tinggi
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#B94B48]">
            {residents.filter((r) => r.riskLevel === 'high').length}
          </p>
          <p className="text-[11px] text-[#4A6760] mt-0.5">Prioritas pemantauan</p>
        </div>
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <Shield size={14} className="text-[#D6A66A]" />
            <span className="text-[10px] font-semibold text-[#D6A66A] uppercase tracking-wider">
              Risiko Sedang
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#D6A66A]">
            {residents.filter((r) => r.riskLevel === 'medium').length}
          </p>
          <p className="text-[11px] text-[#4A6760] mt-0.5">Perlu pendampingan</p>
        </div>
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <UserCheck size={14} className="text-[#173C39]" />
            <span className="text-[10px] font-semibold text-[#173C39] uppercase tracking-wider">
              Risiko Rendah
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-[#173C39]">
            {residents.filter((r) => r.riskLevel === 'low').length}
          </p>
          <p className="text-[11px] text-[#4A6760] mt-0.5">Kondisi mandiri</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#D4E0DC] rounded-xl p-3.5 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A9490]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, nomor kamar, atau ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F8F5] border border-[#D4E0DC] rounded-lg text-[#0F2421] placeholder:text-[#7A9490] focus:outline-none focus:ring-1 focus:ring-[#173C39] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-medium text-[#7A9490] uppercase tracking-wider mr-1">
            Filter:
          </span>
          {(['all', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                riskFilter === level
                  ? 'bg-[#173C39] text-white border-[#173C39]'
                  : 'bg-white text-[#4A6760] border-[#D4E0DC] hover:bg-[#F7F8F5]'
              }`}
            >
              {level === 'all'
                ? 'Semua'
                : level === 'high'
                ? 'Tinggi'
                : level === 'medium'
                ? 'Sedang'
                : 'Rendah'}
            </button>
          ))}
        </div>
      </div>

      {/* Residents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResidents.map((res) => (
          <div
            key={res.id}
            className="bg-white border border-[#D4E0DC] rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-[#173C39]/40 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-[#0F2421]">{res.name}</h3>
                    <span className="text-xs text-[#7A9490] font-mono">({res.age} thn)</span>
                  </div>
                  <p className="text-xs font-medium text-[#4A6760] mt-0.5">{res.room}</p>
                </div>
                {getRiskBadge(res.riskLevel)}
              </div>

              <div className="space-y-2.5 text-xs border-t border-[#EAF0ED] pt-3">
                <div className="flex items-start gap-2">
                  <HeartPulse size={13} className="text-[#B94B48] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0F2421]">Kondisi Medis: </span>
                    <span className="text-[#4A6760]">{res.medicalConditions}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Shield size={13} className="text-[#173C39] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0F2421]">Karakteristik Mobilitas: </span>
                    <span className="text-[#4A6760]">{res.mobilityNotes}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[#4A6760] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#0F2421]">Kontak Cepat: </span>
                    <span className="text-[#4A6760] font-mono">{res.emergencyContact}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EAF0ED] flex items-center justify-between text-[11px] text-[#7A9490]">
              <span>ID: {res.id}</span>
              <span>Pemeriksaan Terakhir: {res.lastChecked}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredResidents.length === 0 && (
        <div className="bg-white border border-[#D4E0DC] rounded-xl p-8 text-center text-[#7A9490] text-sm">
          Tidak ada data penghuni yang cocok dengan kriteria pencarian.
        </div>
      )}

      {/* Add Resident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#D4E0DC] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#D4E0DC] flex items-center justify-between bg-[#F7F8F5]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#173C39]" />
                <h2 className="font-heading font-bold text-sm text-[#0F2421]">
                  Tambah Profil Penghuni
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#7A9490] hover:text-[#0F2421] p-1 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#0F2421] mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ny. Kartini"
                  className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0F2421] mb-1">Usia (Tahun)</label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={120}
                    value={formAge}
                    onChange={(e) => setFormAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#0F2421] mb-1">Tingkat Risiko</label>
                  <select
                    value={formRisk}
                    onChange={(e) => setFormRisk(e.target.value as Resident['riskLevel'])}
                    className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                  >
                    <option value="high">Risiko Tinggi</option>
                    <option value="medium">Risiko Sedang</option>
                    <option value="low">Risiko Rendah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#0F2421] mb-1">Ruangan / Zona Pantau</label>
                <input
                  type="text"
                  required
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  placeholder="Contoh: Kamar 105 / Paviliun Bougenville"
                  className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0F2421] mb-1">Kondisi Medis Utama</label>
                <input
                  type="text"
                  value={formMedical}
                  onChange={(e) => setFormMedical(e.target.value)}
                  placeholder="Contoh: Osteoporosis, riwayat vertigo"
                  className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0F2421] mb-1">Catatan Mobilitas</label>
                <input
                  type="text"
                  value={formMobility}
                  onChange={(e) => setFormMobility(e.target.value)}
                  placeholder="Contoh: Memakai alat bantu jalan, butuh pengawasan saat berdiri"
                  className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0F2421] mb-1">Kontak Darurat</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="Contoh: 0812-xxxx-xxxx (Keluarga/Dokter)"
                  className="w-full px-3 py-2 border border-[#D4E0DC] rounded-lg bg-white text-[#0F2421] focus:ring-1 focus:ring-[#173C39] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#EAF0ED] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#D4E0DC] text-[#4A6760] hover:bg-[#F7F8F5] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#173C39] text-white font-medium hover:bg-[#1f4d49] transition-colors"
                >
                  <Save size={13} />
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

