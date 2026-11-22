'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Clock,
  CheckCircle2,
  PackageCheck,
  Flag,
  XCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { Booking, Shop } from '../types';

interface BookingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  initialBooking?: Booking | null;
  initialCode?: string;
  onLookupByCode: (code: string) => Promise<Booking | null>;
  demoSampleCodes?: string[];
  formatRp: (num: number) => string;
  onOpenWhatsApp: (customText?: string) => void;
}

export const BookingStatusModal: React.FC<BookingStatusModalProps> = ({
  isOpen,
  onClose,
  shop,
  initialBooking = null,
  initialCode = '',
  onLookupByCode,
  demoSampleCodes = [],
  formatRp,
  onOpenWhatsApp,
}) => {
  const [manualCodeInput, setManualCodeInput] = useState<string | null>(null);
  const [lookedUpBooking, setLookedUpBooking] = useState<Booking | null | undefined>(
    undefined
  );
  const [searching, setSearching] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState('');
  const [copiedTicketLink, setCopiedTicketLink] = useState(false);

  const codeInput =
    manualCodeInput !== null ? manualCodeInput : initialBooking?.code || initialCode || '';

  const activeBooking: Booking | null =
    lookedUpBooking !== undefined ? lookedUpBooking : initialBooking;

  // Hanya jalankan pencarian asinkron jika dibuka melalui deep-link initialCode tanpa objek initialBooking
  useEffect(() => {
    if (!isOpen || initialBooking || !initialCode || lookedUpBooking !== undefined) {
      return;
    }
    let cancelled = false;
    onLookupByCode(initialCode).then((res) => {
      if (cancelled) return;
      setLookedUpBooking(res);
      if (!res) {
        setNotFoundMsg(
          `Kode booking "${initialCode.toUpperCase()}" tidak ditemukan di ${shop.name}.`
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialBooking, initialCode, lookedUpBooking, onLookupByCode, shop.name]);

  if (!isOpen) return null;

  const handleClose = () => {
    setManualCodeInput(null);
    setLookedUpBooking(undefined);
    setNotFoundMsg('');
    onClose();
  };

  const handleSearch = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const targetCode = (overrideCode ?? codeInput).trim().toUpperCase();
    if (!targetCode) return;
    setManualCodeInput(targetCode);
    setSearching(true);
    setNotFoundMsg('');
    try {
      const found = await onLookupByCode(targetCode);
      setLookedUpBooking(found);
      if (!found) {
        setNotFoundMsg(
          `Kode booking "${targetCode}" tidak ditemukan di katalog ${shop.name}. Periksa kembali kode Anda.`
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const getTicketUrl = (code: string) => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://sebaraja.com';
    return `${origin}/${shop.slug}?booking=${encodeURIComponent(code)}`;
  };

  const handleCopyTicketUrl = () => {
    if (!activeBooking) return;
    const url = getTicketUrl(activeBooking.code);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedTicketLink(true);
      setTimeout(() => setCopiedTicketLink(false), 2000);
    }
  };

  const steps = [
    {
      key: 'pending',
      label: 'Menunggu DP',
      desc: 'Pesanan tercatat, menunggu konfirmasi/DP',
      icon: Clock,
    },
    {
      key: 'confirmed',
      label: 'Stok Dikunci',
      desc: 'Booking terkonfirmasi & unit diamankan',
      icon: CheckCircle2,
    },
    {
      key: 'picked_up',
      label: 'Sedang Disewa',
      desc: 'Unit sudah diambil penyewa',
      icon: PackageCheck,
    },
    {
      key: 'returned',
      label: 'Selesai',
      desc: 'Unit telah dikembalikan ke toko',
      icon: Flag,
    },
  ] as const;

  const currentStepIndex = activeBooking
    ? steps.findIndex((s) => s.key === activeBooking.status)
    : -1;

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="glass-strong text-fg border border-line-strong w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-bento sm:rounded-bento p-5 sm:p-6 space-y-4 shadow-2xl animate-rise">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent-text flex items-center justify-center border border-accent/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-fg">
                Cek Status &amp; Nota Booking
              </h3>
              <p className="text-[11px] text-muted">{shop.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Pencarian Kode Booking */}
        <form onSubmit={(e) => handleSearch(e)} className="space-y-2">
          <label className="block text-[11px] font-bold text-fg-soft">
            Masukkan Kode Booking Resmi (Contoh: SBR-261122-BR02)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="SBR-YYMMDD-XXXX"
                value={codeInput}
                onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                className="field pl-8 text-xs font-mono font-bold uppercase py-2"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !codeInput.trim()}
              className="btn-brutal px-4 py-2 text-xs shrink-0"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cek Kode'}
            </button>
          </div>

          {demoSampleCodes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-muted font-semibold">Contoh Kode Demo:</span>
              {demoSampleCodes.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSearch(undefined, sample)}
                  className="chip text-[10px] font-mono font-bold hover:border-accent hover:text-accent-text cursor-pointer py-0.5"
                >
                  {sample}
                </button>
              ))}
            </div>
          )}
        </form>

        {notFoundMsg && (
          <div className="p-3 rounded-2xl bg-danger-soft border border-danger/30 text-xs text-danger-text font-semibold">
            {notFoundMsg}
          </div>
        )}

        {/* KARTU NOTA / TIKET BOOKING RESMI */}
        {activeBooking && (
          <div className="space-y-3.5 pt-1">
            <div className="bento border-2 border-dashed border-line-strong rounded-2xl p-4 bg-surface-2/70 space-y-3.5">
              <div className="flex items-start justify-between gap-2 border-b border-line pb-2.5">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
                    NOTA &amp; TIKET BOOKING RESMI
                  </span>
                  <h4 className="font-display text-sm font-extrabold text-fg mt-0.5">
                    {shop.name}
                  </h4>
                  <p className="text-[10px] text-muted">{shop.location}</p>
                </div>
                <span className="chip bg-accent-soft text-accent-text border-accent/30 font-mono text-xs font-extrabold">
                  {activeBooking.code}
                </span>
              </div>

              {/* Stepper Visual Status */}
              {activeBooking.status === 'cancelled' ? (
                <div className="bg-danger-soft border border-danger/30 rounded-xl p-3 flex items-center gap-2 text-xs text-danger-text font-bold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Booking Ini Telah Dibatalkan (Cancelled)</span>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {steps.map((st, idx) => {
                    const Icon = st.icon;
                    const isPassed = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div
                        key={st.key}
                        className={`p-2 rounded-xl border text-center space-y-1 transition ${
                          isCurrent
                            ? 'bg-accent-soft border-accent text-accent-text font-extrabold shadow-xs'
                            : isPassed
                            ? 'bg-surface border-accent/30 text-fg-soft font-bold'
                            : 'bg-surface/40 border-line text-subtle opacity-60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mx-auto" />
                        <span className="block text-[9px] leading-tight">{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Informasi Penyewa & Jadwal */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-surface rounded-xl p-3 border border-line">
                <div>
                  <span className="text-[10px] text-muted font-bold block">Nama Penyewa</span>
                  <strong className="text-fg font-bold">{activeBooking.customerName}</strong>
                  <span className="text-[10px] font-mono text-muted block">
                    {activeBooking.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted font-bold block">Jadwal Sewa</span>
                  <strong className="text-fg font-bold block">
                    {activeBooking.startDate} s/d {activeBooking.endDate}
                  </strong>
                  <span className="text-[10px] text-accent-text font-bold">
                    Durasi: {activeBooking.durationDays} Hari
                  </span>
                </div>
              </div>

              {/* Rincian Unit yang Disewa */}
              {activeBooking.lines && activeBooking.lines.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-muted block">
                    Rincian Unit Sewa
                  </span>
                  <ul className="bg-surface rounded-xl p-2.5 border border-line space-y-1.5 text-xs">
                    {activeBooking.lines.map((ln) => (
                      <li
                        key={ln.id}
                        className="flex items-center justify-between gap-2 border-b last:border-b-0 border-line/60 pb-1 last:pb-0"
                      >
                        <span className="text-fg-soft font-medium">
                          {ln.itemName} <strong className="text-fg">× {ln.qty}</strong>
                        </span>
                        <span className="font-mono font-bold text-fg">
                          {formatRp(ln.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeBooking.notes && (
                <p className="text-[11px] text-muted italic bg-surface/60 rounded-xl px-3 py-2 border border-line">
                  Catatan: {activeBooking.notes}
                </p>
              )}

              {/* Total Biaya */}
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <span className="text-xs font-extrabold uppercase text-muted">
                  Total Tagihan Sewa
                </span>
                <span className="font-display text-lg font-black text-accent-text">
                  {formatRp(activeBooking.totalAmount)}
                </span>
              </div>
            </div>

            {/* Tombol Aksi Nota */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => window.print?.()}
                className="btn-brutal py-2.5 px-3 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF Nota</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTicketUrl}
                className="btn-glass py-2.5 px-3 text-xs"
              >
                {copiedTicketLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent-text" />
                    <span>Link Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-accent-text" />
                    <span>Salin Link Tiket</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenWhatsApp(
                  `Halo Admin *${shop.name}*, saya ingin menanyakan/konfirmasi status booking dengan kode *${activeBooking.code}* atas nama *${activeBooking.customerName}*.`
                )
              }
              className="btn-glass w-full py-2.5 text-xs font-bold text-accent-text"
            >
              <MessageCircle className="w-3.5 h-3.5 text-accent-text" />
              <span>Konfirmasi Kode Booking Ini ke WA Admin</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
