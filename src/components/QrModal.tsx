'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const targetUrl = baseUrl
    ? `${baseUrl}/${shop.slug}${selectedQrItem ? `?item=${selectedQrItem.id}` : ''}`
    : `https://sebaraja.com/${shop.slug}${selectedQrItem ? `?item=${selectedQrItem.id}` : ''}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl text-center">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            🏷️ Label QR Inventaris
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            Tutup ✕
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-800 rounded-2xl p-4 bg-slate-50 space-y-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            {selectedQrItem ? `ASSET TAG • ${selectedQrItem.sku || 'UNIT'}` : 'OFFICIAL RENTAL CATALOG'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {selectedQrItem?.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedQrItem.imageUrl}
                alt=""
                className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : !selectedQrItem && shop.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={shop.logoUrl}
                alt=""
                className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
              />
            ) : null}
            <h4 className="text-sm font-black text-slate-900 truncate max-w-55">
              {selectedQrItem ? selectedQrItem.name : shop.name}
            </h4>
          </div>

          {/* QR Code Matrix Dinamis & Scannable */}
          <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border border-slate-300 shadow-inner flex items-center justify-center">
            <QRCodeSVG
              value={targetUrl}
              size={136}
              level="M"
              includeMargin={false}
              className="w-full h-full"
            />
          </div>

          <p className="text-xs font-bold text-emerald-700">
            Scan untuk Cek Ketersediaan & Booking WA
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span className="truncate max-w-50">{targetUrl.replace(/^https?:\/\//, '')}</span>
            <button
              onClick={handleCopyLink}
              title="Salin tautan"
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPrint}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Label QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};


