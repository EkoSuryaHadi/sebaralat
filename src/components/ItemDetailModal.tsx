'use client';

import React from 'react';
import {
  X,
  Plus,
  Minus,
  MessageCircle,
  Clock,
  Wrench,
  Tent,
  Zap,
  Hammer,
  Camera,
  Radio,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { RentalItem, DurationOption } from '../types';

interface ItemDetailModalProps {
  item: RentalItem | null;
  onClose: () => void;
  shopName: string;
  durationDays: number;
  currentDurationObj: DurationOption;
  effectiveStock: number;
  inCartQty: number;
  onUpdateCartQty: (itemId: string, delta: number, maxStock: number) => void;
  onOpenWhatsApp: (customText?: string) => void;
  formatRp: (num: number) => string;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  shopName,
  durationDays,
  currentDurationObj,
  effectiveStock,
  inCartQty,
  onUpdateCartQty,
  onOpenWhatsApp,
  formatRp,
}) => {
  if (!item) return null;

  const isAvailable = item.status === 'available' && effectiveStock > 0;
  const isRented =
    item.status === 'rented' || (item.status === 'available' && effectiveStock === 0);
  const calculatedPrice = Math.round(item.pricePerDay * currentDurationObj.multiplier);

  const renderItemIcon = (type: string, className = 'w-14 h-14 text-white/95') => {
    switch (type) {
      case 'tent':
        return <Tent className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'hammer':
        return <Hammer className={className} />;
      case 'camera':
        return <Camera className={className} />;
      case 'radio':
        return <Radio className={className} />;
      default:
        return <ShoppingBag className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="glass-strong text-fg border border-line-strong w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-bento sm:rounded-bento shadow-2xl animate-rise overflow-hidden">
        {/* Gambar Ukuran Penuh / Header Visual */}
        <div className="relative w-full h-56 sm:h-64 bg-surface-2 border-b border-line flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-linear-to-br ${item.imageBg} flex flex-col items-center justify-center gap-2`}
            >
              {renderItemIcon(item.iconType)}
              <span className="text-xs text-white/90 font-mono font-bold px-2.5 py-1 bg-black/30 rounded-lg">
                {item.sku || item.category}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs flex items-center justify-center transition cursor-pointer"
            aria-label="Tutup detail unit"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="chip bg-black/70 text-white border-white/20 text-[10px] font-mono font-bold backdrop-blur-xs">
              {item.sku || 'UNIT'}
            </span>
            <span className="chip bg-black/70 text-white border-white/20 text-[10px] font-bold uppercase backdrop-blur-xs">
              {item.category}
            </span>
          </div>
        </div>

        {/* Konten Detail & Spesifikasi Lengkap */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {isAvailable && (
                <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  TERSEDIA ({effectiveStock} unit)
                </span>
              )}
              {isRented && (
                <span className="chip bg-danger-soft text-danger-text border-danger/30 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                  SEDANG DISEWA
                </span>
              )}
              {item.status === 'maintenance' && (
                <span className="chip bg-warn-soft text-warn-text border-warn/30 text-[10px] font-extrabold">
                  <Wrench className="w-3 h-3" />
                  DALAM PERAWATAN
                </span>
              )}
              {currentDurationObj.discountTag && (
                <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px] font-extrabold">
                  Promo {currentDurationObj.discountTag}
                </span>
              )}
            </div>

            <h3 className="font-display text-lg sm:text-xl font-extrabold text-fg leading-snug">
              {item.name}
            </h3>
          </div>

          {isRented && item.availableAt && (
            <div className="bg-danger-soft border border-danger/30 rounded-2xl px-3.5 py-2.5 text-xs text-danger-text font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-danger" />
              <span>
                Estimasi tersedia kembali: <strong>{item.availableAt}</strong>
              </span>
            </div>
          )}

          {/* Spesifikasi Lengkap Tanpa Truncate */}
          <div className="bento p-3.5 bg-surface-2/70 border-line space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
              Spesifikasi &amp; Kelengkapan Unit
            </span>
            <ul className="space-y-1.5">
              {(item.specs && item.specs.length > 0
                ? item.specs
                : ['Kondisi prima & siap pakai operasional']
              ).map((spec, idx) => (
                <li
                  key={idx}
                  className="text-xs text-fg-soft flex items-start gap-2 leading-relaxed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-text shrink-0 mt-0.5" />
                  <span className="wrap-break-word">{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ringkasan Harga & Tombol Aksi */}
          <div className="pt-2 border-t border-line flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block">
                Tarif Sewa ({durationDays} Hari)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-xl font-black text-fg">
                  {formatRp(calculatedPrice)}
                </span>
                <span className="text-xs text-muted font-medium">
                  / {durationDays} Hari
                </span>
              </div>
              {durationDays > 1 && (
                <p className="text-[11px] text-subtle">
                  Tarif dasar: {formatRp(item.pricePerDay)} / hari
                </p>
              )}
            </div>

            {isAvailable ? (
              inCartQty === 0 ? (
                <button
                  type="button"
                  onClick={() => onUpdateCartQty(item.id, 1, effectiveStock)}
                  className="btn-brutal px-4 py-3 text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pilih Unit</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5 bg-surface border border-accent rounded-xl p-1.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateCartQty(item.id, -1, effectiveStock)}
                    className="w-8 h-8 rounded-lg bg-surface-2 text-fg hover:bg-surface-3 flex items-center justify-center cursor-pointer transition"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-display text-sm font-extrabold text-accent-text px-1.5">
                    {inCartQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateCartQty(item.id, 1, effectiveStock)}
                    className="w-8 h-8 rounded-lg bg-accent text-accent-fg hover:bg-accent-strong flex items-center justify-center cursor-pointer transition font-bold"
                    aria-label="Tambah jumlah"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWhatsApp(
                    `Halo Admin ${shopName}, saya ingin menanyakan jadwal ketersediaan unit *${item.name}* untuk tanggal lain.`
                  );
                }}
                className="btn-glass px-3.5 py-2.5 text-xs"
              >
                <MessageCircle className="w-4 h-4 text-accent-text" />
                <span>Booking Jadwal Lain</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
