'use client';

import React, { useState } from 'react';
import { Copy, MessageCircle, CalendarCheck, User, Phone, FileText, X, Clock, Truck, Store, QrCode } from 'lucide-react';
import { DeliveryMode } from '../types';

interface WaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  shopQrisUrl?: string;
  whatsappMessageText: string;
  pickupTime: string;
  setPickupTime: (val: string) => void;
  deliveryMode: DeliveryMode;
  setDeliveryMode: (val: DeliveryMode) => void;
  onCopy: () => void;
  onSubmitBookingAndSend: (customer: {
    customerName: string;
    customerPhone: string;
    notes: string;
    pickupTime: string;
    deliveryMode: DeliveryMode;
  }) => Promise<void>;
}

export const WaPreviewModal: React.FC<WaPreviewModalProps> = ({
  isOpen,
  onClose,
  shopName,
  shopQrisUrl,
  whatsappMessageText,
  pickupTime,
  setPickupTime,
  deliveryMode,
  setDeliveryMode,
  onCopy,
  onSubmitBookingAndSend,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showQris, setShowQris] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (customerName.trim().length < 2) {
      setFormError('Masukkan nama lengkap Anda (minimal 2 karakter).');
      return;
    }
    if (customerPhone.replace(/[^0-9]/g, '').length < 9) {
      setFormError('Masukkan nomor WhatsApp aktif yang valid.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitBookingAndSend({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
        pickupTime,
        deliveryMode,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat kode booking.');
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
              <CalendarCheck className="w-4 h-4 text-accent-text" />
              <span>Konfirmasi &amp; Kunci Jadwal Sewa</span>
            </h3>
            <p className="text-xs text-muted">
              Mencatat kode booking resmi &amp; meneruskan rincian ke Admin {shopName}
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

        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">
              Nama Penyewa (Sesuai KTP) *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="field pl-8 text-xs py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">
              Nomor WhatsApp Aktif *
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="field pl-8 text-xs py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">
                Jam Rencana Ambil
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="field pl-8 text-xs py-2 font-bold"
                >
                  {['08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(
                    (t) => (
                      <option key={t} value={t} className="bg-surface text-fg">
                        Jam {t}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">
                Pengambilan Unit
              </label>
              <div className="grid grid-cols-2 gap-1 bg-surface-2 border border-line p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('pickup')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    deliveryMode === 'pickup'
                      ? 'bg-accent text-accent-fg shadow-xs'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <Store className="w-3 h-3" />
                  <span>Di Toko</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode('delivery')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    deliveryMode === 'delivery'
                      ? 'bg-accent text-accent-fg shadow-xs'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <Truck className="w-3 h-3" />
                  <span>Diantar</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-subtle absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  deliveryMode === 'delivery'
                    ? 'Alamat lengkap pengantaran / patokan...'
                    : 'Keperluan acara / proyek...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="field pl-8 text-xs py-2"
              />
            </div>
          </div>

          {shopQrisUrl && (
            <div className="rounded-2xl border border-line bg-surface-2/60 p-2.5 space-y-2">
              <button
                type="button"
                onClick={() => setShowQris(!showQris)}
                className="w-full flex items-center justify-between text-xs font-bold text-accent-text cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Lihat QRIS Resmi Toko untuk Pembayaran DP</span>
                </span>
                <span className="text-[10px] underline">{showQris ? 'Tutup' : 'Buka QRIS'}</span>
              </button>
              {showQris && (
                <div className="bg-white p-2 rounded-xl border border-line text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shopQrisUrl}
                    alt={`QRIS ${shopName}`}
                    className="max-h-56 mx-auto object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-accent-soft/60 border border-accent/25 rounded-2xl p-3 text-[11px] text-fg font-mono whitespace-pre-line max-h-44 overflow-y-auto shadow-inner">
          {whatsappMessageText}
        </div>

        {formError && (
          <p className="text-xs font-semibold text-danger-text bg-danger-soft border border-danger/30 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="btn-glass px-4 py-3 text-xs flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4 text-accent-text" />
            <span>Salin</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="btn-brutal flex-1 py-3 text-xs flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{submitting ? 'Membuat Kode Booking...' : 'Buat Booking & Kirim WA'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
