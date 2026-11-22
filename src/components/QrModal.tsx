'use client';

import React, { useState } from 'react';
import { Printer, Copy, Check, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RentalItem, Shop } from '../types';
import { getPublicSiteOrigin } from '../lib/validators';

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

  if (!isOpen) return null;

  const baseUrl = getPublicSiteOrigin();

  const targetUrl = `${baseUrl}/${shop.slug}${selectedQrItem ? `?item=${selectedQrItem.id}` : ''}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="glass-strong text-fg w-full max-w-sm rounded-bento p-6 space-y-4 shadow-2xl text-center animate-rise border border-line-strong">
        <div className="flex items-center justify-between">
          <span className="chip uppercase tracking-wider text-[10px] font-extrabold text-accent-text bg-accent-soft border-accent/30">
            🏷️ Label QR Inventaris
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bento border-2 border-dashed border-line-strong rounded-2xl p-4 bg-surface-2/60 space-y-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
            {selectedQrItem ? `ASSET TAG • ${selectedQrItem.sku || 'UNIT'}` : 'OFFICIAL RENTAL CATALOG'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {selectedQrItem?.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedQrItem.imageUrl}
                alt=""
                className="w-7 h-7 rounded-lg object-cover border border-line shrink-0"
              />
            ) : !selectedQrItem && shop.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={shop.logoUrl}
                alt=""
                className="w-7 h-7 rounded-lg object-cover border border-line shrink-0"
              />
            ) : null}
            <h4 className="font-display text-sm font-extrabold text-fg truncate max-w-55">
              {selectedQrItem ? selectedQrItem.name : shop.name}
            </h4>
          </div>

          {/* QR Code Matrix Dinamis & Scannable (selalu background putih untuk keterbacaan scanner kamera) */}
          <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border border-slate-300 shadow-inner flex items-center justify-center">
            <QRCodeSVG
              value={targetUrl}
              size={136}
              level="M"
              includeMargin={false}
              className="w-full h-full"
            />
          </div>

          <p className="text-xs font-bold text-accent-text">
            Scan untuk Cek Ketersediaan &amp; Booking WA
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-muted">
            <span className="truncate max-w-50">{targetUrl.replace(/^https?:\/\//, '')}</span>
            <button
              onClick={handleCopyLink}
              title="Salin tautan"
              className="text-subtle hover:text-fg cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent-text" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPrint}
            className="btn-brutal flex-1 py-3 text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Label QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
