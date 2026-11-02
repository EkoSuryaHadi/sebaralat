'use client';

import React, { useState } from 'react';
import {
  X,
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
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-strong text-fg border border-line-strong w-full max-w-lg rounded-[var(--radius-bento)] p-6 sm:p-7 space-y-5 shadow-2xl relative my-8 animate-rise">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="space-y-2 text-center max-w-md mx-auto">
          <div className="chip bg-accent-soft border-accent/30 text-accent-text text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Investasi Super Terjangkau</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-fg tracking-tight leading-tight">
            Tingkatkan ke <span className="text-gradient">Bisnis PRO</span>
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            Solusi lengkap manajemen rental profesional untuk toko <strong>{shop.name}</strong>.
          </p>
        </div>

        {/* Pilihan Paket: Bulanan vs Tahunan (Bento Tiles) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedCycle('monthly')}
            className={`bento p-3.5 sm:p-4 text-left transition relative cursor-pointer ${
              selectedCycle === 'monthly'
                ? 'border-accent bg-accent-soft/40 ring-2 ring-accent/40 shadow-xs'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <span className="text-[11px] font-bold text-muted uppercase block">Bulanan</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-lg sm:text-xl font-extrabold text-fg">Rp 23.000</span>
              <span className="text-[10px] text-muted">/bln</span>
            </div>
            <p className="text-[10px] text-muted mt-1">Fleksibel bayar tiap bulan</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCycle('yearly')}
            className={`bento p-3.5 sm:p-4 text-left transition relative cursor-pointer ${
              selectedCycle === 'yearly'
                ? 'border-accent bg-accent-soft/40 ring-2 ring-accent/40 shadow-xs'
                : 'border-line bg-surface hover:border-line-strong'
            }`}
          >
            <span className="absolute -top-2.5 right-3 bg-pop text-[#0c110f] border border-ink/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-current" /> Hemat 46%
            </span>
            <span className="text-[11px] font-bold text-accent-text uppercase block">Tahunan</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-display text-lg sm:text-xl font-extrabold text-fg">Rp 149.000</span>
              <span className="text-[10px] text-muted">/thn</span>
            </div>
            <p className="text-[10px] text-accent-text mt-1 font-semibold">Hanya Rp 12.400 / bulan</p>
          </button>
        </div>

        {/* Rincian Fitur PRO */}
        <div className="bento p-4 bg-surface-2/60 border-line space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
            Semua Fitur Bisnis PRO Termasuk:
          </span>
          <div className="grid sm:grid-cols-2 gap-2.5 text-xs text-fg-soft">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <span><strong>Unlimited</strong> unit alat &amp; kategori</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <span><strong>Akses Multi-Role:</strong> Staf gudang terpisah</span>
            </div>
            <div className="flex items-start gap-2">
              <QrCode className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <span><strong>Label QR Fisik:</strong> Cetak label bodi unit</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <span><strong>Audit Log:</strong> Pantau riwayat staf</span>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <EyeOff className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <span>Lencana <strong>Official Partner</strong> &amp; Bebas Watermark</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleCheckoutWA}
            className="btn-brutal w-full py-3.5 text-xs sm:text-sm"
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
              className="btn-glass w-full py-2.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-warn-text" />
              <span>{isSimulating ? 'Mengaktifkan...' : '⚡ Langsung Aktifkan PRO (Uji Coba Demo)'}</span>
            </button>
          )}

          <p className="text-center text-[10px] text-muted">
            Aktivasi instan via QRIS / Transfer Bank. Tanpa kontrak yang mengikat.
          </p>
        </div>
      </div>
    </div>
  );
};
