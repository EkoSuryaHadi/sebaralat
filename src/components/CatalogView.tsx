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
import { isProPlanActive } from '../lib/validators';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  minDate?: string;
  setStartDate: (val: string) => void;
  durationDays: number;
  setDurationDays: (val: number) => void;
  durationOptions: DurationOption[];
  currentDurationObj: DurationOption;
  availabilityMap?: Record<string, number>;
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
  onSwitchRole?: (role: Role) => void;
  highlightedItemId?: string | null;
  onClearHighlightedItem?: () => void;
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
  minDate,
  setStartDate,
  durationDays,
  setDurationDays,
  durationOptions,
  currentDurationObj,
  availabilityMap,
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
  onSwitchRole,
  highlightedItemId,
  onClearHighlightedItem,
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

  const highlightedItem = highlightedItemId
    ? items.find((i) => i.id === highlightedItemId || i.sku === highlightedItemId)
    : undefined;

  const baseFilteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.specs && item.specs.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    if (!matchSearch) return false;

    if (selectedCategory === 'Semua') return true;
    if (selectedCategory === '🟢 Ready Saja') return item.status === 'available' && item.stock > 0;
    return item.category === selectedCategory;
  });

  const filteredItems = highlightedItem
    ? [highlightedItem, ...baseFilteredItems.filter((i) => i.id !== highlightedItem.id)]
    : baseFilteredItems;

  const isPro = isProPlanActive(shop) || Boolean(shop.isVerified);

  return (
    <div className="pb-32 bg-bg text-fg min-h-screen">
      {/* BANNER DEMO TOKO INTERAKTIF */}
      {(shop.slug === 'borneo-rental' || shop.slug === 'kaltim-kamera') && (
        <aside aria-label="Demo notice" className="glass bg-accent-soft/80 text-fg px-4 py-2.5 border-b border-accent/30 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            <span className="font-extrabold text-accent-text truncate">Demo Toko Aktif</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {currentRole === 'customer' ? (
              <button
                type="button"
                onClick={() => onSwitchRole?.('owner')}
                className="btn-glass px-2.5 py-1 text-[11px] font-extrabold text-accent-text flex items-center gap-1"
              >
                <span>Coba Panel Owner</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="btn-glass px-2.5 py-1 text-[11px] font-extrabold text-accent-text flex items-center gap-1"
              >
                <span>Masuk Workspace ({currentRole.toUpperCase()})</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* HEADER RESMI TOKO RENTAL */}
      <header className="relative overflow-hidden aurora border-b border-line p-5 sm:p-6">
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 shadow-md border border-line-strong bg-surface-2 flex items-center justify-center">
                {shop.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-accent to-accent-strong flex items-center justify-center">
                    <Tent className="w-7 h-7 text-accent-fg" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isPro ? (
                    <span className="chip bg-accent-soft border-accent/40 text-accent-text font-extrabold text-[10px] uppercase">
                      <BadgeCheck className="w-3.5 h-3.5 text-accent" />
                      Official Partner
                    </span>
                  ) : (
                    <span className="chip text-[10px]">
                      Katalog Rental
                    </span>
                  )}
                  <span className="chip text-[10px] bg-accent-soft/50 border-accent/20 text-accent-text">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Live Stok
                  </span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight leading-snug mt-1 text-fg truncate">
                  {shop.name}
                </h1>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">
                  {shop.tagline || 'Katalog Resmi Penyewaan Alat & Unit Operasional'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              <button
                onClick={onCopyLink}
                className="btn-glass p-2.5 rounded-xl"
                title="Bagikan Katalog"
                aria-label="Bagikan Katalog"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-accent-text" />
                ) : (
                  <Share2 className="w-4 h-4 text-fg-soft" />
                )}
              </button>
            </div>
          </div>

          {/* Bar Lokasi & Jam Operasional */}
          <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent-text shrink-0" />
              <span>{shop.location}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
              <span>{shop.hours}</span>
            </span>
          </div>

          {/* Syarat & Ketentuan Sewa */}
          <div className="glass rounded-2xl overflow-hidden border border-line">
            <button
              onClick={() => setShowTerms(!showTerms)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-bold text-fg-soft hover:bg-surface-2 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-warn-text shrink-0" />
                Ketentuan &amp; Jaminan Sewa
              </span>
              {showTerms ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </button>
            {showTerms && (
              <ul className="px-4 pb-3 pt-1 text-[11px] text-muted space-y-1.5 border-t border-line list-disc list-inside bg-surface-2/40">
                {(shop.terms || []).map((term, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {term}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* KALKULATOR TANGGAL & DURASI SEWA (STICKY GLASS) */}
      <section aria-label="Jadwal sewa" className="glass sticky top-0 z-30 px-4 py-3 border-b border-line">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-text" />
            Pilih Jadwal &amp; Durasi Sewa
          </span>
          {currentDurationObj.discountTag && (
            <span className="chip bg-accent-soft text-accent-text border-accent/30 font-extrabold text-[10px]">
              Promo {currentDurationObj.discountTag}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] text-muted font-bold mb-1">
              Tanggal Ambil
            </label>
            <input
              type="date"
              min={minDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="field text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold mb-1">
              Durasi Paket
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="field text-xs font-bold text-accent-text border-accent/40 bg-accent-soft/30"
            >
              {durationOptions.map((opt) => (
                <option key={opt.days} value={opt.days} className="bg-surface text-fg">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SEARCH & FILTER KATEGORI */}
      <section aria-label="Filter katalog" className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari unit atau spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="field pl-9 pr-4 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-fg text-bg shadow-sm'
                  : 'btn-glass text-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* DAFTAR ITEM KATALOG (BENTO CARDS) */}
      <main aria-label="Daftar unit katalog" className="px-4 space-y-3">
        {highlightedItem && (
          <div className="bento bg-accent-soft border-accent/40 p-3.5 flex items-center justify-between gap-2 shadow-md">
            <div className="min-w-0">
              <span className="chip bg-surface text-accent-text border-accent/30 text-[10px] font-extrabold uppercase">
                🏷️ Unit dari Scan Label QR Fisik
              </span>
              <p className="font-display text-sm font-bold text-fg truncate mt-1">{highlightedItem.name}</p>
            </div>
            {onClearHighlightedItem && (
              <button
                type="button"
                onClick={onClearHighlightedItem}
                className="btn-glass text-[11px] font-bold text-accent-text px-2.5 py-1.5 shrink-0"
              >
                Tampilkan Normal ✕
              </button>
            )}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="bento p-8 text-center space-y-1">
            <p className="font-display text-base font-bold text-fg">Unit tidak ditemukan</p>
            <p className="text-xs text-muted">
              Silakan gunakan kata kunci lain atau ubah filter kategori.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const effectiveStock =
              availabilityMap && typeof availabilityMap[item.id] === 'number'
                ? availabilityMap[item.id]
                : item.status === 'available'
                ? item.stock
                : 0;
            const isAvailable = item.status === 'available' && effectiveStock > 0;
            const isRented =
              item.status === 'rented' ||
              (item.status === 'available' && effectiveStock === 0);
            const calculatedPrice = item.pricePerDay * currentDurationObj.multiplier;
            const inCartQty = cart[item.id] || 0;
            const isQrHighlighted = highlightedItem?.id === item.id;

            return (
              <div
                key={item.id}
                className={`bento bento-hover overflow-hidden transition-all ${
                  isQrHighlighted
                    ? 'border-accent ring-2 ring-accent/40'
                    : inCartQty > 0
                    ? 'border-accent ring-1 ring-accent'
                    : 'border-line'
                }`}
              >
                <div className="p-3.5 sm:p-4 flex gap-3.5">
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden shrink-0 relative bg-surface-2 border border-line">
                    {item.imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] text-white font-bold px-1 py-0.5 bg-black/60 backdrop-blur-xs rounded-md text-center truncate">
                          {item.sku || item.category.split('/')[0]}
                        </span>
                      </>
                    ) : (
                      <div
                        className={`w-full h-full bg-linear-to-br ${item.imageBg} flex flex-col items-center justify-center`}
                      >
                        {renderItemIcon(item.iconType, 'w-8 h-8 text-white/95')}
                        <span className="text-[9px] text-white/90 font-bold mt-1.5 px-1.5 py-0.5 bg-black/25 rounded-md">
                          {item.sku || item.category.split('/')[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                      {isAvailable && (
                        <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          TERSEDIA ({effectiveStock} unit)
                        </span>
                      )}
                      {isRented && (
                        <span className="chip bg-danger-soft text-danger-text border-danger/30 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                          SEDANG DISEWA
                        </span>
                      )}
                      {item.status === 'maintenance' && (
                        <span className="chip bg-warn-soft text-warn-text border-warn/30 text-[10px]">
                          <Wrench className="w-2.5 h-2.5" />
                          DALAM PERAWATAN
                        </span>
                      )}
                    </div>

                    <h2 className="font-display font-extrabold text-sm sm:text-base text-fg leading-snug">
                      {item.name}
                    </h2>

                    <ul className="mt-1.5 space-y-0.5">
                      {(item.specs || []).map((spec, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-muted flex items-start gap-1.5"
                        >
                          <span className="text-accent-text font-bold">&bull;</span>
                          <span className="truncate">{spec}</span>
                        </li>
                      ))}
                    </ul>

                    {isRented && item.availableAt && (
                      <div className="mt-2 bg-danger-soft border border-danger/30 rounded-xl px-2.5 py-1 text-[11px] text-danger-text font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-danger" />
                        <span>
                          Tersedia kembali: <strong>{item.availableAt}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-surface-2/60 px-3.5 sm:px-4 py-2.5 border-t border-line flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-base font-extrabold text-fg">
                        {formatRp(calculatedPrice)}
                      </span>
                      <span className="text-[11px] text-muted font-medium">
                        / {durationDays} Hari
                      </span>
                    </div>
                    {durationDays > 1 && (
                      <p className="text-[10px] text-subtle">
                        Tarif harian: {formatRp(item.pricePerDay)}/hari
                      </p>
                    )}
                  </div>

                  {isAvailable ? (
                    inCartQty === 0 ? (
                      <button
                        onClick={() => onUpdateCartQty(item.id, 1, effectiveStock)}
                        className="btn-brutal px-3.5 py-2 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih Unit</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-surface border border-accent rounded-xl p-1 shadow-xs">
                        <button
                          onClick={() => onUpdateCartQty(item.id, -1, effectiveStock)}
                          className="w-7 h-7 rounded-lg bg-surface-2 text-fg hover:bg-surface-3 flex items-center justify-center cursor-pointer transition"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-display text-xs font-extrabold text-accent-text px-1">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => onUpdateCartQty(item.id, 1, effectiveStock)}
                          className="w-7 h-7 rounded-lg bg-accent text-accent-fg hover:bg-accent-strong flex items-center justify-center cursor-pointer transition font-bold"
                          aria-label="Tambah jumlah"
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
                      className="btn-glass px-3 py-1.5 text-[11px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-accent-text" />
                      <span>Booking Jadwal Lain</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* REKANAN RENTAL TERPERCAYA */}
      {shop.partnerShop && (
        <aside aria-label="Mitra rekanan" className="mx-4 mt-5 p-4 bento bg-surface flex items-center justify-between gap-3">
          <div>
            <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px] font-extrabold uppercase">
              <Users className="w-3 h-3" /> Mitra Rekanan Resmi
            </span>
            <p className="font-display text-xs font-bold text-fg mt-1">
              Cari perlengkapan kategori lain?
            </p>
            <p className="text-[11px] text-muted">
              Lihat katalog <strong>{shop.partnerShop.name}</strong>
            </p>
          </div>
          <button
            onClick={() => {
              const target = shops.find((s) => s.slug === shop.partnerShop?.slug);
              if (target) onSelectShop(target.slug);
            }}
            className="btn-glass text-xs px-3 py-2 shrink-0"
          >
            <span>Buka Katalog</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </aside>
      )}

      {/* FOOTER & AKSES INTERNAL */}
      <footer className="mt-10 mb-6 px-4 text-center space-y-3">
        <div className="border-t border-line pt-5 flex flex-col items-center gap-2">
          {!isPro ? (
            <>
              <div className="flex items-center gap-2 text-xs font-bold text-fg">
                <Image
                  src="/logo.svg"
                  alt="Sebaraja"
                  width={110}
                  height={28}
                  className="h-5 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/logo-dark.svg"
                  alt="Sebaraja"
                  width={110}
                  height={28}
                  className="h-5 w-auto object-contain hidden dark:block"
                />
                <span className="text-muted">• Powered by SebarAlat</span>
              </div>
              <p className="text-[11px] text-muted">
                Katalog digital &amp; manajemen stok gratis dari SebarAlat
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted font-medium">
              Katalog Resmi &bull; Layanan Terverifikasi
            </p>
          )}

          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
            {currentRole === 'customer' ? (
              <button
                onClick={onOpenAuthModal}
                className="btn-glass text-[11px] px-2.5 py-1"
              >
                <Lock className="w-3 h-3 text-accent-text" />
                <span>Login Staf / Owner</span>
              </button>
            ) : (
              <button
                onClick={onOpenWorkspace}
                className="btn-glass text-[11px] font-bold text-accent-text px-3 py-1"
              >
                Buka Panel Kerja ({currentRole.toUpperCase()}) &rarr;
              </button>
            )}

            {!isPro && (
              <>
                <span className="text-subtle">&bull;</span>
                <button
                  onClick={onNavigateHome}
                  className="text-[11px] font-bold text-accent-text hover:underline transition cursor-pointer"
                >
                  Daftarkan Usaha Rental Anda
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM CHECKOUT BAR (FLOATING GLASS DOCK + BRUTAL CTA) */}
      {cartSummary.totalUnits > 0 && (
        <aside aria-label="Ringkasan sewa" className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md sm:max-w-xl z-30 glass-strong rounded-2xl p-3 sm:p-4 shadow-2xl animate-rise border border-line-strong">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div>
              <span className="font-display text-xs sm:text-sm font-extrabold text-fg block">
                {cartSummary.totalUnits} Unit Dipilih ({durationDays} Hari)
              </span>
              <button
                onClick={onOpenCheckoutModal}
                className="text-[11px] text-accent-text font-bold hover:underline cursor-pointer"
              >
                Lihat rincian pesanan &rarr;
              </button>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted font-bold uppercase block">
                Total Estimasi
              </span>
              <span className="font-display text-base sm:text-lg font-black text-fg">
                {formatRp(cartSummary.totalCost)}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenCheckoutModal}
            className="btn-brutal w-full py-3.5 text-xs sm:text-sm"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>AJUKAN SEWA VIA WHATSAPP</span>
          </button>
        </aside>
      )}
    </div>
  );
};
