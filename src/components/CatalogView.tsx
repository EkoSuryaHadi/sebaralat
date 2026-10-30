'use client';

import React from 'react';
import Image from 'next/image';
import {
  MapPin,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Share2,
  Plus,
  Minus,
  MessageCircle,
  Check,
  Calendar,
  Search,
  Wrench,
  Users,
  ExternalLink,
  Lock,
  Tent,
  Zap,
  Hammer,
  Camera,
  Radio,
  ShoppingBag,
  BadgeCheck,
} from 'lucide-react';
import { Shop, RentalItem, DurationOption, Role } from '../types';

interface CatalogViewProps {
  shop: Shop;
  shops: Shop[];
  items: RentalItem[];
  currentRole: Role;
  copiedLink: boolean;
  onCopyLink: () => void;
  showTerms: boolean;
  setShowTerms: (val: boolean) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  durationDays: number;
  setDurationDays: (val: number) => void;
  durationOptions: DurationOption[];
  currentDurationObj: DurationOption;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: string[];
  cart: Record<string, number>;
  onUpdateCartQty: (itemId: string, delta: number, maxStock: number) => void;
  onOpenWhatsApp: (customText?: string) => void;
  cartSummary: {
    selectedList: (RentalItem & { qty: number; subtotal: number })[];
    totalUnits: number;
    totalCost: number;
  };
  onOpenCheckoutModal: () => void;
  onOpenAuthModal: () => void;
  onOpenWorkspace: () => void;
  onSelectShop: (slug: string) => void;
  onNavigateHome: () => void;
  formatRp: (num: number) => string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  shop,
  shops,
  items,
  currentRole,
  copiedLink,
  onCopyLink,
  showTerms,
  setShowTerms,
  startDate,
  setStartDate,
  durationDays,
  setDurationDays,
  durationOptions,
  currentDurationObj,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  cart,
  onUpdateCartQty,
  onOpenWhatsApp,
  cartSummary,
  onOpenCheckoutModal,
  onOpenAuthModal,
  onOpenWorkspace,
  onSelectShop,
  onNavigateHome,
  formatRp,
}) => {
  const renderItemIcon = (type: string, className = 'w-8 h-8 text-white') => {
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

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.specs && item.specs.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    if (!matchSearch) return false;

    if (selectedCategory === 'Semua') return true;
    if (selectedCategory === '🟢 Ready Saja') return item.status === 'available' && item.stock > 0;
    return item.category === selectedCategory;
  });

  return (
    <div className="pb-28 bg-slate-50 min-h-screen">
      {/* HEADER RESMI TOKO RENTAL */}
      <div className="bg-slate-900 text-white p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/15 bg-slate-800 flex items-center justify-center">
              {shop.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={shop.logoUrl}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
                  <Tent className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" />
                  Official Partner
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Stok
                </span>
              </div>
              <h1 className="text-lg font-extrabold leading-snug mt-1 text-white">
                {shop.name}
              </h1>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {shop.tagline || 'Katalog Resmi Penyewaan Alat & Unit Operasional'}
              </p>
            </div>
          </div>

          <button
            onClick={onCopyLink}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition shrink-0"
            title="Bagikan Katalog"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Bar Lokasi & Jam Operasional */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{shop.location}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{shop.hours}</span>
          </span>
        </div>

        {/* Syarat & Ketentuan Sewa */}
        <div className="mt-3 bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTerms(!showTerms)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              Ketentuan & Jaminan Sewa
            </span>
            {showTerms ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {showTerms && (
            <ul className="px-4 pb-3 pt-1.5 text-[11px] text-slate-300 space-y-1.5 border-t border-slate-700/80 list-disc list-inside">
              {(shop.terms || []).map((term, idx) => (
                <li key={idx} className="leading-relaxed">
                  {term}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* KALKULATOR TANGGAL & DURASI SEWA */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Pilih Jadwal & Durasi Sewa
          </span>
          {currentDurationObj.discountTag && (
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Promo {currentDurationObj.discountTag}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
              Tanggal Ambil
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
              Durasi Paket
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full text-xs font-bold bg-emerald-50/70 border border-emerald-300 rounded-xl px-3 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {durationOptions.map((opt) => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER KATEGORI */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari unit atau spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* DAFTAR ITEM KATALOG */}
      <div className="px-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-sm font-bold text-slate-700">Unit tidak ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">
              Silakan gunakan kata kunci lain atau ubah filter kategori.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = item.status === 'available' && item.stock > 0;
            const isRented =
              item.status === 'rented' || (item.status === 'available' && item.stock === 0);
            const calculatedPrice = item.pricePerDay * currentDurationObj.multiplier;
            const inCartQty = cart[item.id] || 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm ${
                  inCartQty > 0
                    ? 'border-emerald-500 ring-1 ring-emerald-500'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="p-3.5 flex gap-3.5">
                  <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 relative shadow-inner bg-slate-100 border border-slate-200/80">
                    {item.imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white font-bold px-1 py-0.5 bg-black/60 backdrop-blur-xs rounded text-center truncate">
                          {item.sku || item.category.split('/')[0]}
                        </span>
                      </>
                    ) : (
                      <div
                        className={`w-full h-full bg-linear-to-br ${item.imageBg} flex flex-col items-center justify-center`}
                      >
                        {renderItemIcon(item.iconType, 'w-8 h-8 text-white/95')}
                        <span className="text-[9px] text-white/90 font-bold mt-1.5 px-1.5 py-0.5 bg-black/25 rounded">
                          {item.sku || item.category.split('/')[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      {isAvailable && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          TERSEDIA ({item.stock} unit)
                        </span>
                      )}
                      {isRented && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          SEDANG DISEWA
                        </span>
                      )}
                      {item.status === 'maintenance' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Wrench className="w-2.5 h-2.5" />
                          DALAM PERAWATAN
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {item.name}
                    </h3>

                    <ul className="mt-1.5 space-y-0.5">
                      {(item.specs || []).map((spec, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-slate-500 flex items-start gap-1.5"
                        >
                          <span className="text-emerald-500 font-bold">•</span>
                          <span className="truncate">{spec}</span>
                        </li>
                      ))}
                    </ul>

                    {isRented && item.availableAt && (
                      <div className="mt-2 bg-rose-50/80 border border-rose-200 rounded-lg px-2.5 py-1 text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>
                          Tersedia kembali: <strong>{item.availableAt}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/80 px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatRp(calculatedPrice)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        / {durationDays} Hari
                      </span>
                    </div>
                    {durationDays > 1 && (
                      <p className="text-[10px] text-slate-400">
                        Tarif harian: {formatRp(item.pricePerDay)}/hari
                      </p>
                    )}
                  </div>

                  {isAvailable ? (
                    inCartQty === 0 ? (
                      <button
                        onClick={() => onUpdateCartQty(item.id, 1, item.stock)}
                        className="bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih Unit</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-xl p-1">
                        <button
                          onClick={() => onUpdateCartQty(item.id, -1, item.stock)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-sm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-extrabold text-emerald-900 px-1.5">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => onUpdateCartQty(item.id, 1, item.stock)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() =>
                        onOpenWhatsApp(
                          `Halo Admin ${shop.name}, saya ingin menanyakan jadwal ketersediaan unit *${item.name}* untuk tanggal lain.`
                        )
                      }
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Booking Jadwal Lain</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REKANAN RENTAL TERPERCAYA */}
      {shop.partnerShop && (
        <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <Users className="w-3 h-3" /> Mitra Rekanan Resmi
            </span>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              Cari perlengkapan kategori lain?
            </p>
            <p className="text-[11px] text-slate-500">
              Lihat katalog <strong>{shop.partnerShop.name}</strong>
            </p>
          </div>
          <button
            onClick={() => {
              const target = shops.find((s) => s.slug === shop.partnerShop?.slug);
              if (target) onSelectShop(target.slug);
            }}
            className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
          >
            <span>Buka Katalog</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* FOOTER & AKSES INTERNAL */}
      <div className="mt-10 mb-6 px-4 text-center space-y-3">
        <div className="border-t border-slate-200 pt-5 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Image src="/logo.svg" alt="Sebaraja" width={110} height={28} className="h-5 w-auto object-contain" />
            <span>Powered by Sebaraja</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Sistem Katalog & Manajemen Status Inventaris Real-Time
          </p>

          <div className="flex items-center justify-center gap-3 mt-2">
            {currentRole === 'customer' ? (
              <button
                onClick={onOpenAuthModal}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition"
              >
                <Lock className="w-3 h-3" />
                <span>Login Staf / Owner</span>
              </button>
            ) : (
              <button
                onClick={onOpenWorkspace}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200"
              >
                Buka Panel Kerja ({currentRole.toUpperCase()}) →
              </button>
            )}

            <span className="text-slate-300">•</span>

            <button
              onClick={onNavigateHome}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition"
            >
              Daftarkan Usaha Rental Anda
            </button>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM CHECKOUT BAR */}
      {cartSummary.totalUnits > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div>
              <span className="text-xs font-extrabold text-slate-900">
                {cartSummary.totalUnits} Unit Dipilih ({durationDays} Hari)
              </span>
              <button
                onClick={onOpenCheckoutModal}
                className="block text-[11px] text-emerald-600 font-semibold hover:underline"
              >
                Lihat rincian pesanan
              </button>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Total Estimasi
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {formatRp(cartSummary.totalCost)}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenCheckoutModal}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>AJUKAN SEWA VIA WHATSAPP</span>
          </button>
        </div>
      )}
    </div>
  );
};

