'use client';

import React, { useState } from 'react';
import { Copy, MessageCircle, CalendarCheck, User, Phone, FileText } from 'lucide-react';

interface WaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  whatsappMessageText: string;
  onCopy: () => void;
  onSubmitBookingAndSend: (customer: {
    customerName: string;
    customerPhone: string;
    notes: string;
  }) => Promise<void>;
}

export const WaPreviewModal: React.FC<WaPreviewModalProps> = ({
  isOpen,
  onClose,
  shopName,
  whatsappMessageText,
  onCopy,
  onSubmitBookingAndSend,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
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
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat kode booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              <span>Konfirmasi & Kunci Jadwal Sewa</span>
            </h3>
            <p className="text-xs text-slate-500">
              Mencatat kode booking resmi & meneruskan rincian ke Admin {shopName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1"
          >
            Tutup ✕
          </button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Penyewa (Sesuai KTP) *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor WhatsApp Aktif *
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Jam ambil / keperluan proyek..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#DCF8C6]/60 border border-emerald-200 rounded-2xl p-3 text-[11px] text-slate-800 font-mono whitespace-pre-line max-h-44 overflow-y-auto shadow-inner">
          {whatsappMessageText}
        </div>

        {formError && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>Salin</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{submitting ? 'Membuat Kode Booking...' : 'Buat Booking & Kirim WA'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
