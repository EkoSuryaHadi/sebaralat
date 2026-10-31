'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Zap,
  QrCode,
  Users,
  EyeOff,
  Flame,
} from 'lucide-react';
import { Shop } from '../types';
import {
  SEBARALA_ADMIN_WA,
  formatUpgradeWhatsappMessage,
} from '../lib/validators';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  onSimulateUpgrade?: (cycle: 'monthly' | 'yearly') => Promise<void> | void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  shop,
  onSimulateUpgrade,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleCheckoutWA = () => {
    const text = formatUpgradeWhatsappMessage(shop, selectedCycle);
    const url = `https://wa.me/${SEBARALA_ADMIN_WA}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDemoActivate = async () => {
    if (!onSimulateUpgrade) return;
    setIsSimulating(true);
    try {
      await onSimulateUpgrade(selectedCycle);
      onClose();
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border-2 border-emerald-500/40 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative text-white my-8">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="space-y-2 text-center max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Investasi Super Terjangkau</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Tingkatkan ke <span className="text-emerald-400">Bisnis PRO</span>
          </h2>
          <p className="text-xs text-slate-400">
            Solusi lengkap manajemen rental profesional untuk toko <strong>{shop.name}</strong>.
          </p>
        </div>

        {/* Pilihan Paket: Bulanan vs Tahunan */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedCycle('monthly')}
            className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
              selectedCycle === 'monthly'
                ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Bulanan</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-white">Rp 23.000</span>
              <span className="text-[10px] text-slate-400">/bln</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Fleksibel bayar tiap bulan</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCycle('yearly')}
            className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
              selectedCycle === 'yearly'
                ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-current" /> Hemat 46%
            </span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase block">Tahunan</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-white">Rp 149.000</span>
              <span className="text-[10px] text-slate-400">/thn</span>
            </div>
            <p className="text-[10px] text-emerald-300 mt-1 font-medium">Hanya Rp 12.400 / bulan</p>
          </button>
        </div>

        {/* Rincian Fitur PRO */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Semua Fitur Bisnis PRO Termasuk:
          </span>
          <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-slate-200">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Unlimited</strong> unit alat & kategori</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Akses Multi-Role:</strong> Staf gudang terpisah</span>
            </div>
            <div className="flex items-start gap-2">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Label QR Fisik:</strong> Cetak label bodi unit</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Audit Log:</strong> Pantau riwayat staf</span>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Lencana <strong>Official Partner</strong> & Bebas Watermark</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleCheckoutWA}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>AJUKAN UPGRADE KE ADMIN SEBARALAT</span>
          </button>

          {/* Simulator untuk Pengujian Demo */}
          {onSimulateUpgrade && (
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleDemoActivate}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-xs py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulating ? 'Mengaktifkan...' : '⚡ Langsung Aktifkan PRO (Uji Coba Demo)'}</span>
            </button>
          )}

          <p className="text-center text-[10px] text-slate-500">
            Aktivasi instan via QRIS / Transfer Bank. Tanpa kontrak yang mengikat.
          </p>
        </div>
      </div>
    </div>
  );
};

