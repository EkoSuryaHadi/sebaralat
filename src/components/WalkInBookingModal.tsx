'use client';

import React, { useState } from 'react';
import { X, Zap, Plus, Minus, User, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { PaymentStatus, RentalItem, DiscountTier } from '../types';
import { getDurationMultiplier } from '../lib/validators';

interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RentalItem[];
  discountTiers?: DiscountTier[];
  availabilityMap?: Record<string, number>;
  formatRp: (num: number) => string;
  onSubmitWalkIn: (params: {
    customerName: string;
    customerPhone: string;
    durationDays: number;
    selectedItems: { item: RentalItem; qty: number }[];
    paymentStatus: PaymentStatus;
    dpAmount: number;
    collateral: string;
    notes: string;
  }) => Promise<void>;
}

export const WalkInBookingModal: React.FC<WalkInBookingModalProps> = ({
  isOpen,
  onClose,
  items,
  discountTiers,
  availabilityMap,
  formatRp,
  onSubmitWalkIn,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [selectedQtyMap, setSelectedQtyMap] = useState<Record<string, number>>({});
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [dpAmount, setDpAmount] = useState('');
  const [collateral, setCollateral] = useState('E-KTP Asli');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const availableItems = items.filter((item) => {
    const avail =
      availabilityMap && typeof availabilityMap[item.id] === 'number'
        ? availabilityMap[item.id]
        : item.status === 'available'
        ? item.stock
        : 0;
    return item.status === 'available' && avail > 0;
  });

  const multiplier = getDurationMultiplier(durationDays, discountTiers);
  const selectedList = availableItems
    .filter((it) => (selectedQtyMap[it.id] || 0) > 0)
    .map((it) => ({
      item: it,
      qty: selectedQtyMap[it.id],
      subtotal: Math.round(it.pricePerDay * multiplier * selectedQtyMap[it.id]),
    }));
  const totalAmount = selectedList.reduce((sum, x) => sum + x.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (selectedList.length === 0) {
      setFormError('Pilih minimal 1 unit alat yang disewa.');
      return;
    }
    if (customerName.trim().length < 2) {
      setFormError('Nama penyewa minimal 2 karakter.');
      return;
    }
    if (customerPhone.replace(/[^0-9]/g, '').length < 9) {
      setFormError('Masukkan nomor WhatsApp penyewa yang valid.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitWalkIn({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        durationDays,
        selectedItems: selectedList.map(({ item, qty }) => ({ item, qty })),
        paymentStatus,
        dpAmount: Number(dpAmount.replace(/[^0-9]/g, '')) || 0,
        collateral: collateral.trim(),
        notes: notes.trim(),
      });
      setCustomerName('');
      setCustomerPhone('');
      setSelectedQtyMap({});
      setNotes('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mencatat sewa walk-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="glass-strong text-fg border border-line-strong w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-bento sm:rounded-bento p-5 sm:p-6 space-y-4 shadow-2xl animate-rise"
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-display text-base font-extrabold text-fg flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-text" />
              <span>Catat Sewa Walk-in (Datang Langsung)</span>
            </h3>
            <p className="text-[11px] text-muted">
              Otomatis berstatus Picked Up, memotong stok, &amp; masuk ke laporan Omzet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pilih Unit */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-fg-soft block">1. Pilih Unit yang Diambil *</span>
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {availableItems.length === 0 ? (
              <p className="text-xs text-muted p-3 rounded-xl bg-surface-2 border border-line text-center">
                Tidak ada unit berstatus Ready hari ini.
              </p>
            ) : (
              availableItems.map((it) => {
                const maxAvail =
                  availabilityMap && typeof availabilityMap[it.id] === 'number'
                    ? availabilityMap[it.id]
                    : it.stock;
                const qty = selectedQtyMap[it.id] || 0;
                return (
                  <div
                    key={it.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      qty > 0 ? 'bg-accent-soft/50 border-accent' : 'bg-surface-2 border-line'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-fg truncate">{it.name}</p>
                      <p className="text-[10px] text-muted">
                        {formatRp(it.pricePerDay)}/hr • Sisa {maxAvail} unit
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQtyMap((prev) => ({
                            ...prev,
                            [it.id]: Math.max(0, (prev[it.id] || 0) - 1),
                          }))
                        }
                        className="w-6 h-6 rounded-lg bg-surface border border-line flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-display font-extrabold w-5 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQtyMap((prev) => ({
                            ...prev,
                            [it.id]: Math.min(maxAvail, (prev[it.id] || 0) + 1),
                          }))
                        }
                        className="w-6 h-6 rounded-lg bg-accent text-accent-fg flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Data Penyewa & Durasi */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Nama Penyewa *</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Pak Budi"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="field pl-8 text-xs py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">No. WhatsApp *</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="08123456789"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="field pl-8 text-xs py-2"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Durasi (Hari)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={durationDays}
              onChange={(e) =>
                setDurationDays(Math.max(1, Math.min(60, Number(e.target.value) || 1)))
              }
              className="field text-xs py-2 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Jaminan Ditahan</label>
            <div className="relative">
              <ShieldCheck className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="E-KTP Asli / SIM"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                className="field pl-8 text-xs py-2"
              />
            </div>
          </div>
        </div>

        {/* Pembayaran */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Status Bayar</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="field text-xs py-2 font-bold"
            >
              <option value="paid">✅ Lunas</option>
              <option value="dp">🟡 Baru DP</option>
              <option value="unpaid">⏳ Belum Bayar</option>
            </select>
          </div>
          {paymentStatus === 'dp' && (
            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">Nominal DP (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="50000"
                value={dpAmount}
                onChange={(e) => setDpAmount(e.target.value)}
                className="field text-xs py-2"
              />
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Catatan kondisi / kelengkapan (opsional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="field text-xs py-2"
        />

        <div className="p-3 rounded-2xl bg-accent-soft/60 border border-accent/30 flex items-center justify-between">
          <span className="text-xs font-bold text-fg">Total Tagihan ({durationDays} Hari)</span>
          <span className="font-display text-lg font-black text-accent-text">
            {formatRp(totalAmount)}
          </span>
        </div>

        {formError && (
          <p className="text-xs font-semibold text-danger-text bg-danger-soft border border-danger/30 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-brutal w-full py-3 text-xs">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mencatat Sewa...</span>
            </>
          ) : (
            <span>Simpan &amp; Cetak Nota Walk-in</span>
          )}
        </button>
      </form>
    </div>
  );
};
