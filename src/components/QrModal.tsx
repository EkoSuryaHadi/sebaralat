'use client';

import React from 'react';
import { QrCode, Printer } from 'lucide-react';
import { RentalItem, Shop } from '../types';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  selectedQrItem: RentalItem | null;
  onPrint: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  shop,
  selectedQrItem,
  onPrint,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl text-center">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            🏷️ Label QR Inventaris
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            Tutup ✕
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-4 bg-slate-50 space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            {selectedQrItem ? `ASSET TAG • ${selectedQrItem.sku || 'UNIT'}` : 'OFFICIAL RENTAL CATALOG'}
          </p>
          <h4 className="text-sm font-black text-slate-900">
            {selectedQrItem ? selectedQrItem.name : shop.name}
          </h4>

          <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border border-slate-300 shadow-inner flex flex-col items-center justify-center">
            <QrCode className="w-28 h-28 text-slate-900 stroke-[1.5]" />
          </div>

          <p className="text-xs font-bold text-emerald-700">
            Scan untuk Cek Ketersediaan & Booking WA
          </p>
          <p className="text-[10px] font-mono text-slate-500">tebaralat.id/{shop.slug}</p>
        </div>

        <button
          onClick={onPrint}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Label QR</span>
        </button>
      </div>
    </div>
  );
};

