'use client';

import React from 'react';
import { Copy, MessageCircle } from 'lucide-react';

interface WaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  whatsappMessageText: string;
  onCopy: () => void;
  onSend: () => void;
}

export const WaPreviewModal: React.FC<WaPreviewModalProps> = ({
  isOpen,
  onClose,
  shopName,
  whatsappMessageText,
  onCopy,
  onSend,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Pengajuan Sewa</h3>
            <p className="text-xs text-slate-500">Pesan terformat otomatis ke Admin {shopName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1"
          >
            Tutup ✕
          </button>
        </div>

        <div className="bg-[#DCF8C6]/60 border border-emerald-200 rounded-2xl p-3.5 text-xs text-slate-800 font-mono whitespace-pre-line max-h-60 overflow-y-auto shadow-inner">
          {whatsappMessageText}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>Salin</span>
          </button>

          <button
            onClick={onSend}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Kirim ke WhatsApp Resmi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

